import json
import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.ai_chat import ChatSession, ChatMessage, Report
from app.services.model_router import model_router
from app.ai.providers import llm_provider

logger = logging.getLogger(__name__)


def create_session(db: Session, user_id: int, title: str = "新对话", alert_id: Optional[int] = None) -> ChatSession:
    session = ChatSession(user_id=user_id, title=title, alert_id=alert_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_sessions(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> Dict[str, Any]:
    query = db.query(ChatSession).filter(ChatSession.user_id == user_id)
    total = query.count()
    items = query.order_by(ChatSession.updated_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


def get_session_detail(db: Session, session_id: int) -> Optional[ChatSession]:
    return db.query(ChatSession).filter(ChatSession.id == session_id).first()


def delete_session(db: Session, session_id: int) -> bool:
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        return False
    db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
    db.delete(session)
    db.commit()
    return True


def add_message(db: Session, session_id: int, role: str, content: str, tool_calls: Optional[Any] = None, tool_results: Optional[Any] = None, confidence: Optional[float] = None) -> ChatMessage:
    msg = ChatMessage(session_id=session_id, role=role, content=content, tool_calls=tool_calls, tool_results=tool_results, confidence=confidence)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


AI_TOOLS = [
    {"name": "query_alerts", "description": "查询告警信息", "parameters": {"alert_id": "int", "risk_level": "str", "status": "str"}},
    {"name": "query_devices", "description": "查询设备信息", "parameters": {"device_id": "int", "status": "str"}},
    {"name": "execute_response", "description": "执行处置动作", "parameters": {"action_type": "str", "target": "str"}},
    {"name": "search_threat_intel", "description": "搜索威胁情报", "parameters": {"ioc": "str", "ioc_type": "str"}},
    {"name": "generate_report", "description": "生成分析报告", "parameters": {"report_type": "str", "time_range": "str"}},
]


def _execute_query_alerts(db: Session, params: dict) -> str:
    try:
        from app.services.alert_service import get_alerts
    except ImportError:
        return "告警服务暂不可用，请稍后再试"

    risk_level = params.get("risk_level")
    status = params.get("status")
    alert_id = params.get("alert_id")

    if alert_id:
        from app.services.alert_service import get_alert_by_id
        alert = get_alert_by_id(db, int(alert_id))
        if alert:
            return (
                f"告警详情：\n"
                f"- ID: {alert.id}\n"
                f"- 标题: {alert.title}\n"
                f"- 类型: {alert.type}\n"
                f"- 风险等级: {alert.risk_level}\n"
                f"- 状态: {alert.status}\n"
                f"- 来源IP: {alert.source_ip}\n"
                f"- 描述: {alert.description}\n"
                f"- AI建议: {alert.ai_recommendation or '暂无'}"
            )
        return f"未找到ID为 {alert_id} 的告警"

    result = get_alerts(db, risk_level=risk_level, status=status, limit=10)
    items = result.get("items", [])
    if not items:
        return "未查询到符合条件的告警记录"

    lines = [f"查询到 {result['total']} 条告警，当前显示前 {len(items)} 条："]
    for a in items:
        lines.append(
            f"- [{a.risk_level or '未知'}] {a.title} "
            f"(ID:{a.id}, 状态:{a.status}, 来源:{a.source_ip or 'N/A'})"
        )
    return "\n".join(lines)


def _execute_query_devices(db: Session, params: dict) -> str:
    try:
        from app.models.device import Device
    except ImportError:
        return "设备管理服务暂不可用"

    device_id = params.get("device_id")
    status = params.get("status")

    query = db.query(Device)
    if device_id:
        query = query.filter(Device.id == int(device_id))
    if status:
        query = query.filter(Device.status == status)

    devices = query.limit(20).all()
    if not devices:
        return "未查询到符合条件的设备"

    lines = [f"查询到 {len(devices)} 台设备："]
    for d in devices:
        last_sync = d.last_sync.strftime("%Y-%m-%d %H:%M") if d.last_sync else "未知"
        lines.append(
            f"- {d.name} ({d.type}, IP:{d.ip}) - 状态:{d.status}, "
            f"品牌:{d.brand or 'N/A'}, 最后同步:{last_sync}"
        )
    return "\n".join(lines)


def _execute_search_threat_intel(params: dict) -> str:
    try:
        from app.services.ioc_service import ioc_service
    except ImportError:
        return "威胁情报服务暂不可用"

    ioc = params.get("ioc", "")
    ioc_type = params.get("ioc_type", "auto")

    if not ioc:
        return "请提供需要查询的IOC指标（IP、域名或文件哈希）"

    try:
        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, ioc_service.search_ioc(ioc, ioc_type))
                result = future.result(timeout=15)
        else:
            result = loop.run_until_complete(ioc_service.search_ioc(ioc, ioc_type))
    except RuntimeError:
        result = asyncio.run(ioc_service.search_ioc(ioc, ioc_type))

    if not result:
        return f"未查询到IOC '{ioc}' 的威胁情报信息"

    return (
        f"威胁情报查询结果：\n"
        f"- IOC: {result.get('ioc_value', ioc)}\n"
        f"- 类型: {result.get('ioc_type', ioc_type)}\n"
        f"- 风险等级: {result.get('risk_level', '未知')}\n"
        f"- 风险评分: {result.get('risk_score', 'N/A')}\n"
        f"- 标签: {', '.join(result.get('tags', [])) or '无'}\n"
        f"- 描述: {result.get('description', '无')}\n"
        f"- 首次发现: {result.get('first_seen', '未知')}\n"
        f"- 最近发现: {result.get('last_seen', '未知')}"
    )


def _execute_generate_report(db: Session, session_id: int, params: dict) -> str:
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.id.asc()).all()

    conversation = []
    for m in messages:
        conversation.append(f"[{m.role}]: {m.content}")

    report_lines = [
        "## 安全分析报告",
        "",
        f"**报告类型**: {params.get('report_type', '对话总结')}",
        f"**时间范围**: {params.get('time_range', '全部')}",
        f"**消息数量**: {len(messages)}",
        "",
        "### 对话摘要",
        "",
    ]

    for line in conversation[:20]:
        report_lines.append(f"- {line[:200]}")

    report_lines.extend([
        "",
        "### 关键发现",
        "",
        "基于对话内容的自动分析摘要。",
    ])

    return "\n".join(report_lines)


TOOL_EXECUTORS = {
    "query_alerts": _execute_query_alerts,
    "query_devices": _execute_query_devices,
    "search_threat_intel": _execute_search_threat_intel,
    "generate_report": _execute_generate_report,
}


def _build_chat_system_prompt() -> str:
    tools_desc = "\n".join(
        f"- {t['name']}: {t['description']}" for t in AI_TOOLS
    )
    return (
        "你是 SecMind 安全运营AI助手，专注于网络安全分析和运营支持。\n"
        "你的职责包括：\n"
        "1. 帮助安全分析师研判告警和事件\n"
        "2. 提供威胁情报查询和关联分析\n"
        "3. 协助执行安全处置动作\n"
        "4. 生成安全分析报告\n\n"
        f"你可以使用以下工具：\n{tools_desc}\n\n"
        "当用户的问题需要使用工具时，请以JSON格式返回工具调用指令，格式为：\n"
        '{"tool_calls": [{"name": "工具名称", "arguments": {"参数": "值"}}], "content": "你的文字回复"}\n\n'
        "请用中文回答，保持专业、简洁。如果用户的问题涉及安全操作，"
        "请先评估风险再给出建议。"
    )


def _fallback_response(user_message: str) -> tuple:
    return (
        "抱歉，AI 模型未配置，暂时无法回答你的问题。\n\n"
        "请管理员在环境变量中设置 LLM_API_KEY 以启用 AI 对话功能。\n"
        "支持的 provider: openai, deepseek, qwen, ollama",
        None,
        None,
    )


async def process_ai_response(db: Session, session_id: int, user_message: str) -> ChatMessage:
    history_messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.id.desc()).limit(20).all()

    history_messages = list(reversed(history_messages))

    chat_messages = [{"role": "system", "content": _build_chat_system_prompt()}]
    for h in history_messages:
        chat_messages.append({"role": h.role, "content": h.content})
    chat_messages.append({"role": "user", "content": user_message})

    if not model_router.is_available and not llm_provider.is_available:
        ai_content, tool_call, tool_result = _fallback_response(user_message)
        return add_message(
            db, session_id, "assistant", ai_content,
            tool_calls=tool_call,
            tool_results=tool_result,
        )

    try:
        result = await model_router.route_request_messages(
            task_type="alert_triage",
            messages=chat_messages,
            temperature=0.7,
            max_tokens=2048,
        )

        ai_content = result.get("content", "")
        if not ai_content:
            ai_content = "抱歉，AI 暂时无法处理你的请求，请稍后再试。"
            return add_message(db, session_id, "assistant", ai_content)

        tool_call = None
        tool_result = None

        try:
            parsed = json.loads(ai_content)
            if isinstance(parsed, dict) and "tool_calls" in parsed:
                tool_calls_data = parsed["tool_calls"]
                text_content = parsed.get("content", "")
                if tool_calls_data:
                    tool_call = tool_calls_data
                    results = []
                    for tc in tool_calls_data:
                        tool_name = tc.get("name", "")
                        tool_args = tc.get("arguments", {})
                        executor = TOOL_EXECUTORS.get(tool_name)
                        if executor:
                            if tool_name in ("query_alerts", "query_devices"):
                                exec_result = executor(db, tool_args)
                            elif tool_name == "generate_report":
                                exec_result = executor(db, session_id, tool_args)
                            else:
                                exec_result = executor(tool_args)
                            results.append(exec_result)
                        else:
                            results.append(f"工具 {tool_name} 暂不支持")
                    tool_result = results
                    ai_content = text_content or ai_content
        except (json.JSONDecodeError, ValueError):
            pass

        confidence = 0.90 if result.get("model") else 0.85

        return add_message(
            db, session_id, "assistant", ai_content,
            tool_calls=tool_call,
            tool_results=tool_result,
            confidence=confidence,
        )
    except Exception as e:
        logger.error("LLM 对话调用失败: %s", str(e))
        ai_content = f"抱歉，AI 服务暂时不可用。错误信息: {str(e)}"
        return add_message(db, session_id, "assistant", ai_content)


