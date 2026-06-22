"""End-to-end orchestration: phishing alert → 6 atomic capabilities → verdict + response."""
import json
from datetime import datetime
from pathlib import Path

from secmind_investigator.capabilities.activity.email import EmailActivityCapability
from secmind_investigator.capabilities.entity.user_profile import (
    UserProfileCapability,
)
from secmind_investigator.capabilities.intel.domain_url_reputation import (
    DomainUrlReputationCapability,
)
from secmind_investigator.capabilities.verdict.ioc_extract import IocExtractCapability
from secmind_investigator.capabilities.verdict.response_recommendation import (
    ResponseRecommendationCapability,
)
from secmind_investigator.capabilities.verdict.tp_fp import TpFpCapability
from secmind_investigator.core.context import ExecutionContext
from secmind_investigator.datasources.mocks import (
    MockCmdbDataSource,
    MockEmailDataSource,
    MockHrDataSource,
    MockIdpDataSource,
    MockKbDataSource,
    MockTiDataSource,
)


async def test_phishing_alert_end_to_end() -> None:
    scenario = json.loads(
        Path("tests/fixtures/phishing_scenario.json").read_text()
    )
    victim = scenario["victim_user"]
    email_msg = dict(scenario["phishing_email"])
    email_msg["ts"] = datetime.fromisoformat(email_msg["ts"].replace("Z", "+00:00"))
    suspicious_url = email_msg["links"][0]

    ctx = ExecutionContext(datasources={
        "DS-HR": MockHrDataSource(employees={victim: scenario["hr_alice"]}),
        "DS-IDP": MockIdpDataSource(accounts={
            victim: {"upn": victim, "mfa_enabled": True, "is_privileged": False}
        }),
        "DS-EMAIL": MockEmailDataSource(
            messages={email_msg["message_id"]: email_msg},
            mailboxes={victim: {"primary": victim, "aliases": [], "forwarding_rules": []}},
        ),
        "DS-TI": MockTiDataSource(url_lookups={suspicious_url: scenario["ti_url"]}),
        "DS-KB": MockKbDataSource(),
        "DS-CMDB": MockCmdbDataSource(),
    })

    # Step 1: user profile
    user_res = await UserProfileCapability().run({"principal": victim}, ctx)
    assert user_res.payload["identity"]["display_name"] == "Alice"

    # Step 2: email activity (resolve the message)
    email_res = await EmailActivityCapability().run(
        {"message_id": scenario["alert"]["message_id"]}, ctx
    )
    assert any(m["message_id"] == "msg-001" for m in email_res.payload["messages"])
    assert email_res.payload["phishing_signals"]["auth_failure"] is True
    assert email_res.payload["phishing_signals"]["urgency_keywords"]

    # Step 3: URL reputation
    url_res = await DomainUrlReputationCapability().run(
        {"target": suspicious_url, "kind": "url"}, ctx
    )
    assert url_res.payload["verdict"] == "malicious"

    # Step 4: verdict
    verdict_res = await TpFpCapability().run(
        {"evidence_set": [
            user_res.model_dump(),
            email_res.model_dump(),
            url_res.model_dump(),
        ]},
        ctx,
    )
    assert verdict_res.payload["verdict"] == "TP", (
        f"expected TP given malicious URL + auth-failure + urgency, "
        f"got {verdict_res.payload}"
    )

    # Step 5: IOC extract
    ioc_res = await IocExtractCapability().run(
        {"evidence_set": [
            user_res.model_dump(),
            email_res.model_dump(),
            url_res.model_dump(),
        ]},
        ctx,
    )
    assert len(ioc_res.payload["iocs"]) >= 2, f"got iocs: {ioc_res.payload['iocs']}"
    # Expect at least: the malicious URL, sender email, and maybe domain
    ioc_values = {i["value"] for i in ioc_res.payload["iocs"]}
    assert any("c0rp-login.com" in v for v in ioc_values)

    # Step 6: response recommendation
    resp_res = await ResponseRecommendationCapability().run(
        {
            "verdict": verdict_res.payload,
            "impact": {"severity": "P2"},
            "affected_entities": {"users": [victim], "hosts": []},
        },
        ctx,
    )
    actions = resp_res.payload["containment"]
    assert actions, "expected at least one containment action for TP"
    assert any(a["target_entity"] == victim for a in actions)
