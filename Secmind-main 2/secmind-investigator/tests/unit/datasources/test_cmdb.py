"""Tests for DS-CMDB MockCmdbDataSource."""
from secmind_investigator.datasources.mocks import MockCmdbDataSource


async def test_get_asset_returns_full_record() -> None:
    ds = MockCmdbDataSource(assets={
        "host-001": {
            "asset_id": "host-001",
            "owner": "alice@corp",
            "business_unit": "Engineering",
            "criticality": "high",
            "os": "linux",
        }
    })
    asset = await ds.get_asset("host-001")
    assert asset is not None
    assert asset["criticality"] == "high"


async def test_get_asset_missing_returns_none() -> None:
    ds = MockCmdbDataSource()
    assert await ds.get_asset("unknown") is None


async def test_assets_owned_by() -> None:
    ds = MockCmdbDataSource(ownership={
        "alice@corp": [
            {"asset_id": "host-001", "role": "owner"},
            {"asset_id": "host-002", "role": "admin"},
        ]
    })
    owned = await ds.assets_owned_by("alice@corp")
    assert len(owned) == 2


async def test_assets_owned_by_no_records_returns_empty() -> None:
    ds = MockCmdbDataSource()
    assert await ds.assets_owned_by("nobody") == []


async def test_business_context() -> None:
    ds = MockCmdbDataSource(business_context={
        "host-001": {
            "business_unit": "Engineering",
            "criticality": "high",
            "sla": "P1",
            "dependencies": ["db-001"],
            "in_maintenance": False,
        }
    })
    ctx = await ds.get_business_context("host-001")
    assert ctx is not None
    assert ctx["sla"] == "P1"


async def test_healthcheck() -> None:
    assert await MockCmdbDataSource().healthcheck() is True
