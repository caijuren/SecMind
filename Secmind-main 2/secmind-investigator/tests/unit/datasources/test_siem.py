"""Tests for DS-SIEM MockSiemDataSource."""
from datetime import UTC, datetime, timedelta

from secmind_investigator.datasources.mocks import MockSiemDataSource

NOW = datetime(2026, 5, 24, 10, 0, tzinfo=UTC)


def _make_events() -> list[dict]:
    return [
        {
            "ts": NOW - timedelta(minutes=10),
            "src_ip": "10.0.0.5",
            "event_type": "login_failure",
            "user": "alice",
        },
        {
            "ts": NOW - timedelta(minutes=5),
            "src_ip": "10.0.0.5",
            "event_type": "login_success",
            "user": "alice",
        },
        {
            "ts": NOW - timedelta(days=2),
            "src_ip": "192.168.1.1",
            "event_type": "login_failure",
            "user": "bob",
        },
        {
            "ts": NOW - timedelta(minutes=1),
            "src_ip": "10.0.0.99",
            "event_type": "privilege_escalation",
            "user": "alice",
        },
    ]


async def test_search_returns_matches_in_window() -> None:
    ds = MockSiemDataSource(events=_make_events())
    results = await ds.search(
        query="login_failure",
        since=NOW - timedelta(hours=1),
        until=NOW,
    )
    assert len(results) == 1
    assert results[0]["event_type"] == "login_failure"
    assert results[0]["user"] == "alice"


async def test_search_respects_limit() -> None:
    events = [
        {"ts": NOW - timedelta(seconds=i), "msg": "needle", "idx": i}
        for i in range(10)
    ]
    ds = MockSiemDataSource(events=events)
    results = await ds.search(
        query="needle",
        since=NOW - timedelta(minutes=1),
        until=NOW,
        limit=3,
    )
    assert len(results) == 3


async def test_search_no_match_out_of_window() -> None:
    ds = MockSiemDataSource(events=_make_events())
    results = await ds.search(
        query="login_failure",
        since=NOW - timedelta(hours=1),
        until=NOW - timedelta(hours=1),  # zero-width window in recent range
    )
    # The bob event is 2 days ago, alice's failure is 10 min ago — both out of a 0-width window
    assert results == []


async def test_pivot_exact_field_match() -> None:
    ds = MockSiemDataSource(events=_make_events())
    results = await ds.pivot(
        field="user",
        value="alice",
        since=NOW - timedelta(hours=1),
        until=NOW,
    )
    assert len(results) == 3
    assert all(r["user"] == "alice" for r in results)


async def test_pivot_empty_for_unknown_value() -> None:
    ds = MockSiemDataSource(events=_make_events())
    results = await ds.pivot(
        field="user",
        value="nobody",
        since=NOW - timedelta(hours=1),
        until=NOW,
    )
    assert results == []


async def test_pivot_respects_limit() -> None:
    events = [
        {"ts": NOW - timedelta(seconds=i), "src_ip": "1.2.3.4", "msg": f"event-{i}"}
        for i in range(10)
    ]
    ds = MockSiemDataSource(events=events)
    results = await ds.pivot(
        field="src_ip",
        value="1.2.3.4",
        since=NOW - timedelta(minutes=1),
        until=NOW,
        limit=4,
    )
    assert len(results) == 4


async def test_healthcheck() -> None:
    ds = MockSiemDataSource()
    assert await ds.healthcheck() is True
    await ds.close()
