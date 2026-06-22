"""Abstract data source contract + rate-limiter decorator."""
from __future__ import annotations

import time
from abc import ABC, abstractmethod
from collections.abc import Awaitable, Callable
from functools import wraps
from threading import Lock
from typing import TypeVar

T = TypeVar("T")


class DataSource(ABC):
    """Abstract data source. One concrete subclass per DS-XXX vendor implementation."""

    id: str

    @abstractmethod
    async def healthcheck(self) -> bool: ...

    @abstractmethod
    async def close(self) -> None: ...


def rate_limited(
    rps: float,
) -> Callable[[Callable[..., Awaitable[T]]], Callable[..., Awaitable[T]]]:
    """Simple async rate-limiter: enforces a minimum interval of 1/rps seconds between calls.

    Per-decorator state (not per-instance); attach a fresh decorator per data-source client.
    """
    interval = 1.0 / rps
    last = [0.0]
    lock = Lock()

    def deco(fn: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @wraps(fn)
        async def wrapper(*args: object, **kwargs: object) -> T:
            import anyio

            with lock:
                now = time.monotonic()
                wait = max(0.0, last[0] + interval - now)
                last[0] = max(now, last[0] + interval)
            if wait > 0:
                await anyio.sleep(wait)
            return await fn(*args, **kwargs)

        return wrapper

    return deco
