"""B8: Email activity investigation via DS-EMAIL."""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from pydantic import BaseModel, Field, model_validator

from secmind_investigator.core.capability import AtomicCapability
from secmind_investigator.core.context import ExecutionContext
from secmind_investigator.core.errors import PartialResult
from secmind_investigator.core.utils import safe_ds_call

_URGENCY_KEYWORDS = [
    "urgent",
    "wire transfer",
    "verify",
    "password",
    "immediately",
    "action required",
]


class EmailActivityInput(BaseModel):
    mailbox: str | None = None
    message_id: str | None = None
    time_window_days: int = 7

    @model_validator(mode="after")
    def _require_one_identifier(self) -> EmailActivityInput:
        if self.mailbox is None and self.message_id is None:
            raise ValueError("At least one of 'mailbox' or 'message_id' must be provided.")
        return self


class EmailActivityPayload(BaseModel):
    messages: list[dict[str, Any]] = Field(default_factory=list)
    forwarding_rules: list[dict[str, Any]] = Field(default_factory=list)
    mass_send_indicator: bool = False
    phishing_signals: dict[str, Any] = Field(default_factory=dict)


def _compute_phishing_signals(messages: list[dict[str, Any]]) -> dict[str, Any]:
    """Derive phishing signals from a list of message records."""
    urgency_hits: set[str] = set()
    auth_failure = False
    suspicious_link = False
    lookalike_sender = False

    for msg in messages:
        subject = (msg.get("subject") or "").lower()
        for kw in _URGENCY_KEYWORDS:
            if kw in subject:
                urgency_hits.add(kw)

        auth_results = (msg.get("auth_results") or "").lower()
        if "fail" in auth_results:
            auth_failure = True

        links = msg.get("links") or []
        if len(links) > 0:
            suspicious_link = True

    return {
        "lookalike_sender": lookalike_sender,
        "suspicious_link": suspicious_link,
        "urgency_keywords": sorted(urgency_hits),
        "auth_failure": auth_failure,
    }


class EmailActivityCapability(
    AtomicCapability[EmailActivityInput, EmailActivityPayload]
):
    """B8: fetch email messages and compute phishing signals via DS-EMAIL."""

    namespace = "investigate.activity.email"
    input_model = EmailActivityInput
    output_payload_model = EmailActivityPayload

    async def execute(
        self, inp: EmailActivityInput, ctx: ExecutionContext
    ) -> EmailActivityPayload:
        email = ctx.datasources.get("DS-EMAIL")

        if email is None:
            raise PartialResult(
                payload=EmailActivityPayload(),
                reasons=["DS-EMAIL: not configured"],
                confidence=0.0,
            )

        messages: list[dict[str, Any]] = []
        forwarding_rules: list[dict[str, Any]] = []

        if inp.message_id is not None:
            result, err = await safe_ds_call(
                email.get_message(inp.message_id), "DS-EMAIL"
            )
            if err is not None:
                raise PartialResult(
                    payload=EmailActivityPayload(),
                    reasons=[err],
                    confidence=0.0,
                )
            if result is not None:
                messages = [result]
        else:
            # mailbox path
            assert inp.mailbox is not None
            until = datetime.now(UTC)
            since = until - timedelta(days=inp.time_window_days)

            msgs_result, msgs_err = await safe_ds_call(
                email.list_received(inp.mailbox, since, until), "DS-EMAIL"
            )
            rules_result, rules_err = await safe_ds_call(
                email.get_forwarding_rules(inp.mailbox), "DS-EMAIL"
            )

            reasons: list[str] = []
            if msgs_err:
                reasons.append(msgs_err)
            else:
                messages = msgs_result or []

            if rules_err:
                reasons.append(rules_err)
            else:
                forwarding_rules = rules_result or []

            if reasons:
                raise PartialResult(
                    payload=EmailActivityPayload(
                        messages=messages,
                        forwarding_rules=forwarding_rules,
                    ),
                    reasons=reasons,
                    confidence=0.3,
                )

        mass_send_indicator = any(
            len(msg.get("to") or []) > 10 for msg in messages
        )
        phishing_signals = _compute_phishing_signals(messages)

        return EmailActivityPayload(
            messages=messages,
            forwarding_rules=forwarding_rules,
            mass_send_indicator=mass_send_indicator,
            phishing_signals=phishing_signals,
        )
