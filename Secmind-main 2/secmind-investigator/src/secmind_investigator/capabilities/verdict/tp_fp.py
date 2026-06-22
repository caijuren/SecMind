"""F1: TP/FP verdict synthesis via weighted scoring of evidence set."""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

from secmind_investigator.core.capability import AtomicCapability
from secmind_investigator.core.context import ExecutionContext


class TpFpInput(BaseModel):
    evidence_set: list[dict[str, Any]]
    policy: dict[str, Any] | None = None


class TpFpPayload(BaseModel):
    verdict: Literal["TP", "FP", "BP", "INC"]
    confidence: float
    key_reasons: list[str] = Field(default_factory=list)
    counter_evidence: list[str] = Field(default_factory=list)
    remaining_uncertainties: list[str] = Field(default_factory=list)


class TpFpCapability(AtomicCapability[TpFpInput, TpFpPayload]):
    """F1: rule-based weighted scoring of evidence set to produce TP/FP/INC verdict."""

    namespace = "investigate.verdict.tp_fp"
    input_model = TpFpInput
    output_payload_model = TpFpPayload

    async def execute(self, inp: TpFpInput, ctx: ExecutionContext) -> TpFpPayload:
        score = 0.0
        key_reasons: list[str] = []
        counter_evidence: list[str] = []
        remaining_uncertainties: list[str] = []

        for ev in inp.evidence_set:
            payload = ev.get("payload", {})

            # Reputation hit (E1/E2/E3) — strong TP signal
            verdict = payload.get("verdict")
            if verdict == "malicious":
                score += 0.5
                key_reasons.append(
                    f"malicious reputation hit ({payload.get('target', payload.get('hash', '?'))})"
                )
            elif verdict == "suspicious":
                score += 0.2
                key_reasons.append("suspicious reputation hit")

            # Phishing signals (B8) — moderate signal
            ps = payload.get("phishing_signals")
            if ps:
                if ps.get("auth_failure"):
                    score += 0.2
                    key_reasons.append("email authentication failure (SPF/DKIM/DMARC)")
                if ps.get("urgency_keywords"):
                    score += 0.1
                    key_reasons.append(f"urgency keywords: {ps['urgency_keywords']}")

            # Risk tags (A1) — moderate signal
            risk_tags = payload.get("risk_tags", [])
            if "leaver_30d" in risk_tags:
                score += 0.15
                key_reasons.append("user is within 30d leaver window")
            if "priv_no_mfa" in risk_tags:
                score += 0.15
                key_reasons.append("privileged account without MFA")
            if "external_forwarding" in risk_tags:
                score += 0.2
                key_reasons.append("external email forwarding rule")

            # Partial results add uncertainty
            if ev.get("partial"):
                for r in ev.get("partial_reasons", []):
                    remaining_uncertainties.append(r)

        # Score → verdict thresholds
        if score >= 0.6:
            verdict_label: Literal["TP", "FP", "BP", "INC"] = "TP"
        elif score >= 0.3 or (score == 0.0 and not inp.evidence_set):
            verdict_label = "INC"
        else:
            verdict_label = "FP"

        final_confidence = (
            min(1.0, max(0.1, score)) if verdict_label != "INC" else 0.4
        )

        return TpFpPayload(
            verdict=verdict_label,
            confidence=final_confidence,
            key_reasons=key_reasons,
            counter_evidence=counter_evidence,
            remaining_uncertainties=remaining_uncertainties,
        )
