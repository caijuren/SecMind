import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.ai_model import AIModel, ModelRouting, ModelCallLog
from app.services.llm_client import llm_client

logger = logging.getLogger(__name__)

SEED_MODELS = [
    {
        "name": "gpt-4o",
        "provider": "openai",
        "model_id": "gpt-4o",
        "description": "OpenAI GPT-4o 多模态模型，适合复杂推理和分析",
        "capabilities": ["reasoning", "analysis", "code", "multimodal"],
        "max_tokens": 128000,
        "cost_per_1k_input": 0.005,
        "cost_per_1k_output": 0.015,
        "latency_ms": 1200,
        "accuracy_score": 0.95,
        "priority": 1,
    },
    {
        "name": "claude-3.5-sonnet",
        "provider": "anthropic",
        "model_id": "claude-3-5-sonnet-20241022",
        "description": "Anthropic Claude 3.5 Sonnet，平衡性能与成本",
        "capabilities": ["reasoning", "analysis", "code", "long_context"],
        "max_tokens": 200000,
        "cost_per_1k_input": 0.003,
        "cost_per_1k_output": 0.015,
        "latency_ms": 900,
        "accuracy_score": 0.93,
        "priority": 2,
    },
    {
        "name": "qwen-max",
        "provider": "alibaba",
        "model_id": "qwen-max",
        "description": "通义千问Max，中文安全分析优化",
        "capabilities": ["reasoning", "analysis", "chinese_optimized"],
        "max_tokens": 32000,
        "cost_per_1k_input": 0.002,
        "cost_per_1k_output": 0.006,
        "latency_ms": 600,
        "accuracy_score": 0.90,
        "priority": 3,
    },
    {
        "name": "deepseek-v3",
        "provider": "deepseek",
        "model_id": "deepseek-chat",
        "description": "DeepSeek V3，高性价比推理模型",
        "capabilities": ["reasoning", "code", "analysis"],
        "max_tokens": 64000,
        "cost_per_1k_input": 0.001,
        "cost_per_1k_output": 0.002,
        "latency_ms": 500,
        "accuracy_score": 0.88,
        "priority": 4,
    },
    {
        "name": "glm-4",
        "provider": "zhipu",
        "model_id": "glm-4",
        "description": "智谱GLM-4，国产通用大模型",
        "capabilities": ["reasoning", "analysis", "chinese_optimized"],
        "max_tokens": 128000,
        "cost_per_1k_input": 0.0015,
        "cost_per_1k_output": 0.005,
        "latency_ms": 700,
        "accuracy_score": 0.87,
        "priority": 5,
    },
]

SEED_ROUTINGS = [
    {"task_type": "threat_analysis", "model_id": 1, "routing_strategy": "accuracy", "fallback_model_id": 2},
    {"task_type": "alert_triage", "model_id": 2, "routing_strategy": "balanced", "fallback_model_id": 3},
    {"task_type": "report_generation", "model_id": 3, "routing_strategy": "cost", "fallback_model_id": 4},
    {"task_type": "code_analysis", "model_id": 1, "routing_strategy": "accuracy", "fallback_model_id": 2},
    {"task_type": "incident_response", "model_id": 2, "routing_strategy": "latency", "fallback_model_id": 4},
    {"task_type": "threat_hunting", "model_id": 1, "routing_strategy": "accuracy", "fallback_model_id": 2},
    {"task_type": "general_chat", "model_id": 4, "routing_strategy": "cost", "fallback_model_id": 5},
]


def _build_task_prompt(task_type: str, input_text: str) -> list[dict]:
    task_descriptions = {
        "threat_analysis": "威胁分析",
        "alert_triage": "告警研判",
        "report_generation": "报告生成",
        "code_analysis": "代码安全分析",
        "incident_response": "事件响应",
        "threat_hunting": "威胁狩猎",
        "general_chat": "通用对话",
    }
    task_desc = task_descriptions.get(task_type, task_type)
    return [
        {
            "role": "system",
            "content": (
                f"你是一位专业的安全分析师，当前任务类型：{task_desc}。\n"
                "请根据用户输入，提供专业、准确的安全分析结果。\n"
                "用中文回答，保持简洁专业。"
            ),
        },
        {"role": "user", "content": input_text},
    ]


def seed_ai_models(db: Session) -> int:
    count = 0
    for model_data in SEED_MODELS:
        existing = db.query(AIModel).filter(AIModel.name == model_data["name"]).first()
        if not existing:
            model = AIModel(**model_data)
            db.add(model)
            count += 1
    db.flush()

    for routing_data in SEED_ROUTINGS:
        existing = db.query(ModelRouting).filter(ModelRouting.task_type == routing_data["task_type"]).first()
        if not existing:
            routing = ModelRouting(**routing_data)
            db.add(routing)
            count += 1
    db.commit()
    return count


def get_models(db: Session, active_only: bool = False) -> List[AIModel]:
    query = db.query(AIModel)
    if active_only:
        query = query.filter(AIModel.is_active == True)
    return query.order_by(AIModel.priority).all()


def get_model(db: Session, model_id: int) -> Optional[AIModel]:
    return db.query(AIModel).filter(AIModel.id == model_id).first()


def create_model(db: Session, data: dict) -> AIModel:
    model = AIModel(**data)
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


