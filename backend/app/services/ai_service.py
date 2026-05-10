from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from app.mock.data import mock_analyses


def create_analysis(alert_id: int, agent_type: str = "综合分析") -> Dict[str, Any]:
    analysis = {
        "id": max((a["id"] for a in mock_analyses), default=0) + 1,
        "alert_id": alert_id,
        "conclusion": f"AI分析完成：告警#{alert_id}经{agent_type}引擎深度分析，确认为安全威胁事件",
        "risk_score": 75.0,
        "risk_level": "高",
        "attack_chain": [
            {"step": 1, "action": "初始访问", "detail": "攻击者通过外部网络发起攻击"},
            {"step": 2, "action": "执行攻击", "detail": "利用漏洞或凭证进行攻击"},
            {"step": 3, "action": "目标达成", "detail": "攻击者达成攻击目标"},
        ],
        "recommendations": [
            "立即隔离受影响系统",
            "检查相关日志确认攻击范围",
            "更新安全策略防止类似攻击",
        ],
        "related_events": [
            {"id": alert_id * 100 + 1, "type": "关联事件", "timestamp": datetime.now().isoformat()},
        ],
        "reasoning_chain": [
            {
                "phase": "event_discovery",
                "title": "异常事件检测",
                "description": f"AI引擎检测到告警#{alert_id}关联的异常安全事件，触发自动分析流程",
                "evidence": [
                    {"source": "安全传感器", "timestamp": datetime.now().isoformat(), "detail": "检测到异常行为模式，偏离历史基线", "direction": "supports"},
                ],
                "conclusion": "检测到需要深入分析的安全异常事件",
            },
            {
                "phase": "evidence_correlation",
                "title": "多源证据关联",
                "description": "将告警与多数据源日志进行时序关联和因果关系分析",
                "evidence": [
                    {"source": "VPN网关", "timestamp": datetime.now().isoformat(), "detail": "关联到异常VPN登录行为", "direction": "supports"},
                    {"source": "EDR传感器", "timestamp": datetime.now().isoformat(), "detail": "终端检测到可疑进程执行", "direction": "supports"},
                    {"source": "AD域控", "timestamp": datetime.now().isoformat(), "detail": "账号认证模式异常", "direction": "supports"},
                ],
                "conclusion": "多源证据形成完整攻击链，支持安全威胁判断",
            },
            {
                "phase": "pattern_matching",
                "title": "攻击模式匹配",
                "description": "将关联证据与已知攻击模式库进行匹配，映射MITRE ATT&CK框架",
                "evidence": [
                    {"source": "威胁情报库", "timestamp": datetime.now().isoformat(), "detail": "匹配已知APT攻击模式，置信度0.82", "direction": "supports"},
                    {"source": "MITRE ATT&CK", "timestamp": datetime.now().isoformat(), "detail": "映射攻击链：T1078→T1059→T1071", "direction": "supports"},
                ],
                "mitre_ref": "T1078 → T1059 → T1071",
                "conclusion": "匹配已知攻击模式，攻击链路完整",
            },
            {
                "phase": "confidence_assessment",
                "title": "置信度评估",
                "description": "综合各证据权重、时效性、来源可靠性进行贝叶斯推理",
                "evidence": [
                    {"source": "推理引擎", "timestamp": datetime.now().isoformat(), "detail": "支持证据累计权重0.85，反对证据权重0.10", "direction": "supports"},
                ],
                "confidence_delta": 75.0,
                "conclusion": "加权置信度75%，经贝叶斯修正后确认为高风险安全威胁",
            },
            {
                "phase": "disposal_decision",
                "title": "处置决策",
                "description": "基于置信度评估结果，选择最优处置策略",
                "evidence": [
                    {"source": "处置策略库", "timestamp": datetime.now().isoformat(), "detail": "置信度≥70%触发自动处置策略", "direction": "supports"},
                ],
                "conclusion": "置信度75%触发自动处置，建议立即隔离受影响系统并检查攻击范围",
            },
        ],
        "evidence_summary": {"supporting": 7, "contradicting": 0, "neutral": 1},
        "user_context": None,
        "timestamp": datetime.now(),
        "agent_type": agent_type,
    }
    mock_analyses.append(analysis)
    return analysis


def get_analyses(skip: int = 0, limit: int = 20) -> Dict[str, Any]:
    total = len(mock_analyses)
    items = mock_analyses[skip : skip + limit]
    return {"total": total, "items": items}


def get_analysis_by_id(analysis_id: int) -> Optional[Dict[str, Any]]:
    for analysis in mock_analyses:
        if analysis["id"] == analysis_id:
            return analysis
    return None


def get_analysis_by_alert_id(alert_id: int) -> Optional[Dict[str, Any]]:
    for analysis in mock_analyses:
        if analysis["alert_id"] == alert_id:
            return analysis
    return None
