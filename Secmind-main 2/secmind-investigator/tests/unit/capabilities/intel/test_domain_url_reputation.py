"""Tests for E2 DomainUrlReputationCapability."""
from typing import Any

from secmind_investigator.capabilities.intel.domain_url_reputation import (
    DomainUrlReputationCapability,
)
from secmind_investigator.core.context import ExecutionContext
from secmind_investigator.core.errors import DataSourceUnavailable
from secmind_investigator.datasources.mocks import MockTiDataSource


def _ctx(**overrides: Any) -> ExecutionContext:
    ds: dict[str, Any] = {
        "DS-TI": MockTiDataSource(),
    }
    ds.update(overrides)
    return ExecutionContext(datasources=ds)


async def test_malicious_url_verdict() -> None:
    """TI returns malicious → verdict=malicious, categories present."""
    ti = MockTiDataSource(
        url_lookups={
            "https://evil.example.com/payload": {
                "verdict": "malicious",
                "categories": ["malware", "c2"],
                "tags": ["apt29"],
                "sources": [{"name": "VirusTotal", "score": 0.99}],
            }
        }
    )
    res = await DomainUrlReputationCapability().run(
        {"target": "https://evil.example.com/payload", "kind": "url"},
        _ctx(**{"DS-TI": ti}),
    )
    assert res.partial is False
    assert res.payload["verdict"] == "malicious"
    assert "malware" in res.payload["categories"]
    assert res.payload["tags"] == ["apt29"]


async def test_clean_domain_verdict() -> None:
    """TI returns clean for a known-good domain."""
    ti = MockTiDataSource(
        domain_lookups={
            "google.com": {
                "verdict": "clean",
                "categories": ["search-engine"],
                "age_days": 10000,
                "first_seen": "2000-01-01T00:00:00Z",
                "tags": [],
                "sources": [{"name": "OpenPhish", "score": 0.0}],
            }
        }
    )
    res = await DomainUrlReputationCapability().run(
        {"target": "google.com", "kind": "domain"},
        _ctx(**{"DS-TI": ti}),
    )
    assert res.partial is False
    assert res.payload["verdict"] == "clean"
    assert res.payload["age_days"] == 10000
    assert res.payload["first_seen"] == "2000-01-01T00:00:00Z"


async def test_unknown_target_not_partial() -> None:
    """TI returns None for unknown target → verdict=unknown, NOT partial."""
    ti = MockTiDataSource()  # empty lookups → None for everything
    res = await DomainUrlReputationCapability().run(
        {"target": "totally-unknown-domain.xyz", "kind": "domain"},
        _ctx(**{"DS-TI": ti}),
    )
    assert res.partial is False
    assert res.payload["verdict"] == "unknown"
    assert res.payload["categories"] == []
    assert res.payload["tags"] == []


async def test_ti_unavailable_returns_partial() -> None:
    """DS-TI unavailable → partial=True, verdict=unknown."""
    class _DownTi(MockTiDataSource):
        async def lookup_url(self, url: str):  # type: ignore[override]
            raise DataSourceUnavailable("DS-TI", "connection refused")

    res = await DomainUrlReputationCapability().run(
        {"target": "https://example.com/path", "kind": "url"},
        _ctx(**{"DS-TI": _DownTi()}),
    )
    assert res.partial is True
    assert res.payload["verdict"] == "unknown"


async def test_namespace_correct() -> None:
    assert DomainUrlReputationCapability.namespace == "investigate.intel.domain_url.reputation"


async def test_ti_missing_returns_partial() -> None:
    """DS-TI not configured at all → partial, verdict=unknown."""
    ctx = ExecutionContext(datasources={})  # no DS-TI key
    res = await DomainUrlReputationCapability().run(
        {"target": "example.com", "kind": "domain"},
        ctx,
    )
    assert res.partial is True
    assert res.payload["verdict"] == "unknown"
    assert res.payload["target"] == "example.com"
    assert res.payload["kind"] == "domain"
