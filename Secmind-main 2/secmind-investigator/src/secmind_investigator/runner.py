#!/usr/bin/env python3
"""Run a single atomic capability against preset or custom data and emit JSON.

Used by the Next.js API route to expose a UI "试运行" feature.
Reads JSON from stdin, writes one JSON object to stdout.
Pass --list as the first argument to print the scenario catalog and exit.
"""
from __future__ import annotations

import asyncio
import json
import sys
from datetime import UTC, datetime, timedelta
from typing import Any

from secmind_investigator.capabilities.activity.email import EmailActivityCapability
from secmind_investigator.capabilities.entity.user_profile import UserProfileCapability
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

CAPABILITY_REGISTRY = {
    "A1": UserProfileCapability,
    "B8": EmailActivityCapability,
    "E2": DomainUrlReputationCapability,
    "F1": TpFpCapability,
    "F4": IocExtractCapability,
    "F8": ResponseRecommendationCapability,
}

# ---------------------------------------------------------------------------
# Preset scenarios — 2-3 per capability
# Placeholder strings <NOW_*> are resolved at runtime via _resolve_timestamps()
# ---------------------------------------------------------------------------
SCENARIOS: dict[str, dict[str, dict[str, Any]]] = {
    # A1 — User profile
    "A1": {
        "normal-user": {
            "label": "正常员工（无风险）",
            "inputs": {"principal": "alice@corp"},
            "datasources": {
                "DS-HR": {
                    "employees": {
                        "alice@corp": {
                            "display_name": "Alice",
                            "employee_id": "E001",
                            "department": "Engineering",
                            "status": "active",
                            "leaving_date": None,
                        }
                    }
                },
                "DS-IDP": {
                    "accounts": {
                        "alice@corp": {
                            "upn": "alice@corp",
                            "mfa_enabled": True,
                            "is_privileged": False,
                        }
                    }
                },
                "DS-EMAIL": {
                    "mailboxes": {
                        "alice@corp": {"aliases": [], "forwarding_rules": []}
                    }
                },
            },
        },
        "leaving-employee": {
            "label": "即将离职 + 外发转发规则（高风险）",
            "inputs": {"principal": "eve@corp"},
            "datasources": {
                "DS-HR": {
                    "employees": {
                        "eve@corp": {
                            "display_name": "Eve",
                            "employee_id": "E099",
                            "department": "Finance",
                            "status": "active",
                            "leaving_date": "<NOW_PLUS_10_DAYS>",
                        }
                    }
                },
                "DS-IDP": {
                    "accounts": {
                        "eve@corp": {"upn": "eve@corp", "mfa_enabled": True}
                    }
                },
                "DS-EMAIL": {
                    "mailboxes": {
                        "eve@corp": {
                            "aliases": [],
                            "forwarding_rules": [
                                {
                                    "target": "eve.personal@gmail.com",
                                    "external": True,
                                }
                            ],
                        }
                    }
                },
            },
        },
        "priv-no-mfa": {
            "label": "特权账户无 MFA（中风险）",
            "inputs": {"principal": "admin@corp"},
            "datasources": {
                "DS-HR": {
                    "employees": {
                        "admin@corp": {
                            "display_name": "Admin",
                            "status": "active",
                            "leaving_date": None,
                        }
                    }
                },
                "DS-IDP": {
                    "accounts": {
                        "admin@corp": {
                            "upn": "admin@corp",
                            "mfa_enabled": False,
                            "is_privileged": True,
                        }
                    }
                },
                "DS-EMAIL": {
                    "mailboxes": {
                        "admin@corp": {"aliases": [], "forwarding_rules": []}
                    }
                },
            },
        },
    },
    # B8 — Email activity
    "B8": {
        "phishing-email": {
            "label": "钓鱼邮件（认证失败 + 紧迫性 + 可疑链接）",
            "inputs": {"mailbox": "alice@corp", "time_window_days": 7},
            "datasources": {
                "DS-EMAIL": {
                    "mailboxes": {
                        "alice@corp": {"aliases": [], "forwarding_rules": []}
                    },
                    "received": {
                        "alice@corp": [
                            {
                                "message_id": "msg-001",
                                "subject": "Urgent: wire transfer required immediately",
                                "from": "cfo@c0rp-finance.com",
                                "to": ["alice@corp"],
                                "auth_results": "spf=fail dkim=fail dmarc=fail",
                                "links": ["https://c0rp-login.com/verify"],
                                "ts": "<NOW_MINUS_1_HOUR>",
                            }
                        ]
                    },
                }
            },
        },
        "clean-email": {
            "label": "正常邮件（无风险信号）",
            "inputs": {"mailbox": "bob@corp", "time_window_days": 7},
            "datasources": {
                "DS-EMAIL": {
                    "mailboxes": {
                        "bob@corp": {"aliases": [], "forwarding_rules": []}
                    },
                    "received": {
                        "bob@corp": [
                            {
                                "message_id": "msg-002",
                                "subject": "Q3 report ready",
                                "from": "reports@corp.com",
                                "to": ["bob@corp"],
                                "auth_results": "spf=pass dkim=pass dmarc=pass",
                                "links": [],
                                "ts": "<NOW_MINUS_24H>",
                            }
                        ]
                    },
                }
            },
        },
        "mass-send": {
            "label": "大规模群发（mass_send_indicator）",
            "inputs": {"mailbox": "marketing@corp", "time_window_days": 1},
            "datasources": {
                "DS-EMAIL": {
                    "mailboxes": {
                        "marketing@corp": {"aliases": [], "forwarding_rules": []}
                    },
                    "received": {
                        "marketing@corp": [
                            {
                                "message_id": "msg-003",
                                "subject": "Newsletter",
                                "from": "sender@bulk.com",
                                "to": [f"user{i}@corp.com" for i in range(15)],
                                "auth_results": "spf=pass",
                                "links": ["https://newsletter.example.com"],
                                "ts": "<NOW_MINUS_1_HOUR>",
                            }
                        ]
                    },
                }
            },
        },
    },
    # E2 — Domain / URL reputation
    "E2": {
        "malicious-url": {
            "label": "恶意 URL（verdict=malicious）",
            "inputs": {"target": "https://c0rp-login.com/login", "kind": "url"},
            "datasources": {
                "DS-TI": {
                    "url_lookups": {
                        "https://c0rp-login.com/login": {
                            "verdict": "malicious",
                            "categories": ["phishing", "credential-harvesting"],
                            "age_days": 3,
                            "tags": ["phishing-kit", "lookalike"],
                            "sources": [{"name": "VirusTotal", "score": 0.95}],
                        }
                    }
                }
            },
        },
        "clean-domain": {
            "label": "干净域名（verdict=clean）",
            "inputs": {"target": "github.com", "kind": "domain"},
            "datasources": {
                "DS-TI": {
                    "domain_lookups": {
                        "github.com": {
                            "verdict": "clean",
                            "categories": ["technology", "development"],
                            "age_days": 7000,
                            "tags": [],
                            "sources": [{"name": "Umbrella", "score": 0.01}],
                        }
                    }
                }
            },
        },
        "unknown-target": {
            "label": "未知目标（TI 无记录 → unknown）",
            "inputs": {"target": "totally-unknown-xyz123.io", "kind": "domain"},
            "datasources": {"DS-TI": {"domain_lookups": {}}},
        },
    },
    # F1 — TP/FP verdict
    "F1": {
        "phishing-evidence-tp": {
            "label": "钓鱼证据（强信号 → TP）",
            "inputs": {
                "evidence_set": [
                    {
                        "payload": {
                            "verdict": "malicious",
                            "target": "https://c0rp-login.com/login",
                        },
                        "confidence": 0.9,
                        "partial": False,
                        "partial_reasons": [],
                    },
                    {
                        "payload": {
                            "phishing_signals": {
                                "auth_failure": True,
                                "urgency_keywords": ["urgent", "wire transfer"],
                                "suspicious_link": True,
                                "lookalike_sender": False,
                            }
                        },
                        "confidence": 0.8,
                        "partial": False,
                        "partial_reasons": [],
                    },
                ]
            },
            "datasources": {},
        },
        "weak-evidence-inc": {
            "label": "弱证据（仅可疑信号 → INC）",
            "inputs": {
                "evidence_set": [
                    {
                        "payload": {
                            "phishing_signals": {
                                "auth_failure": False,
                                "urgency_keywords": [],
                                "suspicious_link": True,
                                "lookalike_sender": False,
                            }
                        },
                        "confidence": 0.4,
                        "partial": True,
                        "partial_reasons": ["DS-TI: not configured"],
                    }
                ]
            },
            "datasources": {},
        },
        "fp-clean-signals": {
            "label": "无威胁信号（→ FP）",
            "inputs": {
                "evidence_set": [
                    {
                        "payload": {
                            "verdict": "clean",
                            "target": "github.com",
                        },
                        "confidence": 0.95,
                        "partial": False,
                        "partial_reasons": [],
                    }
                ]
            },
            "datasources": {},
        },
    },
    # F4 — IOC extraction
    "F4": {
        "phishing-iocs": {
            "label": "钓鱼事件 IOC 提取（URL + IP + hash）",
            "inputs": {
                "evidence_set": [
                    {
                        "payload": {
                            "target": "https://c0rp-login.com/login",
                            "verdict": "malicious",
                            "src_ip": "198.51.100.42",
                            "file_hash": "d41d8cd98f00b204e9800998ecf8427e",
                        }
                    },
                    {
                        "payload": {
                            "sender": "attacker@evil.com",
                            "c2_domain": "c2.evil-domain.net",
                        }
                    },
                ]
            },
            "datasources": {},
        },
        "empty-evidence": {
            "label": "空证据集（无 IOC）",
            "inputs": {"evidence_set": []},
            "datasources": {},
        },
        "mixed-iocs": {
            "label": "混合类型 IOC（去重验证）",
            "inputs": {
                "evidence_set": [
                    {
                        "payload": {
                            "url1": "https://malware.example.com/payload.exe",
                            "url2": "https://malware.example.com/payload.exe",
                            "ip": "10.0.0.1",
                            "sha256": "a" * 64,
                        }
                    }
                ]
            },
            "datasources": {},
        },
    },
    # F8 — Response recommendation
    "F8": {
        "tp-with-user-host": {
            "label": "TP 确认（有受影响用户 + 主机 → 生成处置动作）",
            "inputs": {
                "verdict": {"verdict": "TP", "confidence": 0.92},
                "impact": {"severity": "high", "blast_radius": "single_user"},
                "affected_entities": {
                    "users": ["eve@corp"],
                    "hosts": ["ws-finance-07"],
                },
            },
            "datasources": {},
        },
        "fp-no-action": {
            "label": "FP 确认（无处置动作）",
            "inputs": {
                "verdict": {"verdict": "FP", "confidence": 0.85},
                "impact": {},
                "affected_entities": {"users": [], "hosts": []},
            },
            "datasources": {},
        },
        "tp-user-only": {
            "label": "TP 仅用户受影响（无主机隔离）",
            "inputs": {
                "verdict": {"verdict": "TP", "confidence": 0.78},
                "impact": {"severity": "medium"},
                "affected_entities": {
                    "users": ["compromised@corp"],
                    "hosts": [],
                },
            },
            "datasources": {},
        },
    },
}


