"""Shared utilities for atomic capabilities."""
from __future__ import annotations

from collections.abc import Awaitable
from typing import Any

from secmind_investigator.core.errors import DataSourceUnavailable


async def safe_ds_call(
    coro: Awaitable[Any], source: str
) -> tuple[Any, str | None]:
    """Run a data-source coroutine, converting DataSourceUnavailable to (None, reason).

    Use inside ``asyncio.gather`` so a single unreachable source degrades the
    capability to partial rather than aborting the whole gather.

    Returns ``(result, None)`` on success or ``(None, "DS-XXX: reason")`` on failure.
    """
    try:
        return await coro, None
    except DataSourceUnavailable as e:
        return None, f"{source}: {e.reason}"
