#!/usr/bin/env python3
"""Compare product-list HTTP load with the cache disabled and warmed.

Starts only the verify-profile backend on 127.0.0.1:18080. Does not stop
containers it did not create. Each measured window is a fresh JVM with the
same detail-request warmup. Cache warming for the enabled mode happens before
the measured window.
"""

import json
import os
import signal
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
OUT = ROOT / "ops" / "perf" / "2026-10-29-cache-ab"
BASE = "http://127.0.0.1:18080"
PORT = 18080


def http_json(path: str):
    with urllib.request.urlopen(BASE + path, timeout=10) as response:
        body = response.read()
        return response.status, body


def wait_until_up(proc: subprocess.Popen, timeout: float = 180) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        if proc.poll() is not None:
            raise SystemExit(f"backend exited early: {proc.returncode}")
        try:
            # A missing product returns 404 and does not fill the list cache.
            http_json("/api/products/0")
            return
        except urllib.error.HTTPError:
            return
        except Exception:
            time.sleep(0.5)
    raise SystemExit("backend did not accept HTTP")


def stop_backend(proc: subprocess.Popen) -> None:
    if proc.poll() is not None:
        return
    os.killpg(proc.pid, signal.SIGTERM)
    try:
        proc.wait(timeout=20)
    except subprocess.TimeoutExpired:
        os.killpg(proc.pid, signal.SIGKILL)
        proc.wait(timeout=10)


def start_backend(enabled: bool) -> subprocess.Popen:
    flag = "true" if enabled else "false"
    log = open(OUT / "boot.log", "a")
    proc = subprocess.Popen(
        [
            "./gradlew", "bootRun", "--no-daemon",
            f"--args=--spring.profiles.active=verify --server.port={PORT} --app.cache.product-list.enabled={flag}",
        ],
        cwd=BACKEND,
        start_new_session=True,
        stdout=log,
        stderr=subprocess.STDOUT,
    )
    wait_until_up(proc)
    return proc


def mysql(sql: str) -> str:
    result = subprocess.run(
        ["docker", "exec", "-e", "MYSQL_PWD", "portfolio-verify-mysql", "mysql", "-uroot", "-N", "-e", sql, "portfolio_verify"],
        check=True,
        capture_output=True,
        text=True,
        env={**os.environ, "MYSQL_PWD": os.environ.get("PORTFOLIO_VERIFY_MYSQL_PASSWORD", "verify-db")},
    )
    return result.stdout


def seed_if_empty() -> None:
    count = int(mysql("SELECT COUNT(*) FROM products;").strip() or "0")
    if count:
        return
    mysql("""
INSERT INTO products (name, price, status, created_at, updated_at, stock, category)
WITH RECURSIVE seq AS (
  SELECT 1 AS n UNION ALL SELECT n + 1 FROM seq WHERE n < 50
)
SELECT CONCAT('cache-sample-', n), 1000, 'SALE', NOW(6), NOW(6), 10, 'sample' FROM seq;
INSERT INTO products (name, price, status, created_at, updated_at, stock, category)
VALUES
 ('cache-other-1', 1100, 'SALE', NOW(6), NOW(6), 4, 'other'),
 ('cache-other-2', 1200, 'SALE', NOW(6), NOW(6), 4, 'other'),
 ('cache-other-3', 1300, 'SALE', NOW(6), NOW(6), 4, 'other'),
 ('cache-hidden-1', 900, 'HIDDEN', NOW(6), NOW(6), 1, 'sample'),
 ('cache-hidden-2', 900, 'HIDDEN', NOW(6), NOW(6), 1, 'sample');
""")


def inventory() -> dict:
    rows = [line.split("\t") for line in mysql(
        "SELECT status, IFNULL(category,''), COUNT(*) FROM products GROUP BY status, category ORDER BY status, category;"
    ).splitlines() if line]
    return {"groups": [{"status": row[0], "category": row[1], "count": int(row[2])} for row in rows]}


