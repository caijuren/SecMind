"""Tests for DS-HR MockHrDataSource."""
from datetime import UTC, datetime

from secmind_investigator.datasources.mocks import MockHrDataSource


async def test_get_employee_returns_full_record() -> None:
    leaving = datetime(2026, 6, 30, tzinfo=UTC)
    ds = MockHrDataSource(employees={
        "alice@corp": {
            "display_name": "Alice",
            "employee_id": "E001",
            "department": "Engineering",
            "manager": "bob@corp",
            "hire_date": datetime(2022, 1, 15, tzinfo=UTC),
            "status": "active",
            "leaving_date": leaving,
            "role_class": "full_time",
            "vip": False,
            "org_path": ["Org", "R&D", "Engineering"],
        }
    })
    emp = await ds.get_employee("alice@corp")
    assert emp is not None
    assert emp["employee_id"] == "E001"
    assert emp["leaving_date"] == leaving


async def test_get_employee_missing_returns_none() -> None:
    ds = MockHrDataSource()
    assert await ds.get_employee("nobody@corp") is None


async def test_get_status_and_leaving_date() -> None:
    leaving = datetime(2026, 6, 30, tzinfo=UTC)
    ds = MockHrDataSource(employees={"x@c": {"status": "active", "leaving_date": leaving}})
    assert await ds.get_status("x@c") == "active"
    assert await ds.get_leaving_date("x@c") == leaving


async def test_get_org_path_default_empty() -> None:
    ds = MockHrDataSource(employees={"y@c": {}})
    assert await ds.get_org_path("y@c") == []


async def test_healthcheck() -> None:
    assert await MockHrDataSource().healthcheck() is True
