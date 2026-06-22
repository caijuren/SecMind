"""Tests for the DataSource ABC and rate_limited decorator."""
import time

import anyio
import pytest

from secmind_investigator.datasources.base import DataSource, rate_limited
from secmind_investigator.datasources.mocks import InMemoryDataSource


def test_abstract_cannot_instantiate() -> None:
    with pytest.raises(TypeError):
        DataSource()  # type: ignore[abstract]


async def test_inmemory_healthcheck_ok() -> None:
    ds = InMemoryDataSource(id="DS-EDR")
    assert await ds.healthcheck() is True
    await ds.close()


async def test_inmemory_holds_seed_data() -> None:
    ds = InMemoryDataSource(id="DS-TEST", data={"k": 1})
    assert ds.data == {"k": 1}


async def test_rate_limit_enforces_minimum_interval() -> None:
    counter = {"n": 0}

    @rate_limited(rps=20.0)  # 50ms interval
    async def f() -> int:
        counter["n"] += 1
        return counter["n"]

    start = time.monotonic()
    async with anyio.create_task_group() as tg:
        for _ in range(5):
            tg.start_soon(f)
    elapsed = time.monotonic() - start

    # 5 calls at 50ms interval → ≥ ~200ms total. Allow generous lower bound for CI noise.
    assert counter["n"] == 5
    assert elapsed >= 0.15