def flush_product_list() -> None:
    listed = subprocess.run(
        ["docker", "exec", "portfolio-verify-redis", "redis-cli", "--scan", "--pattern", "*productList*"],
        check=True,
        capture_output=True,
        text=True,
    )
    keys = [line for line in listed.stdout.splitlines() if line]
    if keys:
        subprocess.run(
            ["docker", "exec", "portfolio-verify-redis", "redis-cli", "DEL", *keys],
            check=True,
            capture_output=True,
            text=True,
        )


def warmup_detail() -> None:
    product_id = mysql("SELECT id FROM products WHERE status='SALE' ORDER BY id LIMIT 1;").strip()
    for _ in range(30):
        status, _ = http_json(f"/api/products/{product_id}")
        if status != 200:
            raise SystemExit(f"detail warmup status {status}")


def snapshot(path: str) -> tuple[int, str, int]:
    status, body = http_json(path)
    return status, __import__("hashlib").sha256(body).hexdigest(), len(body)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "boot.log").write_text("")
    # Import sibling helpers without installing a package.
    import importlib.util
    spec = importlib.util.spec_from_file_location("measure_window", Path(__file__).with_name("measure_window.py"))
    measure = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(measure)

    proc = start_backend(False)
    try:
        seed_if_empty()
        data = inventory()
        sale = sum(item["count"] for item in data["groups"] if item["status"] == "SALE")
        sample = sum(item["count"] for item in data["groups"] if item["status"] == "SALE" and item["category"] == "sample")
        warmup_detail()
        off_all = snapshot("/api/products")
        off_sample = snapshot("/api/products?category=sample")
        before = measure.mysql_digests("portfolio-verify-mysql")
        for _ in range(5):
            http_json("/api/products")
        disabled_sql = measure.digest_delta(before, measure.mysql_digests("portfolio-verify-mysql"))
    finally:
        stop_backend(proc)

    proc = start_backend(True)
    try:
        warmup_detail()
        flush_product_list()
        before = measure.mysql_digests("portfolio-verify-mysql")
        miss = snapshot("/api/products")
        miss_sql = measure.digest_delta(before, measure.mysql_digests("portfolio-verify-mysql"))
        before = measure.mysql_digests("portfolio-verify-mysql")
        hit = snapshot("/api/products")
        hit_sql = measure.digest_delta(before, measure.mysql_digests("portfolio-verify-mysql"))
        miss_sample = snapshot("/api/products?category=sample")
        hit_sample = snapshot("/api/products?category=sample")
    finally:
        stop_backend(proc)

    accuracy = {
        "sale_count": sale,
        "sample_sale_count": sample,
        "inventory": data,
        "disabled_all_sha256": off_all[1],
        "disabled_sample_sha256": off_sample[1],
        "miss_all_sha256": miss[1],
        "hit_all_sha256": hit[1],
        "miss_sample_sha256": miss_sample[1],
        "hit_sample_sha256": hit_sample[1],
        "all_match": len({off_all[1], miss[1], hit[1]}) == 1 and off_all[0] == miss[0] == hit[0] == 200,
        "sample_match": len({off_sample[1], miss_sample[1], hit_sample[1]}) == 1 and off_sample[0] == miss_sample[0] == hit_sample[0] == 200,
        "all_response_bytes": off_all[2],
        "sample_response_bytes": off_sample[2],
        "data_note": "Isolated portfolio_verify only. SALE count includes the verify-profile seed row plus this experiment's sample rows. This is a different dataset from ops/perf/2026-10-29-product-list.json.",
        "disabled_five_requests_sql": disabled_sql,
        "enabled_miss_sql": miss_sql,
        "enabled_hit_sql": hit_sql,
    }
    (OUT / "accuracy.json").write_text(json.dumps(accuracy, indent=2) + "\n")
    if not accuracy["all_match"] or not accuracy["sample_match"]:
        raise SystemExit("response bytes differ between cache modes; load comparison stopped")
    if disabled_sql["product_list_selects"] < 5:
        raise SystemExit("cache disable did not execute a product list select per request")
    if miss_sql["product_list_selects"] < 1:
        raise SystemExit("cache miss did not execute the product list select")
    if hit_sql["product_list_selects"] != 0:
        raise SystemExit("warm hit still executed a product list select; investigation required")

    order = [("off", 1), ("on", 1), ("on", 2), ("off", 2), ("off", 3), ("on", 3)]
    runs = []
    for mode, iteration in order:
        proc = start_backend(mode == "on")
        try:
            current = inventory()
            if current != data:
                raise SystemExit(f"inventory changed before {mode} run {iteration}")
            warmup_detail()
            flush_product_list()
            if mode == "on":
                http_json("/api/products")
            label = f"{mode}-run-{iteration}"
            out = OUT / f"{label}.json"
            subprocess.run(
                [
                    "python3", str(Path(__file__).with_name("measure_window.py")),
                    "--base-url", BASE,
                    "--request-path", "/api/products",
                    "--vus", "10",
                    "--duration", "30s",
                    "--sleep-seconds", "0.5",
                    "--expected-count", str(sale),
                    "--label", label,
                    "--out", str(out),
                ],
                check=True,
            )
            report = json.loads(out.read_text())
            report["mode"] = "cache-disabled" if mode == "off" else "cache-warm"
            report["iteration"] = iteration
            report["inventory"] = current
            out.write_text(json.dumps(report, indent=2) + "\n")
            runs.append(report)
        finally:
            stop_backend(proc)
    versions = {
        "java": subprocess.check_output(["java", "-version"], stderr=subprocess.STDOUT, text=True).strip(),
        "spring_boot": "4.1.0",
        "mysql": mysql("SELECT VERSION();").strip(),
        "redis": subprocess.check_output(
            ["docker", "exec", "portfolio-verify-redis", "redis-server", "--version"], text=True
        ).strip(),
        "k6_image": "grafana/k6:0.54.0",
    }
    git_status = subprocess.check_output(["git", "status", "--short"], cwd=ROOT, text=True)
    head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    mem_kb = None
    for line in Path("/proc/meminfo").read_text().splitlines():
        if line.startswith("MemTotal:"):
            mem_kb = int(line.split()[1])
    summary = {
        "head": head,
        "dirty": bool(git_status.strip()),
        "git_status": git_status,
        "environment": {
            "nproc": os.cpu_count(),
            "mem_total_kb": mem_kb,
            "backend": "127.0.0.1:18080 spring profile verify",
            "mysql": "127.0.0.1:3307 portfolio-verify-mysql portfolio_verify",
            "redis": "127.0.0.1:6380 portfolio-verify-redis",
            "left_running": ["portfolio-frontend-web-1:3000", "portfolio-backend-api-1:8080"],
        },
        "versions": versions,
        "workload": {
            "vus": 10,
            "duration": "30s",
            "sleep_seconds": 0.5,
            "request_path": "/api/products",
            "order": ["off-1", "on-1", "on-2", "off-2", "off-3", "on-3"],
            "jvm_warmup": "30 GET /api/products/{firstSaleId} before each window",
            "cache_warmup": "one GET /api/products after JVM warmup, only for cache-warm, outside the SQL window",
            "sql_counter": "performance_schema statement digest delta during the k6 window only",
        },
        "accuracy": json.loads((OUT / "accuracy.json").read_text()),
        "runs": runs,
        "note": "p50, p95, and p99 are per run. They are not averaged into an overall percentile. Throughput includes the 0.5s sleep and is not maximum capacity.",
    }
    (OUT / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps({"runs": len(runs), "sale": sale}, indent=2))


if __name__ == "__main__":
    main()
