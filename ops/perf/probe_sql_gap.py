#!/usr/bin/env python3
"""Compare application counters with the MySQL digest delta.

This does not replace ops/perf/2026-10-29-cache-ab. The JVM under test also
registers a statement inspector, so latency from this run is not the earlier
comparison. Counters are snapshotted after warmup and again after the requests
in that step have returned.
"""

import importlib.util
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
OUT = ROOT / "ops" / "perf" / "2026-10-30-sql-gap"
BASE = "http://127.0.0.1:18080"
PORT = 18080


def http_json(path: str):
    with urllib.request.urlopen(BASE + path, timeout=10) as response:
        return response.status, response.read()


def wait_until_up(proc: subprocess.Popen, timeout: float = 180) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        if proc.poll() is not None:
            raise SystemExit(f"backend exited early: {proc.returncode}")
        try:
            http_json("/api/products/0")
            return
        except urllib.error.HTTPError:
            return
        except Exception:
            time.sleep(0.5)
    raise SystemExit("backend did not accept HTTP")


def start_backend(cache_enabled: bool) -> subprocess.Popen:
    flag = "true" if cache_enabled else "false"
    log = open(OUT / "boot.log", "a")
    proc = subprocess.Popen(
        [
            "./gradlew", "bootRun", "--no-daemon",
            "--args=--spring.profiles.active=verify "
            f"--server.port={PORT} "
            f"--app.cache.product-list.enabled={flag} "
            "--app.observability.product-list.enabled=true",
        ],
        cwd=BACKEND,
        start_new_session=True,
        stdout=log,
        stderr=subprocess.STDOUT,
    )
    wait_until_up(proc)
    return proc


def stop_backend(proc: subprocess.Popen) -> None:
    if proc.poll() is not None:
        return
    os.killpg(proc.pid, signal.SIGTERM)
    try:
        proc.wait(timeout=20)
    except subprocess.TimeoutExpired:
        os.killpg(proc.pid, signal.SIGKILL)
        proc.wait(timeout=10)


def mysql(sql: str) -> str:
    result = subprocess.run(
        [
            "docker", "exec", "-e", "MYSQL_PWD", "portfolio-verify-mysql",
            "mysql", "-uroot", "-N", "-e", sql, "portfolio_verify",
        ],
        check=True,
        capture_output=True,
        text=True,
        env={**os.environ, "MYSQL_PWD": os.environ.get("PORTFOLIO_VERIFY_MYSQL_PASSWORD", "verify-db")},
    )
    return result.stdout


def observation() -> dict:
    status, body = http_json("/internal/product-list-observation")
    if status != 200:
        raise SystemExit(f"observation status {status}")
    return json.loads(body)


def counter_delta(before: dict, after: dict) -> dict:
    keys = (
        "httpListRequests",
        "serviceEntries",
        "productListSelects",
        "otherProductTableStatements",
    )
    return {key: after[key] - before[key] for key in keys}


def warmup_detail() -> None:
    product_id = mysql("SELECT id FROM products WHERE status='SALE' ORDER BY id LIMIT 1;").strip()
    if not product_id:
        raise SystemExit("no SALE product for warmup")
    for _ in range(30):
        status, _ = http_json(f"/api/products/{product_id}")
        if status != 200:
            raise SystemExit(f"detail warmup status {status}")


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


def load_measure():
    spec = importlib.util.spec_from_file_location("measure_window", Path(__file__).with_name("measure_window.py"))
    measure = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(measure)
    return measure


def compose(argument: str) -> None:
    command = ["docker", "compose", "-p", "portfolio-verify", "-f", "compose.verify.yml", argument]
    if argument == "up":
        command.append("-d")
    subprocess.run(command, cwd=ROOT, check=argument != "down")


def redact_boot_log() -> None:
    path = OUT / "boot.log"
    if not path.exists():
        return
    lines = []
    for line in path.read_text(errors="replace").splitlines(keepends=True):
        if "Using generated security password:" in line:
            lines.append("Using generated security password: [redacted]\n")
        else:
            lines.append(line)
    path.write_text("".join(lines))


