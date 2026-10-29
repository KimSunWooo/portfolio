#!/usr/bin/env python3
"""Compare product-list latency for a cold cache and a warm cache.

Talks only to 127.0.0.1 or localhost. Does not call the public site.
Cache-off means the Redis key for this query was deleted before the burst,
so the first requests miss. It is not a second build with caching removed.
"""

import argparse
import hashlib
import json
import os
import time
import urllib.error
import urllib.request
from urllib.parse import urlparse


def require_local(base_url: str) -> None:
    host = urlparse(base_url).hostname
    if host not in {"127.0.0.1", "localhost"}:
        raise SystemExit("refusing non-local base URL")


def percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, round((pct / 100) * (len(ordered) - 1))))
    return ordered[index]


def fetch(url: str, timeout: float) -> tuple[int, float, bytes]:
    started = time.perf_counter()
    request = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read()
            return response.status, (time.perf_counter() - started) * 1000, body
    except urllib.error.HTTPError as error:
        body = error.read()
        return error.code, (time.perf_counter() - started) * 1000, body


def burst(url: str, count: int, timeout: float) -> dict:
    latencies = []
    errors = 0
    bodies = []
    started = time.perf_counter()
    for _ in range(count):
        status, elapsed, body = fetch(url, timeout)
        latencies.append(elapsed)
        if status != 200:
            errors += 1
        bodies.append(body)
    elapsed = time.perf_counter() - started
    same = all(body == bodies[0] for body in bodies) if bodies else False
    return {
        "requests": count,
        "errors": errors,
        "error_rate": errors / count if count else 0,
        "elapsed_seconds": round(elapsed, 3),
        "throughput_rps": round(count / elapsed, 2) if elapsed else 0,
        "p50_ms": round(percentile(latencies, 50), 2),
        "p95_ms": round(percentile(latencies, 95), 2),
        "max_ms": round(max(latencies), 2) if latencies else 0,
        "first_ms": round(latencies[0], 2) if latencies else 0,
        "identical_bodies": same,
        "body_bytes": len(bodies[0]) if bodies else 0,
    }


def flush_product_list(redis_url: str, redis_container: str | None) -> int:
    import subprocess

    if redis_container:
        if redis_container != "portfolio-verify-redis":
            raise SystemExit("refusing redis container other than portfolio-verify-redis")
        prefix = ["docker", "exec", redis_container, "redis-cli"]
    else:
        parsed = urlparse(redis_url)
        host = parsed.hostname or "127.0.0.1"
        port = str(parsed.port or 6379)
        if host not in {"127.0.0.1", "localhost"}:
            raise SystemExit("refusing non-local redis")
        prefix = ["redis-cli", "-h", host, "-p", port]
    listed = subprocess.run(
        [*prefix, "--scan", "--pattern", "*productList*"],
        check=False,
        capture_output=True,
        text=True,
    )
    if listed.returncode != 0:
        raise SystemExit(listed.stderr.strip() or "redis-cli failed")
    keys = [line for line in listed.stdout.splitlines() if line]
    if not keys:
        return 0
    deleted = subprocess.run(
        [*prefix, "DEL", *keys],
        check=False,
        capture_output=True,
        text=True,
    )
    if deleted.returncode != 0:
        raise SystemExit(deleted.stderr.strip() or "redis-cli DEL failed")
    return int(deleted.stdout.strip() or "0")


def mysql_questions(container: str) -> int | None:
    if not container:
        return None
    if container != "portfolio-verify-mysql":
        raise SystemExit("refusing mysql container other than portfolio-verify-mysql")
    import subprocess

    result = subprocess.run(
        ["docker", "exec", "-e", "MYSQL_PWD", container, "mysql", "-uroot", "-N", "-e",
         "SHOW GLOBAL STATUS LIKE 'Questions'"],
        check=False,
        capture_output=True,
        text=True,
        env={**os.environ, "MYSQL_PWD": os.environ.get("PORTFOLIO_VERIFY_MYSQL_PASSWORD", "verify-db")},
    )
    if result.returncode != 0:
        raise SystemExit(result.stderr.strip() or "mysql status failed")
    parts = result.stdout.split()
    return int(parts[-1])


def one_with_questions(url: str, timeout: float, mysql_container: str | None) -> dict:
    before = mysql_questions(mysql_container) if mysql_container else None
    status, elapsed, body = fetch(url, timeout)
    after = mysql_questions(mysql_container) if mysql_container else None
    return {
        "status": status,
        "latency_ms": round(elapsed, 2),
        "body_bytes": len(body),
        "body_sha256": hashlib.sha256(body).hexdigest(),
        "mysql_questions_delta": None if before is None or after is None else after - before,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:18080")
    parser.add_argument("--path", default="/api/products")
    parser.add_argument("--requests", type=int, default=100)
    parser.add_argument("--timeout", type=float, default=5)
    parser.add_argument("--redis-url", default=os.environ.get("REDIS_URL", "redis://127.0.0.1:6380/0"))
    parser.add_argument("--redis-container", default=os.environ.get("REDIS_CONTAINER", ""))
    parser.add_argument("--mysql-container", default=os.environ.get("MYSQL_CONTAINER", ""))
    parser.add_argument("--skip-flush", action="store_true")
    args = parser.parse_args()
    require_local(args.base_url)
    url = args.base_url.rstrip("/") + args.path

    fetch(url, args.timeout)
    removed = None
    if not args.skip_flush:
        removed = flush_product_list(args.redis_url, args.redis_container or None)
    first_miss = one_with_questions(url, args.timeout, args.mysql_container or None)
    first_hit = one_with_questions(url, args.timeout, args.mysql_container or None)
    if not args.skip_flush:
        flush_product_list(args.redis_url, args.redis_container or None)
    second_miss = one_with_questions(url, args.timeout, args.mysql_container or None)
    second_hit = one_with_questions(url, args.timeout, args.mysql_container or None)
    warm = burst(url, args.requests, args.timeout)
    report = {
        "base_url": args.base_url,
        "path": args.path,
        "redis_keys_removed_before_first_miss": removed,
        "first_miss": first_miss,
        "first_hit": first_hit,
        "second_miss": second_miss,
        "second_hit": second_hit,
        "warm_burst_after_second_hit": warm,
        "bodies_match": first_miss["body_sha256"] == first_hit["body_sha256"] == second_miss["body_sha256"] == second_hit["body_sha256"],
        "note": "One unmeasured request runs first so JVM startup is not counted as a cache miss. Each miss follows a Redis flush. Requests are sequential in one process, not 50 virtual users. MySQL Questions counts every server question, not only the product SELECT.",
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
