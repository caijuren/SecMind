"""Tests for DS-EMAIL MockEmailDataSource."""
from datetime import UTC, datetime, timedelta

from secmind_investigator.datasources.mocks import MockEmailDataSource

NOW = datetime(2026, 5, 24, 10, 0, tzinfo=UTC)


def _make_ds() -> MockEmailDataSource:
    messages = {
        "msg-001": {
            "id": "msg-001",
            "subject": "Hello",
            "from": "alice@example.com",
            "to": "bob@example.com",
        },
        "msg-002": {
            "id": "msg-002",
            "subject": "Re: Hello",
            "from": "bob@example.com",
            "to": "alice@example.com",
        },
    }
    mailboxes = {
        "alice@example.com": {
            "mailbox": "alice@example.com",
            "quota_mb": 1024,
            "active": True,
        },
    }
    sent = {
        "alice@example.com": [
            {
                "id": "msg-001",
                "ts": NOW - timedelta(minutes=30),
                "to": "bob@example.com",
                "subject": "Hello",
            },
            {
                "id": "msg-003",
                "ts": NOW - timedelta(days=2),
                "to": "carol@example.com",
                "subject": "Old mail",
            },
        ]
    }
    received = {
        "alice@example.com": [
            {
                "id": "msg-002",
                "ts": NOW - timedelta(minutes=15),
                "from": "bob@example.com",
                "subject": "Re: Hello",
            },
            {
                "id": "msg-004",
                "ts": NOW - timedelta(days=3),
                "from": "spam@evil.com",
                "subject": "Win a prize",
            },
        ]
    }
    forwarding_rules = {
        "alice@example.com": [
            {
                "rule_id": "fwd-1",
                "target": "alice-archive@example.com",
                "condition": "all",
            },
        ]
    }
    return MockEmailDataSource(
        messages=messages,
        mailboxes=mailboxes,
        sent=sent,
        received=received,
        forwarding_rules=forwarding_rules,
    )


async def test_get_message_hit() -> None:
    ds = _make_ds()
    msg = await ds.get_message("msg-001")
    assert msg is not None
    assert msg["subject"] == "Hello"
    assert msg["from"] == "alice@example.com"


async def test_get_message_miss() -> None:
    ds = _make_ds()
    msg = await ds.get_message("nonexistent-msg")
    assert msg is None


async def test_get_mailbox_hit() -> None:
    ds = _make_ds()
    mb = await ds.get_mailbox("alice@example.com")
    assert mb is not None
    assert mb["quota_mb"] == 1024
    assert mb["active"] is True


async def test_get_mailbox_miss() -> None:
    ds = _make_ds()
    mb = await ds.get_mailbox("unknown@example.com")
    assert mb is None


async def test_list_sent_window_filter() -> None:
    ds = _make_ds()
    # Only the recent message should be in a 1-hour window
    results = await ds.list_sent(
        "alice@example.com",
        since=NOW - timedelta(hours=1),
        until=NOW,
    )
    assert len(results) == 1
    assert results[0]["id"] == "msg-001"


async def test_list_sent_empty_mailbox() -> None:
    ds = _make_ds()
    results = await ds.list_sent(
        "nobody@example.com",
        since=NOW - timedelta(hours=1),
        until=NOW,
    )
    assert results == []


async def test_list_received_window_filter() -> None:
    ds = _make_ds()
    results = await ds.list_received(
        "alice@example.com",
        since=NOW - timedelta(hours=1),
        until=NOW,
    )
    assert len(results) == 1
    assert results[0]["from"] == "bob@example.com"


async def test_get_forwarding_rules() -> None:
    ds = _make_ds()
    rules = await ds.get_forwarding_rules("alice@example.com")
    assert len(rules) == 1
    assert rules[0]["target"] == "alice-archive@example.com"


async def test_get_forwarding_rules_unknown_mailbox() -> None:
    ds = _make_ds()
    rules = await ds.get_forwarding_rules("nobody@example.com")
    assert rules == []


async def test_healthcheck() -> None:
    ds = MockEmailDataSource()
    assert await ds.healthcheck() is True
    await ds.close()
