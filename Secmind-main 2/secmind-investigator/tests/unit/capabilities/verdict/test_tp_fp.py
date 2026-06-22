"""Tests for F1 TpFpCapability."""
from __future__ import annotations

import pytest

from secmind_investigator.capabilities.verdict.tp_fp import TpFpCapability
from secmind_investigator.core.context import ExecutionContext


def _ctx() -> ExecutionContext:
    return ExecutionContext(datasources={})


# ── Test 1: malicious IP/URL evidence → TP ────────────────────────────────────

async def test_malicious_evidence_returns_inc() -> None:
    """A single malicious hit (score=0.5) sits in INC range (0.3-0.6)."""
    evidence = [
        {
            "payload": {"verdict": "malicious", "target": "1.2.3.4"},
            "confidence": 0.99,
            "partial": False,
            "partial_reasons": [],
        }
    ]
    res = await TpFpCapability().run({"evidence_set": evidence}, _ctx())
    assert res.partial is False
    assert res.payload["verdict"] == "INC"
    assert any("malicious" in r for r in res.payload["key_reasons"])


# ── Test 2: only weak signals → INC ──────────────────────────────────────────

async def test_weak_signals_returns_fp() -> None:
    """Suspicious reputation alone (score=0.2) falls below INC threshold → FP."""
    evidence = [
        {
            "payload": {"verdict": "suspicious"},
            "confidence": 0.5,
            "partial": False,
            "partial_reasons": [],
        }
    ]
    res = await TpFpCapability().run({"evidence_set": evidence}, _ctx())
    assert res.payload["verdict"] == "FP"
    assert res.payload["confidence"] == pytest.approx(0.2)


# ── Test 3: empty evidence_set → INC ─────────────────────────────────────────

async def test_empty_evidence_returns_inc() -> None:
    """No evidence provided → INC with confidence 0.4."""
    res = await TpFpCapability().run({"evidence_set": []}, _ctx())
    assert res.payload["verdict"] == "INC"
    assert res.payload["confidence"] == 0.4


# ── Test 4: multiple strong signals → high confidence TP ─────────────────────

async def test_multiple_strong_signals_tp() -> None:
    """malicious + auth_failure + urgency_keywords + external_forwarding → TP, high conf."""
    evidence = [
        {
            "payload": {
                "verdict": "malicious",
                "target": "evil.com",
                "phishing_signals": {
                    "auth_failure": True,
                    "urgency_keywords": ["urgent", "wire transfer"],
                },
                "risk_tags": ["external_forwarding", "priv_no_mfa"],
            },
            "confidence": 0.9,
            "partial": False,
            "partial_reasons": [],
        }
    ]
    res = await TpFpCapability().run({"evidence_set": evidence}, _ctx())
    assert res.payload["verdict"] == "TP"
    assert res.payload["confidence"] >= 0.9
    reasons = res.payload["key_reasons"]
    assert any("malicious" in r for r in reasons)
    assert any("authentication" in r for r in reasons)
    assert any("urgency" in r for r in reasons)
    assert any("forwarding" in r for r in reasons)
    assert any("MFA" in r for r in reasons)


# ── Test 5: partial evidence adds to remaining_uncertainties ──────────────────

async def test_partial_evidence_adds_uncertainties() -> None:
    """Partial evidence items contribute to remaining_uncertainties."""
    evidence = [
        {
            "payload": {"verdict": "malicious", "target": "x.com"},
            "confidence": 0.4,
            "partial": True,
            "partial_reasons": ["DS-TI: timeout", "DS-EMAIL: not configured"],
        }
    ]
    res = await TpFpCapability().run({"evidence_set": evidence}, _ctx())
    assert "DS-TI: timeout" in res.payload["remaining_uncertainties"]
    assert "DS-EMAIL: not configured" in res.payload["remaining_uncertainties"]


# ── Test 6: namespace correct ─────────────────────────────────────────────────

async def test_namespace_correct() -> None:
    assert TpFpCapability.namespace == "investigate.verdict.tp_fp"


# ── Test 7: leaver_30d risk tag → adds to key_reasons + reaches INC ──────────

async def test_leaver_risk_tag_contributes_score() -> None:
    """leaver_30d tag alone (score=0.15) → FP but key_reasons populated."""
    evidence = [
        {
            "payload": {"risk_tags": ["leaver_30d"]},
            "confidence": 0.7,
            "partial": False,
            "partial_reasons": [],
        }
    ]
    res = await TpFpCapability().run({"evidence_set": evidence}, _ctx())
    assert res.payload["verdict"] == "FP"
    assert any("leaver" in r for r in res.payload["key_reasons"])
