"""Tests for core schemas."""
from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from secmind_investigator.core.schema import (
    CapabilityResult,
    EvidenceRef,
    PIIMarker,
)


def test_evidence_ref_roundtrip() -> None:
    ref = EvidenceRef(
        source="DS-EDR",
        query="host=foo time=2026-05-24T10:00:00Z",
        record_id="evt-001",
        captured_at=datetime(2026, 5, 24, 10, 0, tzinfo=UTC),
    )
    data = ref.model_dump_json()
    restored = EvidenceRef.model_validate_json(data)
    assert restored == ref


def test_capability_result_requires_confidence() -> None:
    with pytest.raises(ValidationError):
        CapabilityResult(payload={})  # type: ignore[call-arg]


def test_capability_result_defaults() -> None:
    res = CapabilityResult(payload={"k": "v"}, confidence=0.9)
    assert res.partial is False
    assert res.partial_reasons == []
    assert res.evidence_refs == []
    assert res.pii_fields == []
    assert res.duration_ms is None


def test_pii_marker_carries_jsonpath() -> None:
    marker = PIIMarker(json_path="$.identity.email", classification="email")
    assert marker.json_path.startswith("$")
    assert marker.classification == "email"


def test_evidence_ref_rejects_naive_datetime() -> None:
    with pytest.raises(ValidationError):
        EvidenceRef(
            source="DS-EDR",
            query="q",
            captured_at=datetime(2026, 5, 24, 10, 0),  # no tzinfo
        )


def test_capability_result_confidence_boundaries() -> None:
    CapabilityResult(payload={}, confidence=0.0)
    CapabilityResult(payload={}, confidence=1.0)
    with pytest.raises(ValidationError):
        CapabilityResult(payload={}, confidence=-0.001)
    with pytest.raises(ValidationError):
        CapabilityResult(payload={}, confidence=1.001)


def test_pii_marker_rejects_unknown_classification() -> None:
    with pytest.raises(ValidationError):
        PIIMarker(json_path="$.x", classification="ssn")  # type: ignore[arg-type]


def test_capability_result_rejects_non_json_payload() -> None:
    # bytes are not JSON-serializable
    with pytest.raises(ValidationError):
        CapabilityResult(payload={"raw": b"\x00\x01"}, confidence=1.0)


def test_capability_result_is_frozen() -> None:
    res = CapabilityResult(payload={"k": "v"}, confidence=1.0)
    with pytest.raises(ValidationError):
        res.confidence = 0.5  # type: ignore[misc]


def test_capability_result_non_partial_with_reasons_raises() -> None:
    with pytest.raises(ValidationError):
        CapabilityResult(
            payload={}, confidence=1.0, partial=False, partial_reasons=["should not be here"]
        )
