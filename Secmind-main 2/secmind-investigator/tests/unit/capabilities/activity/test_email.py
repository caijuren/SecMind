"""Tests for B8 EmailActivityCapability."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import pytest

from secmind_investigator.capabilities.activity.email import EmailActivityCapability
from secmind_investigator.core.context import ExecutionContext
from secmind_investigator.core.errors import DataSourceUnavailable
from secmind_investigator.datasources.mocks import MockEmailDataSource


def _ts(offset_days: int = 0) -> datetime:
    from datetime import timedelta
    return datetime.now(UTC) - timedelta(days=offset_days)


def _ctx(**overrides: Any) -> ExecutionContext:
    ds: dict[str, Any] = {
        "DS-EMAIL": MockEmailDataSource(),
    }
    ds.update(overrides)
    return ExecutionContext(datasources=ds)


# ── Test 1: fetch by message_id happy path ────────────────────────────────────

async def test_fetch_by_message_id_happy_path() -> None:
    """Single message fetched by message_id; no mailbox calls needed."""
    msg = {
        "id": "msg-001",
        "subject": "Hello",
        "from": "alice@example.com",
        "to": ["bob@example.com"],
        "ts": _ts(),
        "links": [],
        "auth_results": "spf=pass dkim=pass",
    }
    email_ds = MockEmailDataSource(messages={"msg-001": msg})
    res = await EmailActivityCapability().run(
        {"message_id": "msg-001"},
        _ctx(**{"DS-EMAIL": email_ds}),
    )
    assert res.partial is False
    assert len(res.payload["messages"]) == 1
    assert res.payload["messages"][0]["id"] == "msg-001"
    assert res.payload["forwarding_rules"] == []
    assert res.payload["mass_send_indicator"] is False


# ── Test 2: fetch by mailbox with multiple messages ───────────────────────────

async def test_fetch_by_mailbox_multiple_messages() -> None:
    """Messages fetched from mailbox; forwarding_rules populated."""
    msgs = [
        {
            "id": f"msg-{i}",
            "subject": "Normal email",
            "from": "sender@external.com",
            "to": ["user@corp.com"],
            "ts": _ts(i),
            "links": [],
            "auth_results": "spf=pass",
        }
        for i in range(3)
    ]
    rules = [{"rule_id": "r1", "destination": "personal@gmail.com", "external": True}]
    email_ds = MockEmailDataSource(
        received={"user@corp.com": msgs},
        forwarding_rules={"user@corp.com": rules},
    )
    res = await EmailActivityCapability().run(
        {"mailbox": "user@corp.com"},
        _ctx(**{"DS-EMAIL": email_ds}),
    )
    assert res.partial is False
    assert len(res.payload["messages"]) == 3
    assert len(res.payload["forwarding_rules"]) == 1
    assert res.payload["forwarding_rules"][0]["external"] is True


# ── Test 3: urgency keyword detection ─────────────────────────────────────────

async def test_urgency_keyword_detection() -> None:
    """Subjects containing urgency keywords are collected in phishing_signals."""
    msgs = [
        {
            "id": "msg-u1",
            "subject": "URGENT: Wire Transfer Required Immediately",
            "from": "cfo@corp.com",
            "to": ["finance@corp.com"],
            "ts": _ts(),
            "links": [],
            "auth_results": "spf=pass dkim=pass",
        },
        {
            "id": "msg-u2",
            "subject": "Please verify your password now",
            "from": "it@corp.com",
            "to": ["user@corp.com"],
            "ts": _ts(1),
            "links": [],
            "auth_results": "spf=pass",
        },
    ]
    email_ds = MockEmailDataSource(
        received={"user@corp.com": msgs},
    )
    res = await EmailActivityCapability().run(
        {"mailbox": "user@corp.com"},
        _ctx(**{"DS-EMAIL": email_ds}),
    )
    ps = res.payload["phishing_signals"]
    keywords = ps["urgency_keywords"]
    assert "urgent" in keywords
    assert "wire transfer" in keywords
    assert "immediately" in keywords
    assert "password" in keywords
    assert "verify" in keywords


# ── Test 4: auth failure detection ────────────────────────────────────────────

async def test_auth_failure_detection() -> None:
    """A message with spf=fail triggers auth_failure=True."""
    msgs = [
        {
            "id": "msg-f1",
            "subject": "Routine message",
            "from": "spoofer@evil.com",
            "to": ["victim@corp.com"],
            "ts": _ts(),
            "links": ["http://legit-looking.com/login"],
            "auth_results": "spf=fail dkim=fail dmarc=fail",
        }
    ]
    email_ds = MockEmailDataSource(received={"victim@corp.com": msgs})
    res = await EmailActivityCapability().run(
        {"mailbox": "victim@corp.com"},
        _ctx(**{"DS-EMAIL": email_ds}),
    )
    ps = res.payload["phishing_signals"]
    assert ps["auth_failure"] is True
    assert ps["suspicious_link"] is True  # has links


# ── Test 5: validation error when neither mailbox nor message_id given ────────

async def test_validation_error_when_no_identifier() -> None:
    """Pydantic model_validator raises ValueError when both fields are None."""
    with pytest.raises(ValueError):  # pydantic ValidationError wraps ValueError
        await EmailActivityCapability().run(
            {},
            _ctx(),
        )


# ── Test 6: DS-EMAIL unavailable → partial ────────────────────────────────────

async def test_ds_email_unavailable_returns_partial() -> None:
    """DS-EMAIL raises DataSourceUnavailable → partial=True."""

    class _DownEmail(MockEmailDataSource):
        async def get_message(self, message_id: str) -> None:  # type: ignore[override]
            raise DataSourceUnavailable("DS-EMAIL", "connection refused")

    res = await EmailActivityCapability().run(
        {"message_id": "msg-999"},
        _ctx(**{"DS-EMAIL": _DownEmail()}),
    )
    assert res.partial is True


# ── Test 7: namespace correct ─────────────────────────────────────────────────

async def test_namespace_correct() -> None:
    assert EmailActivityCapability.namespace == "investigate.activity.email"


# ── Test 8: mass_send_indicator ───────────────────────────────────────────────

async def test_mass_send_indicator_true_when_more_than_10_recipients() -> None:
    """mass_send_indicator is True when a message has > 10 recipients."""
    many_recipients = [f"user{i}@corp.com" for i in range(11)]
    msg = {
        "id": "msg-mass",
        "subject": "Company Newsletter",
        "from": "marketing@corp.com",
        "to": many_recipients,
        "ts": _ts(),
        "links": [],
        "auth_results": "spf=pass",
    }
    email_ds = MockEmailDataSource(received={"user@corp.com": [msg]})
    res = await EmailActivityCapability().run(
        {"mailbox": "user@corp.com"},
        _ctx(**{"DS-EMAIL": email_ds}),
    )
    assert res.payload["mass_send_indicator"] is True
