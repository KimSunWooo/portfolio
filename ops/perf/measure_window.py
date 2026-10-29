#!/usr/bin/env python3
"""Measure one product-list window against a local server.

The k6 run includes think time, so its throughput is not a maximum capacity.
SQL counts come from performance_schema statement digests on the isolated
MySQL container. They are not MySQL's global Questions counter.
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse


def require_local(base_url: str) -> None:
    host = urlparse(base_url).hostname
    if host not in {"127.0.0.1", "localhost"}:
        raise SystemExit("refusing non-local BASE_URL")


def mysql_digests(container: str) -> dict[str, int]:
    if container != "portfolio-verify-mysql":
        raise SystemExit("refusing mysql container other than portfolio-verify-mysql")
    query = (
        "SELECT REPLACE(REPLACE(IFNULL(DIGEST_TEXT,''), '\\n', ' '), '\\t', ' '), COUNT_STAR "
        "FROM performance_schema.events_statements_summary_by_digest"
    )
    result = subprocess.run(
        ["docker", "exec", "-e", "MYSQL_PWD", container, "mysql", "-uroot", "-N", "-e", query],
        check=False,
        capture_output=True,
        text=True,
        env={**os.environ, "MYSQL_PWD": os.environ.get("PORTFOLIO_VERIFY_MYSQL_PASSWORD", "verify-db")},
    )
    if result.returncode != 0:
        raise SystemExit(result.stderr.strip() or "mysql digest query failed")
    counts: dict[str, int] = {}
    for line in result.stdout.splitlines():
        if not line.strip():
            continue
        text, _, count = line.rpartition("\t")
        counts[text] = int(count)
    return counts


def is_product_list_select(digest: str) -> bool:
    normalized = " ".join(digest.lower().split())
    return (
        normalized.startswith("select")
        and "from `products`" in normalized
        and "order by" in normalized
    )


def digest_delta(before: dict[str, int], after: dict[str, int]) -> dict:
    product = 0
    other = 0
    product_texts = []
    other_texts = []
    for text, count in after.items():
        delta = count - before.get(text, 0)
        if delta <= 0:
            continue
        if "performance_schema" in text.lower() or "events_statements_summary_by_digest" in text.lower():
            continue
        item = {"count": delta, "digest": text[:2000]}
        if is_product_list_select(text):
            product += delta
            product_texts.append(item)
        else:
            other += delta
            other_texts.append(item)
    other_texts.sort(key=lambda item: item["count"], reverse=True)
    return {
        "product_list_selects": product,
        "other_statements": other,
        "product_list_digests": product_texts,
        "other_digest_sample": other_texts[:8],
        "counter": "performance_schema.events_statements_summary_by_digest COUNT_STAR delta",
    }


def run_k6(args: argparse.Namespace, summary_path: Path) -> None:
    script_dir = Path(__file__).resolve().parent
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    env = {
        "BASE_URL": args.base_url,
        "REQUEST_PATH": args.request_path,
        "VUS": str(args.vus),
        "DURATION": args.duration,
        "SLEEP_SECONDS": str(args.sleep_seconds),
        "EXPECTED_COUNT": str(args.expected_count),
        "SUMMARY_PATH": "/out/" + summary_path.name,
    }
    command = [
        "docker", "run", "--rm", "--network", "host",
        "--user", f"{os.getuid()}:{os.getgid()}",
        "-v", f"{script_dir}:/scripts:ro",
        "-v", f"{summary_path.parent.resolve()}:/out",
        "-e", "BASE_URL", "-e", "REQUEST_PATH", "-e", "VUS", "-e", "DURATION",
        "-e", "SLEEP_SECONDS", "-e", "EXPECTED_COUNT", "-e", "SUMMARY_PATH",
        args.k6_image, "run", "--quiet", "/scripts/product-list.k6.js",
    ]
    result = subprocess.run(command, env={**os.environ, **env}, text=True)
    if result.returncode != 0:
        raise SystemExit(f"k6 failed with exit {result.returncode}")


def metric(summary: dict, name: str, field: str):
    return summary["metrics"][name]["values"][field]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--request-path", default="/api/products")
    parser.add_argument("--vus", type=int, default=10)
    parser.add_argument("--duration", default="30s")
    parser.add_argument("--sleep-seconds", type=float, default=0.5)
    parser.add_argument("--expected-count", type=int, required=True)
    parser.add_argument("--mysql-container", default="portfolio-verify-mysql")
    parser.add_argument("--k6-image", default="grafana/k6:0.54.0")
    parser.add_argument("--label", required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    require_local(args.base_url)
    if args.vus < 1 or args.sleep_seconds < 0:
        raise SystemExit("VU and sleep must be non-negative, VU at least 1")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    summary_path = args.out.parent / f"{args.label}.k6.json"
    before = mysql_digests(args.mysql_container)
    try:
        run_k6(args, summary_path)
    finally:
        after = mysql_digests(args.mysql_container)
    if not summary_path.exists():
        raise SystemExit("k6 summary was not written")
    summary = json.loads(summary_path.read_text())
    checks = metric(summary, "checks", "rate")
    failed = metric(summary, "http_req_failed", "rate")
    requests = metric(summary, "http_reqs", "count")
    sql = digest_delta(before, after)
    report = {
        "label": args.label,
        "base_url": args.base_url,
        "request_path": args.request_path,
        "vus": args.vus,
        "duration": args.duration,
        "sleep_seconds": args.sleep_seconds,
        "expected_count": args.expected_count,
        "requests": requests,
        "throughput_rps": metric(summary, "http_reqs", "rate"),
        "http_error_rate": failed,
        "check_rate": checks,
        "p50_ms": metric(summary, "http_req_duration", "p(50)"),
        "p95_ms": metric(summary, "http_req_duration", "p(95)"),
        "p99_ms": metric(summary, "http_req_duration", "p(99)"),
        "sql": sql,
        "sql_per_request": None if not requests else sql["product_list_selects"] / requests,
        "throughput_note": "Throughput includes the fixed sleep and is not a maximum server capacity.",
    }
    args.out.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: report[k] for k in ("label", "requests", "throughput_rps", "http_error_rate", "p50_ms", "p95_ms", "p99_ms", "sql_per_request")}))
    if checks < 1 or failed != 0:
        raise SystemExit("response checks failed")


if __name__ == "__main__":
    try:
        main()
    except KeyError as error:
        print(f"missing k6 metric {error}", file=sys.stderr)
        raise SystemExit(1) from error
