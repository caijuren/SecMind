import json
import logging
from typing import Any, Dict, List, Optional

from app.ai.providers import llm_provider
from app.services.llm_client import llm_client

logger = logging.getLogger(__name__)


def _build_analysis_prompt(alert_id: int, agent_type: str) -> list[dict]:
    return [
        {
            "role": "system",
            "content": (
                "你是一个安全运营 AI 分析师。请对以下安全告警进行分析。\n"
                "请以 JSON 格式返回，包含以下字段：\n"
                "- conclusion: 分析结论\n"
                "- risk_score: 风险评分 (0-100)\n"
                "- risk_level: 风险等级 (low/medium/high/critical)\n"
                "- attack_chain: 攻击链分析，字符串数组\n"
                "- recommendations: 处置建议，字符串数组\n"
                "- related_events: 相关事件描述，字符串数组\n"
                "- reasoning_chain: 推理链，每个步骤包含 step 和 detail\n"
                "- evidence_summary: 证据摘要"
            ),
        },
        {
            "role": "user",
            "content": f"请分析告警 ID: {alert_id}，分析类型: {agent_type}",
        },
    ]


async def create_analysis(alert_id: int, agent_type: str = "综合分析") -> dict:
    if not llm_provider.is_available:
        logger.warning("LLM 未配置，返回基础分析结果")
        return _fallback_analysis(alert_id, agent_type)

    try:
        messages = _build_analysis_prompt(alert_id, agent_type)
        result = await llm_client.chat_json(messages)
        return {
            "id": alert_id,
            "alert_id": alert_id,
            "agent_type": agent_type,
            "conclusion": result.get("conclusion", "分析完成"),
            "risk_score": result.get("risk_score", 50),
            "risk_level": result.get("risk_level", "medium"),
            "attack_chain": result.get("attack_chain", []),
            "recommendations": result.get("recommendations", []),
            "related_events": result.get("related_events", []),
            "reasoning_chain": result.get("reasoning_chain", []),
            "evidence_summary": result.get("evidence_summary", "分析完成"),
            "source": "llm",
        }
    except Exception as e:
        logger.error("AI 分析调用失败: %s", str(e))
        return _fallback_analysis(alert_id, agent_type)


def _fallback_analysis(alert_id: int, agent_type: str) -> dict:
    return {
        "id": alert_id,
        "alert_id": alert_id,
        "agent_type": agent_type,
        "conclusion": "分析完成（基础模式）",
        "risk_score": 50,
        "risk_level": "medium",
        "attack_chain": [],
        "recommendations": ["建议手动分析该告警"],
        "related_events": [],
        "reasoning_chain": [],
        "evidence_summary": "LLM 未配置，请设置 LLM_API_KEY 以获得完整 AI 分析能力",
        "source": "fallback",
    }


analyses_store: List[dict] = []


def get_analyses(skip: int = 0, limit: int = 20) -> dict:
    page = analyses_store[skip: skip + limit]
    return {"items": page, "total": len(analyses_store), "skip": skip, "limit": limit}


def get_analysis_by_id(analysis_id: int) -> Optional[dict]:
    for a in analyses_store:
        if a["id"] == analysis_id:
            return a
    return None


def get_analysis_by_alert_id(alert_id: int) -> Optional[dict]:
    for a in analyses_store:
        if a["alert_id"] == alert_id:
            return a
    return None