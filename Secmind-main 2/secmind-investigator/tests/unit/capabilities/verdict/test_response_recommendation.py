"""Tests for F8 ResponseRecommendationCapability."""
from __future__ import annotations

from typing import Any

from secmind_investigator.capabilities.verdict.response_recommendation import (
    ResponseRecommendationCapability,
)
from secmind_investigator.core.context import ExecutionContext


def _ctx() -> ExecutionContext:
    return ExecutionContext(datasources={})


def _tp_verdict(**extra: Any) -> dict[str, Any]:
    base = {
        "verdict": "TP",
        "confidence": 0.9,
        "key_reasons": ["malicious reputation hit"],
        "counter_evidence": [],
        "remaining_uncertainties": [],
    }
    base.update(extra)
    return base


def _affected(
    users: list[str] | None = None,
    hosts: list[str] | None = None,
) -> dict[str, list[str]]:
    return {
        "users": users or [],
        "hosts": hosts or [],
        "accounts": [],
        "data_objects": [],
        "cloud_resources": [],
    }


# ── Test 1: TP + user → disable_account + reset_password ─────────────────────

async def test_tp_user_containment_actions() -> None:
    """TP verdict with a user → containment has disable_account and reset_password."""
    res = await ResponseRecommendationCapability().run(
        {
            "verdict": _tp_verdict(),
            "impact": {"severity": "P1"},
            "affected_entities": _affected(users=["alice@corp.com"]),
        },
        _ctx(),
    )
    assert res.partial is False
    containment = res.payload["containment"]
    actions = [a["action"] for a in containment]
    assert "disable_account" in actions
    assert "reset_password" in actions

    disable = next(a for a in containment if a["action"] == "disable_account")
    assert disable["target_entity"] == "alice@corp.com"
    assert disable["requires_approval"] is True
    assert disable["risk"] == "medium"
    assert "alice@corp.com" in disable["command_preview"]

    reset = next(a for a in containment if a["action"] == "reset_password")
    assert reset["target_entity"] == "alice@corp.com"
    assert reset["requires_approval"] is False
    assert reset["risk"] == "low"


# ── Test 2: TP + host → isolate_host + disk_image ────────────────────────────

async def test_tp_host_containment_and_evidence_preservation() -> None:
    """TP verdict with a host → isolate_host in containment, disk_image in evidence_preservation."""
    res = await ResponseRecommendationCapability().run(
        {
            "verdict": _tp_verdict(),
            "impact": {"severity": "P0"},
            "affected_entities": _affected(hosts=["workstation-42"]),
        },
        _ctx(),
    )
    containment = res.payload["containment"]
    ev_pres = res.payload["evidence_preservation"]

    isolate = next((a for a in containment if a["action"] == "isolate_host"), None)
    assert isolate is not None
    assert isolate["target_entity"] == "workstation-42"
    assert isolate["requires_approval"] is True
    assert isolate["risk"] == "high"
    assert "workstation-42" in isolate["command_preview"]

    disk = next((a for a in ev_pres if a["action"] == "disk_image"), None)
    assert disk is not None
    assert disk["target_entity"] == "workstation-42"
    assert disk["requires_approval"] is False
    assert "workstation-42" in disk["command_preview"]

    # eradication and recovery are empty in P0
    assert res.payload["eradication"] == []
    assert res.payload["recovery"] == []


# ── Test 3: FP verdict → all empty lists ─────────────────────────────────────

async def test_fp_verdict_returns_empty_lists() -> None:
    """FP verdict → no actions recommended."""
    fp_verdict = {
        "verdict": "FP",
        "confidence": 0.1,
        "key_reasons": [],
        "counter_evidence": [],
        "remaining_uncertainties": [],
    }
    res = await ResponseRecommendationCapability().run(
        {
            "verdict": fp_verdict,
            "impact": {"severity": "P3"},
            "affected_entities": _affected(users=["bob@corp.com"], hosts=["srv-01"]),
        },
        _ctx(),
    )
    assert res.payload["containment"] == []
    assert res.payload["eradication"] == []
    assert res.payload["recovery"] == []
    assert res.payload["evidence_preservation"] == []


# ── Test 4: INC verdict → all empty lists ────────────────────────────────────

async def test_inc_verdict_returns_empty_lists() -> None:
    """INC verdict → no actions recommended."""
    inc_verdict = {
        "verdict": "INC",
        "confidence": 0.4,
        "key_reasons": [],
        "counter_evidence": [],
        "remaining_uncertainties": [],
    }
    res = await ResponseRecommendationCapability().run(
        {
            "verdict": inc_verdict,
            "impact": {"severity": "P2"},
            "affected_entities": _affected(users=["carol@corp.com"]),
        },
        _ctx(),
    )
    assert res.payload["containment"] == []
    assert res.payload["eradication"] == []
    assert res.payload["recovery"] == []
    assert res.payload["evidence_preservation"] == []


# ── Test 5: namespace correct ─────────────────────────────────────────────────

async def test_namespace_correct() -> None:
    assert (
        ResponseRecommendationCapability.namespace
        == "investigate.verdict.response_recommendation"
    )


# ── Test 6: multiple users → multiple actions per user ───────────────────────

async def test_multiple_users_multiple_actions() -> None:
    """Two users → 4 containment actions (2 per user)."""
    res = await ResponseRecommendationCapability().run(
        {
            "verdict": _tp_verdict(),
            "impact": {"severity": "P1"},
            "affected_entities": _affected(users=["alice@corp.com", "dave@corp.com"]),
        },
        _ctx(),
    )
    containment = res.payload["containment"]
    # 2 users x 2 actions = 4 total
    assert len(containment) == 4
    targets = [a["target_entity"] for a in containment]
    assert targets.count("alice@corp.com") == 2
    assert targets.count("dave@corp.com") == 2