def digest_status() -> dict:
    lost = mysql(
        "SHOW GLOBAL STATUS WHERE Variable_name IN "
        "('Performance_schema_digest_lost','Performance_schema_nested_statement_lost');"
    )
    prepared = mysql(
        "SELECT COUNT_EXECUTE, LEFT(REPLACE(REPLACE(IFNULL(SQL_TEXT,''), CHAR(10), ' '), CHAR(9), ' '), 240) "
        "FROM performance_schema.prepared_statements_instances "
        "WHERE SQL_TEXT LIKE '%products%';"
    )
    return {
        "status": lost.strip(),
        "prepared_statements_mentioning_products": prepared.strip(),
    }


def main() -> None:
    if "2026-10-29-cache-ab" in str(OUT):
        raise SystemExit("refusing to write into the earlier experiment")
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "boot.log").write_text("")
    measure = load_measure()
    compose("up")
    report = {
        "experiment": "application counters versus digest delta",
        "replaces_prior_result": False,
        "prior_result": "ops/perf/2026-10-29-cache-ab/summary.json",
        "head": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
        "steps": [],
    }
    proc = start_backend(False)
    try:
        sale = int(mysql("SELECT COUNT(*) FROM products WHERE status='SALE';").strip() or "0")
        report["sale_count"] = sale
        warmup_detail()
        before_obs = observation()
        before_digest = measure.mysql_digests("portfolio-verify-mysql")
        statuses = []
        for _ in range(20):
            status, _ = http_json("/api/products")
            statuses.append(status)
        after_obs = observation()
        after_digest = measure.mysql_digests("portfolio-verify-mysql")
        sequential = {
            "name": "cache-disabled-sequential-20",
            "requests_sent": 20,
            "statuses": statuses,
            "application_delta": counter_delta(before_obs, after_obs),
            "digest": measure.digest_delta(before_digest, after_digest),
            "order": "warmup completed, counters read, 20 GET /api/products completed, counters read",
        }
        report["steps"].append(sequential)
        app = sequential["application_delta"]
        if app["httpListRequests"] != 20 or app["serviceEntries"] != 20 or app["productListSelects"] != 20:
            report["stopped"] = "sequential counters did not match 20 list requests; concurrent window was not run"
            (OUT / "probe.json").write_text(json.dumps(report, indent=2) + "\n")
            raise SystemExit(report["stopped"])

        before_obs = observation()
        out = OUT / "disabled-concurrent.json"
        subprocess.run(
            [
                "python3", str(Path(__file__).with_name("measure_window.py")),
                "--base-url", BASE,
                "--request-path", "/api/products",
                "--vus", "10",
                "--duration", "30s",
                "--sleep-seconds", "0.5",
                "--expected-count", str(sale),
                "--label", "disabled-concurrent",
                "--out", str(out),
            ],
            check=True,
        )
        after_obs = observation()
        concurrent = json.loads(out.read_text())
        concurrent["application_delta"] = counter_delta(before_obs, after_obs)
        concurrent["digest_status_after"] = digest_status()
        concurrent["note"] = (
            "Same VU, duration, and sleep as the 2026-10-29 disabled windows, "
            "but this JVM registers a statement inspector. Not a latency rerun."
        )
        report["steps"].append({"name": "cache-disabled-concurrent", "result": concurrent})
    finally:
        stop_backend(proc)

    proc = start_backend(True)
    try:
        warmup_detail()
        flush_product_list()
        before = observation()
        before_digest = measure.mysql_digests("portfolio-verify-mysql")
        http_json("/api/products")
        miss = observation()
        miss_digest = measure.mysql_digests("portfolio-verify-mysql")
        for _ in range(5):
            http_json("/api/products")
        hit = observation()
        hit_digest = measure.mysql_digests("portfolio-verify-mysql")
        report["steps"].append({
            "name": "cache-enabled-one-miss-then-five-hits",
            "miss_application_delta": counter_delta(before, miss),
            "miss_digest": measure.digest_delta(before_digest, miss_digest),
            "hit_application_delta": counter_delta(miss, hit),
            "hit_digest": measure.digest_delta(miss_digest, hit_digest),
            "order": "detail warmup, productList keys deleted, counters read, one list GET, counters read, five list GETs, counters read",
        })
    finally:
        stop_backend(proc)
    redact_boot_log()
    (OUT / "probe.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"steps": [step["name"] for step in report["steps"]], "sale": report["sale_count"]}))


if __name__ == "__main__":
    try:
        main()
    finally:
        redact_boot_log()
        compose("down")
