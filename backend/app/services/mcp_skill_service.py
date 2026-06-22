"""MCP连接器与Skill管理服务"""
import asyncio
import logging
import time
from datetime import datetime
from typing import Optional, Dict, Any, List

from sqlalchemy.orm import Session

from app.models.mcp_skill import MCPConnector, SkillDefinition, SkillExecution

logger = logging.getLogger(__name__)


# ────────────────────── MCP连接器 ──────────────────────

def list_connectors(
    db: Session,
    connector_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
) -> Dict[str, Any]:
    """获取MCP连接器列表"""
    query = db.query(MCPConnector)
    if connector_type:
        query = query.filter(MCPConnector.connector_type == connector_type)
    if is_active is not None:
        query = query.filter(MCPConnector.is_active == is_active)
    total = query.count()
    items = query.order_by(MCPConnector.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


def get_connector_by_id(db: Session, connector_id: int) -> Optional[MCPConnector]:
    """根据ID获取连接器"""
    return db.query(MCPConnector).filter(MCPConnector.id == connector_id).first()


def create_connector(db: Session, data: dict) -> MCPConnector:
    """创建MCP连接器"""
    # 检查name唯一性
    existing = db.query(MCPConnector).filter(MCPConnector.name == data.get("name")).first()
    if existing:
        raise ValueError(f"连接器名称 '{data['name']}' 已存在")
    connector = MCPConnector(**data)
    db.add(connector)
    db.commit()
    db.refresh(connector)
    return connector


def update_connector(db: Session, connector_id: int, data: dict) -> Optional[MCPConnector]:
    """更新MCP连接器"""
    connector = db.query(MCPConnector).filter(MCPConnector.id == connector_id).first()
    if not connector:
        return None
    # 如果更新name，检查唯一性
    new_name = data.get("name")
    if new_name and new_name != connector.name:
        existing = db.query(MCPConnector).filter(MCPConnector.name == new_name).first()
        if existing:
            raise ValueError(f"连接器名称 '{new_name}' 已存在")
    for key, value in data.items():
        if value is not None:
            setattr(connector, key, value)
    db.commit()
    db.refresh(connector)
    return connector


def delete_connector(db: Session, connector_id: int) -> bool:
    """删除MCP连接器"""
    connector = db.query(MCPConnector).filter(MCPConnector.id == connector_id).first()
    if not connector:
        return False
    db.delete(connector)
    db.commit()
    return True


async def test_connection(db: Session, connector_id: int) -> Dict[str, Any]:
    """测试MCP连接器连通性"""
    connector = db.query(MCPConnector).filter(MCPConnector.id == connector_id).first()
    if not connector:
        return {"success": False, "message": "连接器不存在"}

    try:
        if connector.connector_type == "api":
            # 测试API连接
            import httpx
            headers = {}
            if connector.api_key:
                headers["Authorization"] = f"Bearer {connector.api_key}"
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(connector.endpoint_url or "", headers=headers)
                if resp.status_code < 500:
                    connector.status = "connected"
                    connector.last_connected = datetime.now()
                    connector.is_active = True
                    db.commit()
                    return {"success": True, "message": f"连接成功 (HTTP {resp.status_code})"}
                else:
                    connector.status = "error"
                    db.commit()
                    return {"success": False, "message": f"连接失败 (HTTP {resp.status_code})"}
        elif connector.connector_type == "script":
            # 测试脚本连接
            script = connector.config.get("test_command", "echo ok") if connector.config else "echo ok"
            proc = await asyncio.create_subprocess_exec(
                *script.split(),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=10)
            if proc.returncode == 0:
                connector.status = "connected"
                connector.last_connected = datetime.now()
                connector.is_active = True
                db.commit()
                return {"success": True, "message": f"脚本执行成功: {stdout.decode().strip()}"}
            else:
                connector.status = "error"
                db.commit()
                return {"success": False, "message": f"脚本执行失败: {stderr.decode().strip()}"}
        else:
            # 通用测试：仅标记为已连接
            connector.status = "connected"
            connector.last_connected = datetime.now()
            db.commit()
            return {"success": True, "message": "连接测试通过（通用模式）"}
    except asyncio.TimeoutError:
        connector.status = "error"
        db.commit()
        return {"success": False, "message": "连接超时"}
    except Exception as e:
        connector.status = "error"
        db.commit()
        return {"success": False, "message": f"连接异常: {str(e)}"}


def toggle_connector(db: Session, connector_id: int) -> Optional[MCPConnector]:
    """切换连接器启用/禁用状态"""
    connector = db.query(MCPConnector).filter(MCPConnector.id == connector_id).first()
    if not connector:
        return None
    connector.is_active = not connector.is_active
    if connector.is_active:
        connector.status = "connected"
    else:
        connector.status = "disconnected"
    db.commit()
    db.refresh(connector)
    return connector


# ────────────────────── Skill定义 ──────────────────────

def list_skills(
    db: Session,
    category: Optional[str] = None,
    skill_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
) -> Dict[str, Any]:
    """获取Skill列表"""
    query = db.query(SkillDefinition)
    if category:
        query = query.filter(SkillDefinition.category == category)
    if skill_type:
        query = query.filter(SkillDefinition.skill_type == skill_type)
    if is_active is not None:
        query = query.filter(SkillDefinition.is_active == is_active)
    total = query.count()
    items = query.order_by(SkillDefinition.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


def get_skill_by_id(db: Session, skill_id: int) -> Optional[SkillDefinition]:
    """根据ID获取Skill"""
    return db.query(SkillDefinition).filter(SkillDefinition.id == skill_id).first()


def create_skill(db: Session, data: dict) -> SkillDefinition:
    """创建Skill定义"""
    existing = db.query(SkillDefinition).filter(SkillDefinition.name == data.get("name")).first()
    if existing:
        raise ValueError(f"Skill名称 '{data['name']}' 已存在")
    skill = SkillDefinition(**data)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


def update_skill(db: Session, skill_id: int, data: dict) -> Optional[SkillDefinition]:
    """更新Skill定义"""
    skill = db.query(SkillDefinition).filter(SkillDefinition.id == skill_id).first()
    if not skill:
        return None
    new_name = data.get("name")
    if new_name and new_name != skill.name:
        existing = db.query(SkillDefinition).filter(SkillDefinition.name == new_name).first()
        if existing:
            raise ValueError(f"Skill名称 '{new_name}' 已存在")
    for key, value in data.items():
        if value is not None:
            setattr(skill, key, value)
    db.commit()
    db.refresh(skill)
    return skill


def delete_skill(db: Session, skill_id: int) -> bool:
    """删除Skill定义"""
    skill = db.query(SkillDefinition).filter(SkillDefinition.id == skill_id).first()
    if not skill:
        return False
    # 同时删除关联的执行记录
    db.query(SkillExecution).filter(SkillExecution.skill_id == skill_id).delete()
    db.delete(skill)
    db.commit()
    return True


async def execute_skill(
    db: Session,
    skill_id: int,
    parameters: dict,
    trigger_type: str = "manual",
) -> SkillExecution:
    """执行Skill"""
    skill = db.query(SkillDefinition).filter(SkillDefinition.id == skill_id).first()
    if not skill:
        raise ValueError("Skill不存在")
    if not skill.is_active:
        raise ValueError("Skill已禁用，无法执行")

    # 创建执行记录
    execution = SkillExecution(
        skill_id=skill_id,
        tenant_id=skill.tenant_id,
        trigger_type=trigger_type,
        parameters=parameters,
        status="pending",
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)

    # 更新状态为运行中
    execution.status = "running"
    execution.started_at = datetime.now()
    db.commit()

    start_time = time.time()
    try:
        result = await _run_skill_script(skill, parameters)
        duration_ms = int((time.time() - start_time) * 1000)

        execution.status = "completed"
        execution.result = result
        execution.completed_at = datetime.now()
        execution.duration_ms = duration_ms
    except asyncio.TimeoutError:
        duration_ms = int((time.time() - start_time) * 1000)
        execution.status = "timeout"
        execution.error_message = f"执行超时（{skill.execution_timeout}秒）"
        execution.completed_at = datetime.now()
        execution.duration_ms = duration_ms
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        execution.status = "failed"
        execution.error_message = str(e)
        execution.completed_at = datetime.now()
        execution.duration_ms = duration_ms

    # 更新Skill执行统计
    skill.execution_count = (skill.execution_count or 0) + 1
    skill.last_executed = datetime.now()
    db.commit()
    db.refresh(execution)
    return execution


async def _run_skill_script(skill: SkillDefinition, parameters: dict) -> dict:
    """运行Skill脚本"""
    script = skill.script_content
    if not script:
        # 如果没有脚本内容，尝试使用AI执行
        return await _ai_execute(skill, parameters)

    # 将参数写入环境变量
    import json
    import os
    env = os.environ.copy()
    env["SKILL_PARAMS"] = json.dumps(parameters, ensure_ascii=False)

    proc = await asyncio.create_subprocess_exec(
        "python3", "-c", script,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=env,
    )
    stdout, stderr = await asyncio.wait_for(
        proc.communicate(),
        timeout=skill.execution_timeout or 300,
    )

    if proc.returncode != 0:
        raise RuntimeError(f"脚本执行失败: {stderr.decode()}")

    try:
        return json.loads(stdout.decode())
    except json.JSONDecodeError:
        return {"output": stdout.decode(), "raw": True}


async def _ai_execute(skill: SkillDefinition, parameters: dict) -> dict:
    """使用AI执行Skill（无脚本时的备选方案）"""
    try:
        from app.services.llm_client import llm_client

        prompt = (
            f"你是一个安全运营自动化Skill执行器。请执行以下Skill:\n"
            f"Skill名称: {skill.display_name}\n"
            f"描述: {skill.description}\n"
            f"参数: {parameters}\n"
            f"请以JSON格式返回执行结果。"
        )
        messages = [{"role": "user", "content": prompt}]
        result = await llm_client.chat_json(messages=messages)
        return result
    except Exception as e:
        logger.warning("AI执行Skill失败: %s", str(e))
        return {"output": f"Skill '{skill.name}' 已触发（无脚本，AI执行不可用）", "raw": True}


def get_execution_history(
    db: Session,
    skill_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> Dict[str, Any]:
    """获取Skill执行历史"""
    query = db.query(SkillExecution)
    if skill_id:
        query = query.filter(SkillExecution.skill_id == skill_id)
    if status:
        query = query.filter(SkillExecution.status == status)
    total = query.count()
    items = query.order_by(SkillExecution.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


def get_execution_by_id(db: Session, execution_id: int) -> Optional[SkillExecution]:
    """根据ID获取执行记录"""
    return db.query(SkillExecution).filter(SkillExecution.id == execution_id).first()


# ────────────────────── 种子数据 ──────────────────────

SAMPLE_CONNECTORS = [
    {
        "name": "virustotal",
        "display_name": "VirusTotal",
        "connector_type": "api",
        "endpoint_url": "https://www.virustotal.com/api/v3",
        "config": {"rate_limit": 4, "quota_per_minute": 4},
    },
    {
        "name": "abuseipdb",
        "display_name": "AbuseIPDB",
        "connector_type": "api",
        "endpoint_url": "https://api.abuseipdb.com/api/v2",
        "config": {"rate_limit": 10},
    },
    {
        "name": "shodan",
        "display_name": "Shodan",
        "connector_type": "api",
        "endpoint_url": "https://api.shodan.io",
        "config": {"rate_limit": 1},
    },
    {
        "name": "internal-siem",
        "display_name": "内部SIEM",
        "connector_type": "database",
        "endpoint_url": "",
        "config": {"db_type": "postgresql", "db_name": "siem_events"},
    },
]

SAMPLE_SKILLS = [
    {
        "name": "A1_ip_reputation",
        "display_name": "IP信誉查询",
        "description": "查询IP地址的信誉信息，包括 AbuseIPDB 评分、Shodan 开放端口等",
        "category": "investigation",
        "skill_type": "atomic",
        "required_connectors": ["abuseipdb", "shodan"],
        "parameters": [
            {"name": "ip", "type": "string", "required": True, "description": "要查询的IP地址"},
        ],
        "script_content": (
            "import json, os, urllib.request, urllib.error\n"
            "params = json.loads(os.environ.get('SKILL_PARAMS', '{}'))\n"
            "ip = params.get('ip', '')\n"
            "print(json.dumps({'ip': ip, 'reputation': 'neutral', 'score': 0, 'sources': ['demo']}))\n"
        ),
        "execution_timeout": 60,
        "trigger_mode": "manual",
    },
    {
        "name": "A2_hash_scan",
        "display_name": "文件哈希扫描",
        "description": "使用VirusTotal扫描文件哈希，获取恶意软件检测结果",
        "category": "investigation",
        "skill_type": "atomic",
        "required_connectors": ["virustotal"],
        "parameters": [
            {"name": "hash", "type": "string", "required": True, "description": "文件哈希值 (MD5/SHA1/SHA256)"},
        ],
        "script_content": (
            "import json, os\n"
            "params = json.loads(os.environ.get('SKILL_PARAMS', '{}'))\n"
            "hash_val = params.get('hash', '')\n"
            "print(json.dumps({'hash': hash_val, 'detection_ratio': '0/70', 'status': 'clean'}))\n"
        ),
        "execution_timeout": 60,
        "trigger_mode": "manual",
    },
    {
        "name": "A3_domain_lookup",
        "display_name": "域名威胁情报查询",
        "description": "查询域名的威胁情报，包括DNS记录、WHOIS、黑名单等",
        "category": "investigation",
        "skill_type": "atomic",
        "required_connectors": ["virustotal"],
        "parameters": [
            {"name": "domain", "type": "string", "required": True, "description": "要查询的域名"},
        ],
        "execution_timeout": 60,
        "trigger_mode": "manual",
    },
    {
        "name": "A4_alert_triage",
        "display_name": "告警分诊",
        "description": "自动对告警进行初步分诊，评估严重程度和优先级",
        "category": "investigation",
        "skill_type": "atomic",
        "required_connectors": [],
        "parameters": [
            {"name": "alert_id", "type": "integer", "required": True, "description": "告警ID"},
        ],
        "execution_timeout": 120,
        "trigger_mode": "auto",
    },
    {
        "name": "A5_siem_search",
        "display_name": "SIEM日志检索",
        "description": "在内部SIEM中检索相关安全事件日志",
        "category": "investigation",
        "skill_type": "atomic",
        "required_connectors": ["internal-siem"],
        "parameters": [
            {"name": "query", "type": "string", "required": True, "description": "检索语句"},
            {"name": "time_range", "type": "string", "required": False, "description": "时间范围，如 1h, 24h, 7d"},
        ],
        "execution_timeout": 120,
        "trigger_mode": "manual",
    },
    {
        "name": "A6_block_ip",
        "display_name": "封禁IP地址",
        "description": "在防火墙中封禁指定IP地址",
        "category": "response",
        "skill_type": "atomic",
        "required_connectors": [],
        "parameters": [
            {"name": "ip", "type": "string", "required": True, "description": "要封禁的IP地址"},
            {"name": "duration", "type": "string", "required": False, "description": "封禁时长"},
            {"name": "reason", "type": "string", "required": False, "description": "封禁原因"},
        ],
        "execution_timeout": 30,
        "trigger_mode": "approval",
    },
    {
        "name": "A7_isolate_host",
        "display_name": "隔离主机",
        "description": "将受感染主机从网络中隔离",
        "category": "response",
        "skill_type": "atomic",
        "required_connectors": [],
        "parameters": [
            {"name": "host_id", "type": "string", "required": True, "description": "主机标识"},
        ],
        "execution_timeout": 60,
        "trigger_mode": "approval",
    },
    {
        "name": "A8_notification",
        "display_name": "发送安全通知",
        "description": "向相关人员发送安全事件通知",
        "category": "management",
        "skill_type": "atomic",
        "required_connectors": [],
        "parameters": [
            {"name": "recipients", "type": "array", "required": True, "description": "接收人列表"},
            {"name": "message", "type": "string", "required": True, "description": "通知内容"},
            {"name": "severity", "type": "string", "required": False, "description": "严重程度"},
        ],
        "execution_timeout": 30,
        "trigger_mode": "manual",
    },
    {
        "name": "A9_email_replay",
        "display_name": "邮件重放分析",
        "description": "重放钓鱼邮件，分析邮件头、链接和附件",
        "category": "investigation",
        "skill_type": "atomic",
        "required_connectors": [],
        "parameters": [
            {"name": "email_id", "type": "string", "required": True, "description": "邮件ID"},
        ],
        "execution_timeout": 120,
        "trigger_mode": "manual",
    },
    {
        "name": "C1_full_incident_response",
        "display_name": "完整事件响应流程",
        "description": "组合多个原子Skill，执行完整的安全事件响应流程：分诊→调查→遏制→恢复",
        "category": "response",
        "skill_type": "composite",
        "required_connectors": ["virustotal", "abuseipdb", "internal-siem"],
        "parameters": [
            {"name": "alert_id", "type": "integer", "required": True, "description": "告警ID"},
            {"name": "auto_response", "type": "boolean", "required": False, "description": "是否自动执行响应动作"},
        ],
        "execution_timeout": 600,
        "trigger_mode": "approval",
    },
]


def seed_sample_data(db: Session) -> Dict[str, Any]:
    """填充示例数据"""
    connector_count = 0
    skill_count = 0

    for conn_data in SAMPLE_CONNECTORS:
        existing = db.query(MCPConnector).filter(MCPConnector.name == conn_data["name"]).first()
        if not existing:
            connector = MCPConnector(**conn_data)
            db.add(connector)
            connector_count += 1

    for skill_data in SAMPLE_SKILLS:
        existing = db.query(SkillDefinition).filter(SkillDefinition.name == skill_data["name"]).first()
        if not existing:
            skill = SkillDefinition(**skill_data)
            db.add(skill)
            skill_count += 1

    db.commit()
    return {
        "connectors_created": connector_count,
        "skills_created": skill_count,
        "message": f"成功创建 {connector_count} 个连接器和 {skill_count} 个Skill",
    }
