"""A1: User / account profile aggregation across HR, IDP, Email, CMDB, KB."""
from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
from typing import Any

from pydantic import BaseModel, Field

from secmind_investigator.core.capability import AtomicCapability
from secmind_investigator.core.context import ExecutionContext
from secmind_investigator.core.errors import PartialResult
from secmind_investigator.core.utils import safe_ds_call


class UserProfileInput(BaseModel):
    principal: str
    time_window_days: int = 30


class UserProfilePayload(BaseModel):
    identity: dict[str, Any] = Field(default_factory=dict)
    auth: dict[str, Any] = Field(default_factory=dict)
    privilege: dict[str, Any] = Field(default_factory=dict)
    assets: list[dict[str, Any]] = Field(default_factory=list)
    email: dict[str, Any] = Field(default_factory=dict)
    risk_tags: list[str] = Field(default_factory=list)
    prior_alerts_30d: int = 0


class UserProfileCapability(
    AtomicCapability[UserProfileInput, UserProfilePayload]
):
    """A1: aggregate user identity, auth, ownership, and risk signals."""

    namespace = "investigate.entity.user.profile"
    input_model = UserProfileInput
    output_payload_model = UserProfilePayload

    async def execute(
        self, inp: UserProfileInput, ctx: ExecutionContext
    ) -> UserProfilePayload:
        hr = ctx.datasources.get("DS-HR")
        idp = ctx.datasources.get("DS-IDP")
        email = ctx.datasources.get("DS-EMAIL")
        kb = ctx.datasources.get("DS-KB")
        cmdb = ctx.datasources.get("DS-CMDB")

        async def _hr_call() -> tuple[Any, str | None]:
            if hr is None:
                return None, "DS-HR: not configured"
            return await safe_ds_call(hr.get_employee(inp.principal), "DS-HR")

        async def _idp_call() -> tuple[Any, str | None]:
            if idp is None:
                return None, "DS-IDP: not configured"
            return await safe_ds_call(idp.get_account(inp.principal), "DS-IDP")

        async def _email_call() -> tuple[Any, str | None]:
            if email is None:
                return None, "DS-EMAIL: not configured"
            return await safe_ds_call(email.get_mailbox(inp.principal), "DS-EMAIL")

        async def _kb_call() -> tuple[int, str | None]:
            if kb is None:
                return 0, None  # optional
            result, err = await safe_ds_call(
                kb.count_prior("user", inp.principal, timedelta(days=inp.time_window_days)),
                "DS-KB",
            )
            return (0 if result is None else result), err

        async def _cmdb_call() -> tuple[list[dict[str, Any]], str | None]:
            if cmdb is None:
                return [], None  # optional
            result, err = await safe_ds_call(
                cmdb.assets_owned_by(inp.principal), "DS-CMDB"
            )
            return ([] if result is None else result), err

        hr_res, idp_res, email_res, kb_res, cmdb_res = await asyncio.gather(
            _hr_call(), _idp_call(), _email_call(), _kb_call(), _cmdb_call()
        )

        hr_emp, hr_err = hr_res
        acct, idp_err = idp_res
        mbx, em_err = email_res
        priors, kb_err = kb_res
        assets, cmdb_err = cmdb_res

        reasons = [r for r in (hr_err, idp_err, em_err, kb_err, cmdb_err) if r]

        risk_tags: list[str] = []
        identity: dict[str, Any] = {}
        if hr_emp:
            identity = {
                "display_name": hr_emp.get("display_name"),
                "employee_id": hr_emp.get("employee_id"),
                "department": hr_emp.get("department"),
                "manager": hr_emp.get("manager"),
                "hire_date": hr_emp.get("hire_date"),
                "status": hr_emp.get("status"),
                "leaving_date": hr_emp.get("leaving_date"),
            }
            ld = hr_emp.get("leaving_date")
            if ld is not None and ld - datetime.now(UTC) <= timedelta(days=30):
                risk_tags.append("leaver_30d")

        auth = dict(acct) if acct else {}
        if auth.get("is_privileged") and not auth.get("mfa_enabled"):
            risk_tags.append("priv_no_mfa")

        email_info: dict[str, Any] = (
            dict(mbx) if mbx else {"aliases": [], "forwarding_rules": []}
        )
        email_info.setdefault("aliases", [])
        email_info.setdefault("forwarding_rules", [])
        if any(r.get("external") for r in email_info["forwarding_rules"]):
            risk_tags.append("external_forwarding")

        payload = UserProfilePayload(
            identity=identity,
            auth=auth,
            privilege={"is_privileged": bool(auth.get("is_privileged", False))},
            assets=list(assets) if assets else [],
            email=email_info,
            risk_tags=risk_tags,
            prior_alerts_30d=priors,
        )

        if reasons:
            raise PartialResult(payload=payload, reasons=reasons, confidence=0.5)
        return payload
