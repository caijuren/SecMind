"""E2: Domain / URL reputation lookup via DS-TI."""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

from secmind_investigator.core.capability import AtomicCapability
from secmind_investigator.core.context import ExecutionContext
from secmind_investigator.core.errors import PartialResult
from secmind_investigator.core.utils import safe_ds_call


class DomainUrlReputationInput(BaseModel):
    target: str
    kind: Literal["domain", "url"]


class DomainUrlReputationPayload(BaseModel):
    target: str
    kind: str
    verdict: Literal["clean", "suspicious", "malicious", "unknown"] = "unknown"
    categories: list[str] = Field(default_factory=list)
    age_days: int | None = None
    first_seen: str | None = None
    tags: list[str] = Field(default_factory=list)
    sources: list[dict[str, Any]] = Field(default_factory=list)


class DomainUrlReputationCapability(
    AtomicCapability[DomainUrlReputationInput, DomainUrlReputationPayload]
):
    """E2: look up domain or URL reputation from threat-intelligence feed."""

    namespace = "investigate.intel.domain_url.reputation"
    input_model = DomainUrlReputationInput
    output_payload_model = DomainUrlReputationPayload

    async def execute(
        self, inp: DomainUrlReputationInput, ctx: ExecutionContext
    ) -> DomainUrlReputationPayload:
        ti = ctx.datasources.get("DS-TI")

        if ti is None:
            raise PartialResult(
                payload=DomainUrlReputationPayload(
                    target=inp.target,
                    kind=inp.kind,
                    verdict="unknown",
                ),
                reasons=["DS-TI: not configured"],
                confidence=0.0,
            )

        if inp.kind == "url":
            result, err = await safe_ds_call(ti.lookup_url(inp.target), "DS-TI")
        else:
            result, err = await safe_ds_call(ti.lookup_domain(inp.target), "DS-TI")

        if err is not None:
            raise PartialResult(
                payload=DomainUrlReputationPayload(
                    target=inp.target,
                    kind=inp.kind,
                    verdict="unknown",
                ),
                reasons=[err],
                confidence=0.0,
            )

        # TI returned None → target unknown, not an error
        if result is None:
            return DomainUrlReputationPayload(target=inp.target, kind=inp.kind)

        # TI returned data — copy recognised fields verbatim
        payload = DomainUrlReputationPayload(
            target=inp.target,
            kind=inp.kind,
            verdict=result.get("verdict", "unknown"),
            categories=result.get("categories", []),
            age_days=result.get("age_days"),
            first_seen=result.get("first_seen"),
            tags=result.get("tags", []),
            sources=result.get("sources", []),
        )
        return payload
