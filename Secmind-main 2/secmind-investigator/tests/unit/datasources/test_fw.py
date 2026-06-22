"""Tests for DS-FW MockFwDataSource."""
from datetime import UTC, datetime, timedelta

from secmind_investigator.datasources.mocks import MockFwDataSource

NOW = datetime(2026, 5, 24, 10, 0, tzinfo=UTC)


def _make_flows() -> list[dict]:
    return [
        {
            "ts": NOW - timedelta(minutes=10),
            "src_ip": "10.0.0.5",
            "dst_ip": "8.8.8.8",
            "dst_port": 53,
            "proto": "UDP",
            "action": "allow",
            "bytes": 128,
        },
        {
            "ts": NOW - timedelta(minutes=5),
            "src_ip": "10.0.0.5",
            "dst_ip": "1.2.3.4",
            "dst_port": 443,
            "proto": "TCP",
            "action": "allow",
            "bytes": 4096,
        },
        {
            "ts": NOW - timedelta(minutes=3),
            "src_ip": "192.168.1.99",
            "dst_ip": "1.2.3.4",
            "dst_port": 443,
            "proto": "TCP",
            "action": "block",
            "bytes": 0,
        },
        {
            "ts": NOW - timedelta(days=2),
            "src_ip": "10.0.0.5",
            "dst_ip": "9.9.9.9",
            "dst_port": 80,
            "proto": "TCP",
            "action": "allow",
            "bytes": 512,
        },
    ]


async def test_filter_by_single_field() -> None:
    ds = MockFwDataSource(flows=_make_flows())
    results = await ds.list_flows(
        filter={"src_ip": "10.0.0.5"},
        since=NOW - timedelta(hours=1),
        until=NOW,
    )
    assert len(results) == 2
    assert all(r["src_ip"] == "10.0.0.5" for r in results)


async def test_filter_by_multiple_fields() -> None:
    ds = MockFwDataSource(flows=_make_flows())
    results = await ds.list_flows(
        filter={"dst_ip": "1.2.3.4", "proto": "TCP"},
        since=NOW - timedelta(hours=1),
        until=NOW,
    )
    assert len(results) == 2
    assert all(r["dst_ip"] == "1.2.3.4" and r["proto"] == "TCP" for r in results)


async def test_filter_by_action_block() -> None:
    ds = MockFwDataSource(flows=_make_flows())
    results = await ds.list_flows(
        filter={"action": "block"},
        since=NOW - timedelta(hours=1),
        until=NOW,
    )
    assert len(results) == 1
    assert results[0]["src_ip"] == "192.168.1.99"


async def test_window_filter_excludes_old_flows() -> None:
    ds = MockFwDataSource(flows=_make_flows())
    # All flows with src_ip=10.0.0.5 but old one is 2 days ago
    results = await ds.list_flows(
        filter={"src_ip": "10.0.0.5"},
        since=NOW - timedelta(hours=1),
        until=NOW,
    )
    assert len(results) == 2
    assert all(r["dst_ip"] != "9.9.9.9" for r in results)


async def test_empty_filter_returns_all_in_window() -> None:
    ds = MockFwDataSource(flows=_make_flows())
    results = await ds.list_flows(
        filter={},
        since=NOW - timedelta(hours=1),
        until=NOW,
    )
    # 3 flows are within the 1-hour window; old one is excluded
    assert len(results) == 3


async def test_limit_caps_results() -> None:
    flows = [
        {
            "ts": NOW - timedelta(seconds=i),
            "src_ip": "10.0.0.1",
            "dst_ip": "1.1.1.1",
            "dst_port": 80,
            "proto": "TCP",
            "action": "allow",
            "bytes": 100,
        }
        for i in range(20)
    ]
    ds = MockFwDataSource(flows=flows)
    results = await ds.list_flows(
        filter={},
        since=NOW - timedelta(minutes=1),
        until=NOW,
        limit=5,
    )
    assert len(results) == 5


async def test_no_match_returns_empty() -> None:
    ds = MockFwDataSource(flows=_make_flows())
    results = await ds.list_flows(
        filter={"src_ip": "99.99.99.99"},
        since=NOW - timedelta(hours=1),
        until=NOW,
    )
    assert results == []


async def test_healthcheck() -> None:
    ds = MockFwDataSource()
    assert await ds.healthcheck() is True
    await ds.close()
