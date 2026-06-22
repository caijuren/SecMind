"""Tests for A1 UserProfileCapability."""
from datetime import UTC, datetime, timedelta
from typing import Any

from secmind_investigator.capabilities.entity.user_profile import (
    UserProfileCapability,
)
from secmind_investigator.core.context import ExecutionContext
from secmind_investigator.core.errors import DataSourceUnavailable
from secmind_investigator.datasources.mocks import (
    MockCmdbDataSource,
    MockEmailDataSource,
    MockHrDataSource,
    MockIdpDataSource,
    MockKbDataSource,
)


def _ctx(**overrides: Any) -> ExecutionContext:
    ds: dict[str, Any] = {
        "DS-HR": MockHrDataSource(),
        "DS-IDP": MockIdpDataSource(),
        "DS-CMDB": MockCmdbDataSource(),
        "DS-EMAIL": MockEmailDataSource(),
        "DS-KB": MockKbDataSource(),
    }
    ds.update(overrides)
    return ExecutionContext(datasources=ds)


async def test_happy_path_full_profile() -> None:
    hr = MockHrDataSource(employees={
        "alice@corp": {
            "display_name": "Alice",
            "employee_id": "E001",
            "department": "Eng",
            "manager": "bob@corp",
            "hire_date": datetime(2022, 1, 1, tzinfo=UTC),
            "status": "active",
            "leaving_date": None,
        }
    })
    idp = MockIdpDataSource(accounts={
        "alice@corp": {
            "upn": "alice@corp", "mfa_enabled": True, "locked": False, "is_privileged": False
        }
    })
    email = MockEmailDataSource(mailboxes={
        "alice@corp": {"primary": "alice@corp", "aliases": [], "forwarding_rules": []}
    })
    res = await UserProfileCapability().run(
        {"principal": "alice@corp"}, _ctx(**{"DS-HR": hr, "DS-IDP": idp, "DS-EMAIL": email})
    )
    assert res.partial is False
    assert res.payload["identity"]["display_name"] == "Alice"
    assert res.payload["auth"]["mfa_enabled"] is True
    assert res.payload["risk_tags"] == []


async def test_leaver_30d_tag_set_when_within_30d() -> None:
    leaving = datetime.now(UTC) + timedelta(days=15)
    hr = MockHrDataSource(employees={
        "bob@corp": {"display_name": "Bob", "status": "active", "leaving_date": leaving}
    })
    idp = MockIdpDataSource(accounts={"bob@corp": {"upn": "bob@corp", "mfa_enabled": True}})
    email = MockEmailDataSource(mailboxes={"bob@corp": {"aliases": [], "forwarding_rules": []}})
    res = await UserProfileCapability().run(
        {"principal": "bob@corp"},
        _ctx(**{"DS-HR": hr, "DS-IDP": idp, "DS-EMAIL": email}),
    )
    assert "leaver_30d" in res.payload["risk_tags"]


async def test_leaver_tag_not_set_when_far_future() -> None:
    leaving = datetime.now(UTC) + timedelta(days=90)
    hr = MockHrDataSource(employees={
        "c@corp": {"display_name": "C", "status": "active", "leaving_date": leaving}
    })
    idp = MockIdpDataSource(accounts={"c@corp": {"mfa_enabled": True}})
    email = MockEmailDataSource(mailboxes={"c@corp": {"aliases": [], "forwarding_rules": []}})
    res = await UserProfileCapability().run(
        {"principal": "c@corp"}, _ctx(**{"DS-HR": hr, "DS-IDP": idp, "DS-EMAIL": email})
    )
    assert "leaver_30d" not in res.payload["risk_tags"]


