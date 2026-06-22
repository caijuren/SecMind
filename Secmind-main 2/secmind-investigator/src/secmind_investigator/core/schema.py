"""Core Pydantic schemas shared by all atomic capabilities."""
from __future__ import annotations

from typing import Any, Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, model_validator

PIIClassification = Literal[
    "name", "email", "phone", "id_number", "address",
    "ip", "device_id", "credential", "biometric", "other"
]


class PIIMarker(BaseModel):
    """Marks a JSON path in a payload as containing PII for downstream redaction."""

    model_config = ConfigDict(frozen=True)
    json_path: str = Field(..., description="JSONPath into the payload")
    classification: PIIClassification


class EvidenceRef(BaseModel):
    """A pointer back to the original record that supports a finding."""

    model_config = ConfigDict(frozen=True)
    source: str = Field(..., description="Abstract data source id, e.g. DS-EDR")
    query: str = Field(..., description="Query string or descriptor used")
    record_id: str | None = None
    captured_at: AwareDatetime


class CapabilityResult(BaseModel):
    """Uniform envelope for every atomic capability output."""

    model_config = ConfigDict(frozen=True)

    schema_version: Literal["1"] = "1"
    payload: dict[str, Any]
    confidence: float = Field(..., ge=0.0, le=1.0)
    partial: bool = False
    partial_reasons: list[str] = Field(default_factory=list)
    evidence_refs: list[EvidenceRef] = Field(default_factory=list)
    pii_fields: list[PIIMarker] = Field(default_factory=list)
    duration_ms: int | None = None
    cost_credits: float | None = Field(
        None,
        description=(
            "Abstract cost units consumed (defined per data-source adapter"
            " — e.g. API calls, sandbox detonations). Not a currency."
        ),
    )

    @model_validator(mode="after")
    def _payload_must_be_json_serializable(self) -> CapabilityResult:
        import json
        try:
            json.dumps(self.payload)
        except (TypeError, ValueError) as e:
            raise ValueError(f"payload is not JSON-serializable: {e}") from e
        return self

    @model_validator(mode="after")
    def _partial_and_reasons_consistent(self) -> CapabilityResult:
        if not self.partial and self.partial_reasons:
            raise ValueError("partial_reasons must be empty when partial is False")
        return self
