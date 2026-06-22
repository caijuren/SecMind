"""In-memory metric counters. Swap for OpenTelemetry in P1."""
from __future__ import annotations

from collections import defaultdict
from threading import Lock

_counters: dict[str, int] = defaultdict(int)
_lock = Lock()


def incr(name: str, value: int = 1) -> None:
    with _lock:
        _counters[name] += value


def snapshot() -> dict[str, int]:
    with _lock:
        return dict(_counters)


def reset() -> None:
    """For tests only — flush all counters."""
    with _lock:
        _counters.clear()