async def generate_investigation_report(db: Session, session_id: int) -> str:
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.id.asc()).all()

    conversation = []
    for m in messages:
        conversation.append({"role": m.role, "content": m.content})

    analysis_data = {
        "session_id": session_id,
        "message_count": len(messages),
        "conversation": conversation,
    }

    try:
        from app.services.prompt_templates import prompt_templates
        prompt_messages = prompt_templates.report_generation(analysis_data)

        if model_router.is_available:
            result = await model_router.route_request_messages(
                task_type="incident_summary",
                messages=prompt_messages,
                temperature=0.5,
                max_tokens=4096,
            )
            content = result.get("content", "")
            if content:
                return content
    except ImportError:
        logger.warning("prompt_templates not available for report generation")
    except Exception as e:
        logger.error("Report generation via LLM failed: %s", str(e))

    lines = [
        "# 安全事件调查分析报告",
        "",
        f"**会话ID**: {session_id}",
        f"**消息总数**: {len(messages)}",
        "",
        "## 对话记录",
        "",
    ]
    for m in messages:
        role_label = "分析师" if m.role == "user" else "AI助手"
        lines.append(f"### {role_label}")
        lines.append("")
        lines.append(m.content)
        lines.append("")

    lines.extend([
        "## 分析摘要",
        "",
        "基于对话内容，本次会话涉及安全运营相关讨论。",
        "详细分析需要连接AI模型生成。",
    ])

    return "\n".join(lines)


def get_reports(db: Session, report_type: Optional[str] = None, status: Optional[str] = None, skip: int = 0, limit: int = 20) -> Dict[str, Any]:
    query = db.query(Report)
    if report_type:
        query = query.filter(Report.report_type == report_type)
    if status:
        query = query.filter(Report.status == status)
    total = query.count()
    items = query.order_by(Report.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


def get_report_by_id(db: Session, report_id: int) -> Optional[Report]:
    return db.query(Report).filter(Report.id == report_id).first()


def create_report(db: Session, data: dict) -> Report:
    report = Report(**data)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def update_report(db: Session, report_id: int, data: dict) -> Optional[Report]:
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(report, key, value)
    db.commit()
    db.refresh(report)
    return report


def delete_report(db: Session, report_id: int) -> bool:
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        return False
    db.delete(report)
    db.commit()
    return True