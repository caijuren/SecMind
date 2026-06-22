"""Tests for DS-IDP MockIdpDataSource."""
from datetime import UTC, datetime, timedelta

from secmind_investigator.datasources.mocks import MockIdpDataSource


async def test_get_account_present() -> None:
    ds = MockIdpDataSource(
        accounts={
            "alice@corp": {
                "upn": "alice@corp",
                "sid": "S-1-5",
                "groups": ["Engineering"],
                "mfa_enabled": True,
                "locked": False,
                "last_password_change": datetime(2026, 1, 1, tzinfo=UTC),
            }
        }
    )
    acct = await ds.get_account("alice@corp")
    assert acct is not None
    assert acct["mfa_enabled"] is True


async def test_get_account_missing_returns_none() -> None:
    ds = MockIdpDataSource(accounts={})
    assert await ds.get_account("bob@corp") is None


async def test_list_logins_window_filter() -> None:
    now = datetime(2026, 5, 24, 10, 0, tzinfo=UTC)
    ds = MockIdpDataSource(
        accounts={"a@c": {}},
        logins={
            "a@c": [
                {"ts": now - timedelta(hours=1), "result": "success", "src_ip": "1.1.1.1"},
                {"ts": now - timedelta(days=5), "result": "failure", "src_ip": "2.2.2.2"},
            ]
        },
    )
    events = await ds.list_logins("a@c", since=now - timedelta(hours=24), until=now)
    assert len(events) == 1
    assert events[0]["result"] == "success"


async def test_list_groups_default_empty() -> None:
    ds = MockIdpDataSource()
    assert await ds.list_groups("anyone") == []


async def test_list_oauth_grants_default_empty() -> None:
    ds = MockIdpDataSource()
    assert await ds.list_oauth_grants("anyone") == []


async def test_healthcheck() -> None:
    ds = MockIdpDataSource()
    assert await ds.healthcheck() is True
    await ds.close()
