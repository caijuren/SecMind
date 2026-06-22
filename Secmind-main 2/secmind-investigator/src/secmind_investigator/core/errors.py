"""Error types and degradation semantics for atomic capabilities."""
from __future__ import annotations

from pydantic import BaseModel


class CapabilityError(Exception):
    """Base exception for the capability layer."""


class DataSourceUnavailable(CapabilityError):
    """A data source could not be reached; capability should degrade to partial."""

    def __init__(self, source: str, reason: str) -> None:
        super().__init__(f"{source}: {reason}")
        self.source = source
        self.reason = reason


class PartialResult(CapabilityError):
    """Raised by capability to surface partial data with explicit confidence.

    Payload may be either a Pydantic ``BaseModel`` (preferred, type-safe) or
    a raw ``dict[str, object]`` (escape hatch for ad-hoc partial collection).
    """

    def __init__(
        self,
        payload: BaseModel | dict[str, object],
        reasons: list[str],
        confidence: float,
    ) -> None:
        if not 0.0 <= confidence <= 1.0:
            raise ValueError(f"confidence must be in [0.0, 1.0], got {confidence}")
        super().__init__("partial result")
        self.payload = payload
        self.reasons = list(reasons)  # defensive copy
        self.confidence = confidence


class CapabilityFatal(CapabilityError):
    """Unrecoverable error; orchestrator must surface to operator."""