async def test_priv_no_mfa_tag() -> None:
    hr = MockHrDataSource(employees={"admin@corp": {"display_name": "Admin", "status": "active"}})
    idp = MockIdpDataSource(accounts={
        "admin@corp": {"upn": "admin@corp", "mfa_enabled": False, "is_privileged": True}
    })
    email = MockEmailDataSource(mailboxes={"admin@corp": {"aliases": [], "forwarding_rules": []}})
    res = await UserProfileCapability().run(
        {"principal": "admin@corp"},
        _ctx(**{"DS-HR": hr, "DS-IDP": idp, "DS-EMAIL": email}),
    )
    assert "priv_no_mfa" in res.payload["risk_tags"]


async def test_external_forwarding_tag() -> None:
    hr = MockHrDataSource(employees={"x@corp": {"display_name": "X", "status": "active"}})
    idp = MockIdpDataSource(accounts={"x@corp": {"mfa_enabled": True}})
    email = MockEmailDataSource(mailboxes={
        "x@corp": {
            "aliases": [],
            "forwarding_rules": [{"target": "attacker@evil.com", "external": True}],
        }
    })
    res = await UserProfileCapability().run(
        {"principal": "x@corp"}, _ctx(**{"DS-HR": hr, "DS-IDP": idp, "DS-EMAIL": email})
    )
    assert "external_forwarding" in res.payload["risk_tags"]


async def test_hr_unavailable_returns_partial() -> None:
    class _DownHr(MockHrDataSource):
        async def get_employee(self, principal: str):  # type: ignore[override]
            raise DataSourceUnavailable("DS-HR", "timeout after 3s")

    idp = MockIdpDataSource(accounts={"d@corp": {"mfa_enabled": True}})
    email = MockEmailDataSource(mailboxes={"d@corp": {"aliases": [], "forwarding_rules": []}})
    res = await UserProfileCapability().run(
        {"principal": "d@corp"},
        _ctx(**{"DS-HR": _DownHr(), "DS-IDP": idp, "DS-EMAIL": email}),
    )
    assert res.partial is True
    assert any("DS-HR" in r for r in res.partial_reasons)
    assert res.payload["identity"] == {}
    # auth should still be populated since IDP worked
    assert res.payload["auth"]["mfa_enabled"] is True


async def test_namespace_correct() -> None:
    assert UserProfileCapability.namespace == "investigate.entity.user.profile"


async def test_kb_unavailable_returns_partial_but_keeps_other_fields() -> None:
    class _DownKb(MockKbDataSource):
        async def count_prior(self, entity_kind, entity_id, window):  # type: ignore[override]
            raise DataSourceUnavailable("DS-KB", "circuit open")

    hr = MockHrDataSource(employees={"e@corp": {"display_name": "E", "status": "active"}})
    idp = MockIdpDataSource(accounts={"e@corp": {"mfa_enabled": True}})
    email = MockEmailDataSource(mailboxes={"e@corp": {"aliases": [], "forwarding_rules": []}})
    res = await UserProfileCapability().run(
        {"principal": "e@corp"},
        _ctx(**{"DS-HR": hr, "DS-IDP": idp, "DS-EMAIL": email, "DS-KB": _DownKb()}),
    )
    assert res.partial is True
    assert any("DS-KB" in r for r in res.partial_reasons)
    # Payload still has identity / auth populated from working sources
    assert res.payload["identity"]["display_name"] == "E"
    assert res.payload["auth"]["mfa_enabled"] is True
    assert res.payload["prior_alerts_30d"] == 0  # sentinel for missing KB


async def test_leaving_date_none_skips_leaver_tag() -> None:
    """Explicit coverage of the `ld is not None` guard."""
    hr = MockHrDataSource(employees={
        "z@corp": {"display_name": "Z", "status": "active", "leaving_date": None}
    })
    idp = MockIdpDataSource(accounts={"z@corp": {"mfa_enabled": True}})
    email = MockEmailDataSource(mailboxes={"z@corp": {"aliases": [], "forwarding_rules": []}})
    res = await UserProfileCapability().run(
        {"principal": "z@corp"},
        _ctx(**{"DS-HR": hr, "DS-IDP": idp, "DS-EMAIL": email}),
    )
    assert "leaver_30d" not in res.payload["risk_tags"]