def _resolve_timestamps(obj: Any) -> Any:
    """Recursively replace <NOW_*> placeholder strings with actual datetime objects."""
    now = datetime.now(UTC)
    repl: dict[str, Any] = {
        "<NOW>": now,
        "<NOW_PLUS_10_DAYS>": now + timedelta(days=10),
        "<NOW_PLUS_90_DAYS>": now + timedelta(days=90),
        "<NOW_MINUS_1_HOUR>": now - timedelta(hours=1),
        "<NOW_MINUS_24H>": now - timedelta(hours=24),
        "<NOW_MINUS_5_DAYS>": now - timedelta(days=5),
    }
    if isinstance(obj, dict):
        return {k: _resolve_timestamps(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_resolve_timestamps(v) for v in obj]
    if isinstance(obj, str) and obj in repl:
        return repl[obj]
    return obj


def _build_datasources(ds_seeds: dict[str, dict]) -> dict[str, Any]:
    """Turn seed dicts into Mock DataSource instances."""
    mapping: dict[str, Any] = {
        "DS-HR": MockHrDataSource,
        "DS-IDP": MockIdpDataSource,
        "DS-EMAIL": MockEmailDataSource,
        "DS-KB": MockKbDataSource,
        "DS-CMDB": MockCmdbDataSource,
        "DS-TI": MockTiDataSource,
    }
    return {
        ds_id: mapping[ds_id](**seed)
        for ds_id, seed in ds_seeds.items()
        if ds_id in mapping
    }


def _summarize_seeds(ds_seeds: dict) -> dict[str, str]:
    out: dict[str, str] = {}
    for ds_id, seed in ds_seeds.items():
        first = next((v for v in seed.values() if isinstance(v, dict)), None)
        if first is not None:
            n = len(first)
            out[ds_id] = f"{n} item(s)"
        else:
            out[ds_id] = "configured"
    return out


def _stringify_datetimes(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _stringify_datetimes(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_stringify_datetimes(v) for v in obj]
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj


async def _run(payload: dict) -> dict:
    cap_id = payload.get("capability_id")
    if cap_id not in CAPABILITY_REGISTRY:
        return {"ok": False, "error": f"unknown capability_id: {cap_id}"}

    cap_cls = CAPABILITY_REGISTRY[cap_id]
    scenario_id = payload.get("scenario_id")
    scenario = SCENARIOS.get(cap_id, {}).get(scenario_id) if scenario_id else None

    inputs: dict[str, Any] = dict(scenario["inputs"]) if scenario else {}
    ds_seeds: dict[str, Any] = dict(scenario["datasources"]) if scenario else {}

    if payload.get("custom_inputs"):
        inputs.update(payload["custom_inputs"])
    if payload.get("custom_datasources"):
        ds_seeds.update(payload["custom_datasources"])

    ds_seeds_resolved = _resolve_timestamps(ds_seeds)
    inputs_resolved = _resolve_timestamps(inputs)

    ctx = ExecutionContext(datasources=_build_datasources(ds_seeds_resolved))
    cap = cap_cls()
    result = await cap.run(inputs_resolved, ctx)

    return {
        "ok": True,
        "capability_id": cap_id,
        "namespace": cap.namespace,
        "scenario_id": scenario_id,
        "result": json.loads(result.model_dump_json()),
        "input_used": _stringify_datetimes(inputs_resolved),
        "ds_seeds_summary": _summarize_seeds(ds_seeds_resolved),
    }


def _list_scenarios() -> dict[str, list[dict[str, str]]]:
    return {
        cap_id: [
            {"id": scenario_id, "label": scenario["label"]}
            for scenario_id, scenario in scenarios.items()
        ]
        for cap_id, scenarios in SCENARIOS.items()
    }


def _configure_logging_to_stderr() -> None:
    """Redirect structlog output to stderr so stdout stays clean JSON."""
    import structlog
    import logging

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stderr,
        level=logging.INFO,
    )
    structlog.configure(
        logger_factory=structlog.PrintLoggerFactory(file=sys.stderr),
    )


def main() -> int:
    _configure_logging_to_stderr()

    if len(sys.argv) > 1 and sys.argv[1] == "--list":
        json.dump(_list_scenarios(), sys.stdout, ensure_ascii=False)
        return 0

    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        json.dump({"ok": False, "error": f"invalid stdin JSON: {e}"}, sys.stdout)
        return 1

    try:
        out = asyncio.run(_run(payload))
    except Exception as e:
        out = {"ok": False, "error": f"{type(e).__name__}: {e}"}

    json.dump(out, sys.stdout, default=str)
    return 0 if out.get("ok") else 1


if __name__ == "__main__":
    sys.exit(main())
