#!/usr/bin/env python3
"""Point Nginx /api proxy_pass at $service_url without touching TLS or the frontend proxy."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


PROXY_LITERAL = re.compile(
    r"^(\s*)proxy_pass\s+http://(?:127\.0\.0\.1|localhost):(\d+)([^;\s]*)\s*;\s*$"
)
PROXY_VARIABLE = re.compile(r"^(\s*)proxy_pass\s+\$service_url\s*;\s*$")
INCLUDE_LINE = re.compile(r"^\s*include\s+(\S+)\s*;\s*$")
FILE_HEADER = re.compile(r"(?m)^# configuration file (.+):\s*$")
LOCATION_HEADER = re.compile(
    r"location\s+(?:=\s+|~\*\s+|~\s+|\^~\s+)?(\S+)\s*\{"
)


class RewriteError(Exception):
    pass


def _scan_blocks(text: str) -> list[tuple[int, int, int]]:
    """Return (header_start, body_start, block_end) for each location block."""
    blocks: list[tuple[int, int, int]] = []
    i = 0
    n = len(text)
    while i < n:
        if text.startswith("location", i) and (i == 0 or text[i - 1].isspace()):
            brace = text.find("{", i)
            if brace == -1:
                break
            header = text[i : brace + 1]
            if LOCATION_HEADER.search(header):
                depth = 1
                j = brace + 1
                quote = ""
                while j < n and depth:
                    ch = text[j]
                    if quote:
                        if ch == "\\" and quote == '"':
                            j += 2
                            continue
                        if ch == quote:
                            quote = ""
                    elif ch in ("'", '"'):
                        quote = ch
                    elif ch == "#":
                        nl = text.find("\n", j)
                        j = n if nl == -1 else nl
                        continue
                    elif ch == "{":
                        depth += 1
                    elif ch == "}":
                        depth -= 1
                        if depth == 0:
                            blocks.append((i, brace + 1, j))
                            i = j
                            break
                    j += 1
                else:
                    raise RewriteError("location 블록의 중괄호가 닫히지 않았습니다.")
        i += 1
    return blocks


def _location_path(header: str) -> str:
    match = LOCATION_HEADER.search(header)
    if not match:
        raise RewriteError("location 경로를 읽지 못했습니다.")
    return match.group(1).strip("'\"")


def _is_api(path: str) -> bool:
    return path == "/api" or path.startswith("/api/")


def _rewrite_block(body: str, include_path: str) -> str:
    lines = body.splitlines(keepends=True)
    proxy_indexes = []
    include_ok = False
    for index, line in enumerate(lines):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        include = INCLUDE_LINE.match(stripped)
        if include and include.group(1) == include_path:
            include_ok = True
        if PROXY_VARIABLE.match(stripped) or PROXY_LITERAL.match(stripped):
            proxy_indexes.append(index)
    if len(proxy_indexes) != 1:
        raise RewriteError("/api location의 proxy_pass가 하나가 아닙니다.")
    index = proxy_indexes[0]
    raw = lines[index]
    newline = "\n" if raw.endswith("\n") else ""
    stripped = raw.strip()
    variable = PROXY_VARIABLE.match(stripped)
    literal = PROXY_LITERAL.match(stripped)
    if variable:
        if include_ok:
            return body
        indent = variable.group(1)
        lines.insert(index, f"{indent}include {include_path};{newline}")
        return "".join(lines)
    if not literal:
        raise RewriteError("/api proxy_pass 형식을 확인하지 못했습니다.")
    if literal.group(3):
        raise RewriteError(
            "/api proxy_pass에 URI 경로가 있습니다. 경로와 쿼리 전달을 바꾸지 않기 위해 중단합니다."
        )
    port = literal.group(2)
    if port not in {"8080", "8081", "8082"}:
        raise RewriteError(f"/api upstream 포트 {port}는 8080, 8081, 8082가 아닙니다.")
    indent = literal.group(1)
    lines[index] = (
        f"{indent}include {include_path};{newline}"
        f"{indent}proxy_pass $service_url;{newline}"
    )
    return "".join(lines)


def rewrite_text(text: str, include_path: str) -> str:
    if not include_path.startswith("/"):
        raise RewriteError("include 경로는 절대 경로여야 합니다.")
    blocks = _scan_blocks(text)
    api_spans = []
    for start, body_start, end in blocks:
        header = text[start:body_start]
        path = _location_path(header)
        if _is_api(path):
            api_spans.append((body_start, end))
    if not api_spans:
        raise RewriteError("/api location을 찾지 못했습니다. 설정을 덮어쓰지 않습니다.")
    updated = text
    # Rewrite from the end so earlier offsets stay valid.
    for body_start, end in reversed(api_spans):
        body = updated[body_start:end]
        updated = updated[:body_start] + _rewrite_block(body, include_path) + updated[end:]
    return updated


def assert_ready(dump: str, include_path: str) -> None:
    files = split_dump(dump)
    blobs = [body for _, body in files] or [dump]
    joined = "\n".join(blobs)
    if "proxy_pass http://localhost:3000" not in joined and "proxy_pass http://127.0.0.1:3000" not in joined:
        raise RewriteError("프런트엔드 proxy_pass가 없습니다.")
    blocks = _scan_blocks(joined)
    api_found = False
    for start, body_start, end in blocks:
        path = _location_path(joined[start:body_start])
        if not _is_api(path):
            continue
        api_found = True
        body = joined[body_start:end]
        if not any(
            INCLUDE_LINE.match(line.strip()) and INCLUDE_LINE.match(line.strip()).group(1) == include_path
            for line in body.splitlines()
            if line.strip() and not line.strip().startswith("#")
        ):
            raise RewriteError("/api location이 service-url.inc를 include하지 않습니다.")
        if not any(PROXY_VARIABLE.match(line.strip()) for line in body.splitlines()):
            raise RewriteError("/api location이 proxy_pass $service_url을 사용하지 않습니다.")
        if PROXY_LITERAL.search(body):
            raise RewriteError("/api location에 고정 upstream이 남아 있습니다.")
    if not api_found:
        raise RewriteError("배포 전 Nginx /api 정렬을 확인하지 못했습니다.")


def split_dump(dump: str) -> list[tuple[str, str]]:
    matches = list(FILE_HEADER.finditer(dump))
    files: list[tuple[str, str]] = []
    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(dump)
        files.append((match.group(1).strip(), dump[start:end]))
    return files


def ssl_lines(text: str) -> list[str]:
    return [line.strip() for line in text.splitlines() if "ssl_certificate" in line]


def self_test() -> None:
    sample = """server {
    listen 443 ssl;
    server_name swportfolioservices.com;
    ssl_certificate /etc/letsencrypt/live/swportfolioservices.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/swportfolioservices.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
"""
    include = "/etc/nginx/conf.d/service-url.inc"
    rewritten = rewrite_text(sample, include)
    assert "proxy_pass http://localhost:3000;" in rewritten
    assert "proxy_pass http://localhost:8080;" not in rewritten
    assert "include /etc/nginx/conf.d/service-url.inc;" in rewritten
    assert "proxy_pass $service_url;" in rewritten
    assert "proxy_set_header X-Forwarded-Proto $scheme;" in rewritten
    assert ssl_lines(sample) == ssl_lines(rewritten)
    again = rewrite_text(rewritten, include)
    assert again == rewritten
    dump = "# configuration file /etc/nginx/sites-enabled/site.conf:\n" + again
    assert_ready(dump, include)
    try:
        rewrite_text(sample.replace("proxy_pass http://localhost:8080;", "proxy_pass http://localhost:8080/;"), include)
    except RewriteError:
        pass
    else:
        raise SystemExit("URI proxy_pass was rewritten")
    try:
        assert_ready(dump.replace("proxy_pass $service_url;", "proxy_pass http://localhost:8080;"), include)
    except RewriteError:
        pass
    else:
        raise SystemExit("unaligned config was accepted")


def main() -> None:
    if len(sys.argv) == 2 and sys.argv[1] == "--self-test":
        self_test()
        return
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)

    rewrite = sub.add_parser("rewrite")
    rewrite.add_argument("--file", required=True)
    rewrite.add_argument("--include", required=True)
    rewrite.add_argument("--output", required=True)

    ready = sub.add_parser("assert-ready")
    ready.add_argument("--include", required=True)

    find = sub.add_parser("find-files")

    args = parser.parse_args()
    try:
        if args.cmd == "rewrite":
            source = Path(args.file).read_text()
            updated = rewrite_text(source, args.include)
            Path(args.output).write_text(updated)
            print("unchanged" if updated == source else "changed")
        elif args.cmd == "assert-ready":
            assert_ready(sys.stdin.read(), args.include)
        elif args.cmd == "find-files":
            files = split_dump(sys.stdin.read())
            if not files:
                raise RewriteError("nginx -T에서 configuration file 경로를 찾지 못했습니다.")
            for path, _ in files:
                print(path)
    except RewriteError as exc:
        print(f"nginx-api: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
