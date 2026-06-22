"""F8: Response recommendation — containment + evidence preservation by verdict."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from secmind_investigator.core.capability import AtomicCapability
from secmind_investigator.core.context import ExecutionContext


class ResponseRecommendationInput(BaseModel):
    verdict: dict[str, Any]
    impact: dict[str, Any]
    affected_entities: dict[str, list[str]]


class ResponseRecommendationPayload(BaseModel):
    containment: list[dict[str, Any]] = Field(default_factory=list)
    eradication: list[dict[str, Any]] = Field(default_factory=list)
    recovery: list[dict[str, Any]] = Field(default_factory=list)
    evidence_preservation: list[dict[str, Any]] = Field(default_factory=list)


def _action(
    action: str,
    target_entity: str,
    command_preview: str,
    estimated_business_impact: str,
    risk: str,
    requires_approval: bool,
) -> dict[str, Any]:
    return {
        "action": action,
        "target_entity": target_entity,
        "command_preview": command_preview,
        "estimated_business_impact": estimated_business_impact,
        "risk": risk,
        "requires_approval": requires_approval,
    }


class ResponseRecommendationCapability(
    AtomicCapability[ResponseRecommendationInput, ResponseRecommendationPayload]
):
    """F8: recommend containment and evidence preservation actions based on verdict."""

    namespace = "investigate.verdict.response_recommendation"
    input_model = ResponseRecommendationInput
    output_payload_model = ResponseRecommendationPayload

    async def execute(
        self, inp: ResponseRecommendationInput, ctx: ExecutionContext
    ) -> ResponseRecommendationPayload:
        verdict_label = inp.verdict.get("verdict", "")

        # Only act on confirmed TP
        if verdict_label != "TP":
            return ResponseRecommendationPayload()

        containment: list[dict[str, Any]] = []
        evidence_preservation: list[dict[str, Any]] = []

        users = inp.affected_entities.get("users", [])
        hosts = inp.affected_entities.get("hosts", [])

        for user in users:
            containment.append(
                _action(
                    action="disable_account",
                    target_entity=user,
                    command_preview=f"# disable account {user}",
                    estimated_business_impact="User loses access to all systems",
                    risk="medium",
                    requires_approval=True,
                )
            )
            containment.append(
                _action(
                    action="reset_password",
                    target_entity=user,
                    command_preview=f"# reset password for {user}",
                    estimated_business_impact="User must re-authenticate",
                    risk="low",
                    requires_approval=False,
                )
            )

        for host in hosts:
            containment.append(
                _action(
                    action="isolate_host",
                    target_entity=host,
                    command_preview=f"# isolate host {host}",
                    estimated_business_impact="Host loses network connectivity",
                    risk="high",
                    requires_approval=True,
                )
            )
            evidence_preservation.append(
                _action(
                    action="disk_image",
                    target_entity=host,
                    command_preview=f"# capture disk image of {host}",
                    estimated_business_impact="Minimal; read-only operation",
                    risk="low",
                    requires_approval=False,
                )
            )

        return ResponseRecommendationPayload(
            containment=containment,
            eradication=[],
            recovery=[],
            evidence_preservation=evidence_preservation,
        )