def update_model(db: Session, model_id: int, data: dict) -> Optional[AIModel]:
    model = db.query(AIModel).filter(AIModel.id == model_id).first()
    if not model:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(model, key, value)
    db.commit()
    db.refresh(model)
    return model


def get_routings(db: Session) -> List[ModelRouting]:
    return db.query(ModelRouting).all()


def get_routing(db: Session, task_type: str) -> Optional[ModelRouting]:
    return db.query(ModelRouting).filter(ModelRouting.task_type == task_type).first()


def create_routing(db: Session, data: dict) -> ModelRouting:
    routing = ModelRouting(**data)
    db.add(routing)
    db.commit()
    db.refresh(routing)
    return routing


def route_request(db: Session, task_type: str, input_text: str, max_tokens: Optional[int] = None) -> Dict[str, Any]:
    if not llm_client.is_available:
        return {
            "error": "LLM 未配置，无法进行 AI 分析。请设置 LLM_API_KEY 环境变量。",
            "model_id": None,
            "model_name": None,
            "provider": None,
            "output": "LLM 未配置，请管理员在环境变量中设置 LLM_API_KEY 以启用 AI 分析功能。",
            "input_tokens": 0,
            "output_tokens": 0,
            "latency_ms": 0,
            "cost": 0.0,
            "routing_strategy": "none",
            "fallback_used": False,
        }

    try:
        routing = db.query(ModelRouting).filter(ModelRouting.task_type == task_type).first()
        fallback_used = False
        model = None
        strategy = "priority"

        if routing:
            model = db.query(AIModel).filter(AIModel.id == routing.model_id, AIModel.is_active == True).first()
            if not model and routing.fallback_model_id:
                model = db.query(AIModel).filter(AIModel.id == routing.fallback_model_id, AIModel.is_active == True).first()
                fallback_used = True
            strategy = routing.routing_strategy
        else:
            model = db.query(AIModel).filter(AIModel.is_active == True).order_by(AIModel.priority).first()

        if not model:
            return {
                "error": "没有可用的 AI 模型配置",
                "model_id": None,
                "model_name": None,
                "provider": None,
                "output": "请先在系统中配置 AI 模型。",
                "input_tokens": 0,
                "output_tokens": 0,
                "latency_ms": 0,
                "cost": 0.0,
                "routing_strategy": strategy,
                "fallback_used": False,
            }

        messages = _build_task_prompt(task_type, input_text)
        import time
        start_time = time.time()
        output = llm_client.chat_sync(messages, temperature=0.5, max_tokens=max_tokens)
        elapsed_ms = int((time.time() - start_time) * 1000)

        input_tokens = len(input_text) // 4
        output_tokens = len(output) // 4
        cost = (input_tokens / 1000 * model.cost_per_1k_input) + (output_tokens / 1000 * model.cost_per_1k_output)

        log = ModelCallLog(
            model_id=model.id,
            task_type=task_type,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=elapsed_ms,
            cost=cost,
            status="success",
        )
        db.add(log)
        db.commit()

        return {
            "model_id": model.id,
            "model_name": model.name,
            "provider": model.provider,
            "output": output,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "latency_ms": elapsed_ms,
            "cost": round(cost, 6),
            "routing_strategy": strategy,
            "fallback_used": fallback_used,
        }
    except Exception as e:
        logger.error("LLM 路由调用失败: %s", str(e))
        return {
            "error": f"AI 分析调用失败: {str(e)}",
            "model_id": None,
            "model_name": None,
            "provider": None,
            "output": f"AI 服务暂时不可用，请稍后重试。错误: {str(e)}",
            "input_tokens": 0,
            "output_tokens": 0,
            "latency_ms": 0,
            "cost": 0.0,
            "routing_strategy": "none",
            "fallback_used": False,
        }


def get_model_stats(db: Session) -> Dict[str, Any]:
    total_calls = db.query(func.count(ModelCallLog.id)).scalar() or 0
    success_calls = db.query(func.count(ModelCallLog.id)).filter(ModelCallLog.status == "success").scalar() or 0
    avg_latency = db.query(func.avg(ModelCallLog.latency_ms)).scalar() or 0
    total_cost = db.query(func.sum(ModelCallLog.cost)).scalar() or 0

    calls_by_model = {}
    model_calls = db.query(ModelCallLog.model_id, func.count(ModelCallLog.id)).group_by(ModelCallLog.model_id).all()
    models = {m.id: m.name for m in db.query(AIModel).all()}
    for mid, cnt in model_calls:
        calls_by_model[models.get(mid, str(mid))] = cnt

    calls_by_task = {}
    task_calls = db.query(ModelCallLog.task_type, func.count(ModelCallLog.id)).group_by(ModelCallLog.task_type).all()
    for tt, cnt in task_calls:
        calls_by_task[tt] = cnt

    return {
        "total_calls": total_calls,
        "success_rate": round(success_calls / total_calls, 4) if total_calls > 0 else 0,
        "avg_latency_ms": round(float(avg_latency), 1),
        "total_cost": round(float(total_cost), 4),
        "calls_by_model": calls_by_model,
        "calls_by_task": calls_by_task,
    }


def get_call_logs(db: Session, model_id: Optional[int] = None, limit: int = 50) -> List[ModelCallLog]:
    query = db.query(ModelCallLog)
    if model_id:
        query = query.filter(ModelCallLog.model_id == model_id)
    return query.order_by(ModelCallLog.id.desc()).limit(limit).all()