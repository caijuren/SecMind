"""Tests for DS-KB MockKbDataSource."""
from datetime import timedelta

from secmind_investigator.datasources.mocks import MockKbDataSource


def _make_ds() -> MockKbDataSource:
    alerts = {
        "alert-001": {
            "id": "alert-001",
            "title": "Brute force attempt",
            "entity": "alice",
            "severity": "high",
        },
        "alert-002": {
            "id": "alert-002",
            "title": "Lateral movement",
            "entity": "server-01",
            "severity": "critical",
        },
        "alert-003": {
            "id": "alert-003",
            "title": "Data exfiltration",
            "entity": "alice",
            "severity": "critical",
        },
    }
    entity_priors = {
        ("user", "alice"): 5,
        ("host", "server-01"): 2,
    }
    similar_alerts = [
        {"id": "hist-001", "title": "Similar brute force", "similarity": 0.95},
        {"id": "hist-002", "title": "Password spray", "similarity": 0.87},
        {"id": "hist-003", "title": "Account lockout", "similarity": 0.75},
        {"id": "hist-004", "title": "Failed login burst", "similarity": 0.70},
        {"id": "hist-005", "title": "MFA bypass attempt", "similarity": 0.65},
        {"id": "hist-006", "title": "Weak password login", "similarity": 0.50},
    ]
    return MockKbDataSource(
        alerts=alerts,
        entity_priors=entity_priors,
        similar_alerts=similar_alerts,
    )


async def test_get_alert_hit() -> None:
    ds = _make_ds()
    alert = await ds.get_alert("alert-001")
    assert alert is not None
    assert alert["title"] == "Brute force attempt"
    assert alert["severity"] == "high"


async def test_get_alert_miss() -> None:
    ds = _make_ds()
    alert = await ds.get_alert("nonexistent-alert")
    assert alert is None


async def test_count_prior_known_entity() -> None:
    ds = _make_ds()
    count = await ds.count_prior("user", "alice", timedelta(days=30))
    assert count == 5


async def test_count_prior_another_entity() -> None:
    ds = _make_ds()
    count = await ds.count_prior("host", "server-01", timedelta(days=7))
    assert count == 2


async def test_count_prior_unknown_entity_returns_zero() -> None:
    ds = _make_ds()
    count = await ds.count_prior("user", "nobody", timedelta(days=30))
    assert count == 0


async def test_search_similar_alerts_returns_up_to_k() -> None:
    ds = _make_ds()
    results = await ds.search_similar_alerts(fingerprint={"rule": "brute_force"}, k=3)
    assert len(results) == 3
    assert results[0]["id"] == "hist-001"
    assert results[1]["id"] == "hist-002"
    assert results[2]["id"] == "hist-003"


async def test_search_similar_alerts_k_larger_than_available() -> None:
    ds = _make_ds()
    # 6 items available, k=10 -> returns all 6
    results = await ds.search_similar_alerts(fingerprint={}, k=10)
    assert len(results) == 6


async def test_search_similar_alerts_empty_store() -> None:
    ds = MockKbDataSource()
    results = await ds.search_similar_alerts(fingerprint={"rule": "something"}, k=5)
    assert results == []


async def test_healthcheck() -> None:
    ds = MockKbDataSource()
    assert await ds.healthcheck() is True
    await ds.close()
