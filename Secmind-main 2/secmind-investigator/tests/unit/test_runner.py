"""Unit tests for secmind_investigator.runner."""
from __future__ import annotations

import json
import asyncio
import pytest

from secmind_investigator.runner import _list_scenarios, _run, SCENARIOS, CAPABILITY_REGISTRY


class TestListScenarios:
    """Test 1: scenario catalog covers all 6 P0 capabilities with ≥2 scenarios each."""

    def test_all_six_capabilities_present(self):
        catalog = _list_scenarios()
        assert set(catalog.keys()) == {"A1", "B8", "E2", "F1", "F4", "F8"}

    def test_each_capability_has_at_least_two_scenarios(self):
        catalog = _list_scenarios()
        for cap_id, scenarios in catalog.items():
            assert len(scenarios) >= 2, (
                f"{cap_id} has only {len(scenarios)} scenario(s); need ≥2"
            )

    def test_scenario_items_have_id_and_label(self):
        catalog = _list_scenarios()
        for cap_id, scenarios in catalog.items():
            for s in scenarios:
                assert "id" in s, f"{cap_id} scenario missing 'id'"
                assert "label" in s, f"{cap_id} scenario missing 'label'"
                assert s["label"], f"{cap_id}/{s['id']} has empty label"

    def test_scenario_ids_match_keys(self):
        """Scenario ids must match the dict keys in SCENARIOS."""
        for cap_id, scenarios in SCENARIOS.items():
            catalog = _list_scenarios()[cap_id]
            catalog_ids = {s["id"] for s in catalog}
            assert catalog_ids == set(scenarios.keys())


class TestRunA1LeavingEmployee:
    """Test 2: A1 leaving-employee scenario produces expected risk_tags."""

    def test_risk_tags_contain_leaver_and_forwarding(self):
        payload = {"capability_id": "A1", "scenario_id": "leaving-employee"}
        result = asyncio.run(_run(payload))

        assert result["ok"] is True, f"run failed: {result.get('error')}"
        assert result["capability_id"] == "A1"

        risk_tags = result["result"]["payload"]["risk_tags"]
        assert "leaver_30d" in risk_tags, (
            f"expected 'leaver_30d' in risk_tags, got {risk_tags}"
        )
        assert "external_forwarding" in risk_tags, (
            f"expected 'external_forwarding' in risk_tags, got {risk_tags}"
        )

    def test_result_shape(self):
        payload = {"capability_id": "A1", "scenario_id": "leaving-employee"}
        result = asyncio.run(_run(payload))

        assert result["ok"] is True
        r = result["result"]
        assert "payload" in r
        assert "confidence" in r
        assert "partial" in r
        assert "duration_ms" in r
        assert result["scenario_id"] == "leaving-employee"
        assert result["namespace"] == "investigate.entity.user.profile"

    def test_ds_seeds_summary_present(self):
        payload = {"capability_id": "A1", "scenario_id": "leaving-employee"}
        result = asyncio.run(_run(payload))

        assert result["ok"] is True
        summary = result["ds_seeds_summary"]
        assert "DS-HR" in summary
        assert "DS-IDP" in summary
        assert "DS-EMAIL" in summary


class TestRunE2MaliciousUrl:
    """Test 3: E2 malicious-url scenario returns verdict='malicious'."""

    def test_verdict_malicious(self):
        payload = {"capability_id": "E2", "scenario_id": "malicious-url"}
        result = asyncio.run(_run(payload))

        assert result["ok"] is True, f"run failed: {result.get('error')}"
        verdict = result["result"]["payload"]["verdict"]
        assert verdict == "malicious", f"expected verdict='malicious', got {verdict!r}"

    def test_result_metadata(self):
        payload = {"capability_id": "E2", "scenario_id": "malicious-url"}
        result = asyncio.run(_run(payload))

        assert result["ok"] is True
        assert result["namespace"] == "investigate.intel.domain_url.reputation"
        p = result["result"]["payload"]
        assert p["target"] == "https://c0rp-login.com/login"
        assert p["kind"] == "url"

    def test_clean_domain_verdict(self):
        """Bonus: clean-domain scenario returns verdict='clean'."""
        payload = {"capability_id": "E2", "scenario_id": "clean-domain"}
        result = asyncio.run(_run(payload))

        assert result["ok"] is True
        assert result["result"]["payload"]["verdict"] == "clean"


class TestRunErrors:
    """Error handling in runner._run()."""

    def test_unknown_capability_id(self):
        payload = {"capability_id": "ZZ"}
        result = asyncio.run(_run(payload))
        assert result["ok"] is False
        assert "unknown capability_id" in result["error"]

    def test_missing_capability_id(self):
        payload = {}
        result = asyncio.run(_run(payload))
        assert result["ok"] is False

    def test_custom_inputs_override_scenario(self):
        """custom_inputs override scenario's principal."""
        payload = {
            "capability_id": "A1",
            "scenario_id": "normal-user",
            "custom_inputs": {"principal": "alice@corp", "time_window_days": 14},
        }
        result = asyncio.run(_run(payload))
        assert result["ok"] is True
        assert result["input_used"]["principal"] == "alice@corp"
        assert result["input_used"]["time_window_days"] == 14
