"""Shared state for isolated deploy tests. Not used in production."""

from __future__ import annotations

import json
import os
from pathlib import Path


def root() -> Path:
    return Path(os.environ["MOCK_STATE"])


def path() -> Path:
    return root() / "state.json"


def load() -> dict:
    return json.loads(path().read_text())


def save(state: dict) -> None:
    path().write_text(json.dumps(state))


def log(argv: list[str]) -> None:
    with (root() / "commands.log").open("a") as handle:
        handle.write(" ".join(argv) + "\n")


def fail_stage() -> str:
    return os.environ.get("FAIL_STAGE", "")
