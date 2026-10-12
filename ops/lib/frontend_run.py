#!/usr/bin/env python3
"""Build a docker run argument list from a saved frontend inspect."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def first_container(payload: object) -> dict:
    if isinstance(payload, list):
        if len(payload) != 1:
            raise SystemExit("expected one inspect object")
        return payload[0]
    if isinstance(payload, dict):
        return payload
    raise SystemExit("inspect JSON must be an object or a one-item list")


def publish_flags(inspect: dict) -> list[str]:
    bindings = (inspect.get("HostConfig") or {}).get("PortBindings") or {}
    flags: list[str] = []
    for container_port, hosts in bindings.items():
        if not hosts:
            continue
        dest = container_port.split("/")[0]
        for host in hosts:
            host_port = str(host.get("HostPort") or "")
            host_ip = str(host.get("HostIp") or "")
            if not host_port:
                continue
            if host_ip and host_ip not in ("0.0.0.0", "::"):
                flags.extend(["-p", f"{host_ip}:{host_port}:{dest}"])
            else:
                flags.extend(["-p", f"{host_port}:{dest}"])
    return flags


def mount_flags(inspect: dict) -> list[str]:
    flags: list[str] = []
    binds = (inspect.get("HostConfig") or {}).get("Binds") or []
    for bind in binds:
        flags.extend(["-v", str(bind)])
    if binds:
        return flags
    for mount in (inspect.get("Mounts") or []):
        source = mount.get("Source")
        dest = mount.get("Destination")
        if not source or not dest:
            continue
        spec = f"{source}:{dest}"
        if mount.get("Mode") == "ro" or mount.get("RW") is False:
            spec += ":ro"
        flags.extend(["-v", spec])
    return flags


def env_flags(inspect: dict, internal_api_url: str) -> list[str]:
    """Copy existing env except INTERNAL_API_URL, then set that key once.

    Docker keeps both --env-file and -e when the image ENV does not already
    contain the key. This command therefore never passes --env-file. The
    deployment target is explicit; it is not the last duplicated value.
    """
    flags: list[str] = []
    for item in (inspect.get("Config") or {}).get("Env") or []:
        if str(item).startswith("INTERNAL_API_URL="):
            continue
        flags.extend(["-e", str(item)])
    flags.extend(["-e", f"INTERNAL_API_URL={internal_api_url}"])
    return flags


def network_names(inspect: dict) -> list[str]:
    nets = (inspect.get("NetworkSettings") or {}).get("Networks") or {}
    return list(nets.keys())


def build_run(
    inspect: dict,
    *,
    name: str,
    image: str,
    internal_api_url: str,
    primary_network: str,
) -> tuple[list[str], list[str]]:
    if not internal_api_url.startswith("http://") or not internal_api_url.endswith(":8080"):
        raise SystemExit("INTERNAL_API_URL must be http://<container>:8080")
    args = [
        "docker",
        "run",
        "-d",
        "--name",
        name,
        "--restart",
        "unless-stopped",
        "--network",
        primary_network,
    ]
    user = ((inspect.get("Config") or {}).get("User") or "").strip()
    if user:
        args.extend(["--user", user])
    args.extend(env_flags(inspect, internal_api_url))
    args.extend(mount_flags(inspect))
    args.extend(publish_flags(inspect))
    args.append(image)
    extra = [net for net in network_names(inspect) if net != primary_network]
    return args, extra


def write_nul(path: Path, args: list[str]) -> None:
    data = b"".join(item.encode() + b"\0" for item in args)
    path.write_bytes(data)


def self_test() -> None:
    inspect = {
        "Config": {
            "User": "",
            "Env": [
                "INTERNAL_API_URL=http://backend-api:8080",
                "INTERNAL_API_URL=http://portfolio-backend-green:8080",
                "NEXT_PUBLIC_API_URL=https://swportfolioservices.com",
                "CUSTOM_KEEP=keep-me",
            ],
        },
        "HostConfig": {
            "Binds": ["/var/log/portfolio:/logs:ro"],
            "PortBindings": {"3000/tcp": [{"HostIp": "", "HostPort": "3000"}]},
        },
        "NetworkSettings": {"Networks": {"portfolio_default": {}, "extra_net": {}}},
        "Mounts": [],
    }
    args, extra = build_run(
        inspect,
        name="portfolio-frontend",
        image="example/portfolio-frontend:abc",
        internal_api_url="http://portfolio-backend-blue:8080",
        primary_network="portfolio_default",
    )
    assert args[0:8] == [
        "docker",
        "run",
        "-d",
        "--name",
        "portfolio-frontend",
        "--restart",
        "unless-stopped",
        "--network",
    ]
    assert "portfolio_default" in args
    internal = [
        args[index + 1]
        for index, token in enumerate(args)
        if token == "-e" and args[index + 1].startswith("INTERNAL_API_URL=")
    ]
    assert internal == ["INTERNAL_API_URL=http://portfolio-backend-blue:8080"]
    assert "--env-file" not in args
    assert "http://backend-api:8080" not in args
    assert "CUSTOM_KEEP=keep-me" in args
    assert "NEXT_PUBLIC_API_URL=https://swportfolioservices.com" in args
    assert "/var/log/portfolio:/logs:ro" in args
    assert "3000:3000" in args
    assert args[-1] == "example/portfolio-frontend:abc"
    assert extra == ["extra_net"]
    try:
        build_run(
            inspect,
            name="portfolio-frontend",
            image="example/portfolio-frontend:latest",
            internal_api_url="http://portfolio-backend-blue:8080/api",
            primary_network="portfolio_default",
        )
    except SystemExit:
        pass
    else:
        raise SystemExit("invalid INTERNAL_API_URL was accepted")


def main() -> None:
    if len(sys.argv) == 2 and sys.argv[1] == "--self-test":
        self_test()
        return
    parser = argparse.ArgumentParser()
    parser.add_argument("--name", required=True)
    parser.add_argument("--image", required=True)
    parser.add_argument("--internal-api-url", required=True)
    parser.add_argument("--network", required=True)
    parser.add_argument("--out-dir", required=True)
    args = parser.parse_args()
    inspect = first_container(json.load(sys.stdin))
    run_args, extra = build_run(
        inspect,
        name=args.name,
        image=args.image,
        internal_api_url=args.internal_api_url,
        primary_network=args.network,
    )
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    write_nul(out / "args.nul", run_args)
    (out / "networks.txt").write_text("".join(f"{net}\n" for net in extra))


if __name__ == "__main__":
    main()
