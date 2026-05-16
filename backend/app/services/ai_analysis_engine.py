"""
AI Security Analysis API - 独立模块
提供安全事件分析、AI推理流、证据链等核心功能
"""

import json
import logging
from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field

from app.services.llm_client import llm_client

logger = logging.getLogger(__name__)


# ==================== 数据模型 ====================

class EvidenceDetail(BaseModel):
    label: str
    value: Optional[str] = None

class EvidenceItem(BaseModel):
    id: str
    type: str
    icon: str
    content: str
    details: Optional[List[EvidenceDetail]] = None
    riskLevel: str
    source: str

class CorrelationLink(BaseModel):
    model_config = {"populate_by_name": True}
    from_field: str = Field(..., alias="from")
    to: str
    description: str

class AIConclusion(BaseModel):
    event: str
    confidence: int
    attackPhase: str
    recommendations: List[str]
    riskScore: int

class AIThinkingStep(BaseModel):
    id: str
    timestamp: str
    agent: str
    agentIcon: str
    agentColor: str
    status: str
    message: str
    result: Optional[List[str]] = None
    isTyping: Optional[bool] = None

class SecurityEvent(BaseModel):
    id: str
    eventId: str
    title: str
    source: str
    sourceIcon: str
    sourceColor: str
    severity: str
    category: str
    description: str
    steps: List[AIThinkingStep]
    evidenceList: List[EvidenceItem] = []
    correlationLinks: List[CorrelationLink] = []
    conclusion: AIConclusion

class AIAnalysisResponse(BaseModel):
    events: List[SecurityEvent]
    total: int
    hasMore: bool
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

class AnalysisStatus(BaseModel):
    isAnalyzing: bool
    currentEventIndex: int
    totalEvents: int
    currentStep: int
    totalSteps: int


# ==================== AI Agent 分析逻辑 ====================

class AIAnalysisEngine:
    """
    AI安全分析引擎

    支持多Agent协作分析流程，当LLM可用时使用真实LLM推理，
    否则返回基础分析结果（不含模拟数据）
    """

    AGENTS = {
        "soc": {
            "name": "SOC Agent",
            "icon": "Radio",
            "color": "#3b82f6",
            "role": "接收和初步分类告警"
        },
        "identity": {
            "name": "Identity Agent",
            "icon": "User",
            "color": "#8b5cf6",
            "role": "分析用户身份和权限"
        },
        "threat": {
            "name": "Threat Intel Agent",
            "icon": "Target",
            "color": "#ef4444",
            "role": "查询威胁情报库"
        },
        "ueba": {
            "name": "UEBA Agent",
            "icon": "Activity",
            "color": "#22c55e",
            "role": "行为基线分析"
        },
        "forensics": {
            "name": "Forensics Agent",
            "icon": "Layers",
            "color": "#a78bfa",
            "role": "取证和回溯分析"
        },
        "reasoning": {
            "name": "Reasoning Agent",
            "icon": "Brain",
            "color": "#a78bfa",
            "role": "综合推理和风险评估"
        },
        "mail": {
            "name": "Email Agent",
            "icon": "Mail",
            "color": "#f97316",
            "role": "邮件内容深度分析"
        },
        "ad": {
            "name": "AD Agent",
            "icon": "KeyRound",
            "color": "#8b5cf6",
            "role": "AD域控日志分析"
        },
        "edr": {
            "name": "EDR Agent",
            "icon": "ShieldAlert",
            "color": "#ef4444",
            "role": "终端检测与响应分析"
        },
        "network": {
            "name": "Network Agent",
            "icon": "Wifi",
            "color": "#3b82f6",
            "role": "网络流量和连接分析"
        },
        "conclusion": {
            "name": "Conclusion Agent",
            "icon": "CheckCircle2",
            "color": "#22c55e",
            "role": "生成最终结论和建议"
        }
    }

    @classmethod
    def generate_timestamp(cls) -> str:
        return datetime.now().strftime("%H:%M:%S")

    @classmethod
    def create_step(cls, agent_key: str, status: str, message: str,
                    result: List[str] = None, isTyping: bool = False) -> AIThinkingStep:
        agent = cls.AGENTS[agent_key]
        return AIThinkingStep(
            id=f"{agent_key}-{datetime.now().strftime('%H%M%S%f')}",
            timestamp=cls.generate_timestamp(),
            agent=agent["name"],
            agentIcon=agent["icon"],
            agentColor=agent["color"],
            status=status,
            message=message,
            result=result,
            isTyping=isTyping
        )

    @classmethod
    def _build_analysis_prompt(cls, alert: dict) -> list[dict]:
        return [
            {
                "role": "system",
                "content": (
                    "你是一位资深安全运营分析师（SOC Analyst），负责对安全告警进行多维度分析。\n\n"
                    "请以 JSON 格式返回分析结果，包含以下字段：\n"
                    "1. steps: 多Agent分析步骤列表，每步包含:\n"
                    "   - agent: 分析Agent名称（SOC Agent / Identity Agent / Threat Intel Agent / UEBA Agent / Forensics Agent / Reasoning Agent / Email Agent / AD Agent / EDR Agent / Network Agent / Conclusion Agent）\n"
                    "   - message: 该步骤的分析描述\n"
                    "   - result: 分析发现列表（字符串数组）\n"
                    "2. conclusion: 最终结论，包含:\n"
                    "   - event: 事件描述\n"
                    "   - confidence: 置信度（0-100）\n"
                    "   - attackPhase: 攻击阶段描述\n"
                    "   - recommendations: 处置建议列表\n"
                    "   - riskScore: 风险评分（0-100）\n"
                    "3. category: 事件类别（phishing/vpn_anomaly/malware/brute_force等）\n"
                    "4. category_name: 类别中文名称\n"
                    "5. classification_confidence: 分类置信度（0-100）\n"
                    "6. key_indicators: 关键分类指标列表\n\n"
                    "只返回JSON，不要包含其他内容。分析要专业、详细，使用中文。"
                )
            },
            {
                "role": "user",
                "content": (
                    f"请分析以下安全告警：\n"
                    f"标题: {alert.get('title', '未知告警')}\n"
                    f"类型: {alert.get('type', '未知')}\n"
                    f"严重程度: {alert.get('severity', 'medium')}\n"
                    f"描述: {alert.get('description', '无')}\n"
                    f"来源: {alert.get('source', '未知')}\n"
                    f"源IP: {alert.get('source_ip', 'N/A')}\n"
                    f"用户: {alert.get('username', 'N/A')}"
                )
            }
        ]

    @classmethod
    async def _llm_analyze_alert(cls, alert: dict) -> Optional[dict]:
        if not llm_client.is_available:
            logger.info("LLM 未配置，将使用基础分析模式")
            return None

        try:
            messages = cls._build_analysis_prompt(alert)
            result = await llm_client.chat_json(messages, temperature=0.3)

            steps_data = result.get("steps", [])
            conclusion_data = result.get("conclusion", {})

            if not steps_data or not conclusion_data:
                logger.warning("LLM 返回的分析结果不完整")
                return None

            return {
                "steps": steps_data,
                "conclusion": conclusion_data,
                "category": result.get("category", ""),
                "category_name": result.get("category_name", ""),
                "classification_confidence": result.get("classification_confidence", 0),
                "key_indicators": result.get("key_indicators", []),
            }
        except Exception as e:
            logger.error("LLM 分析调用失败: %s", str(e))
            return None

    @classmethod
    def _convert_llm_steps(cls, llm_result: dict, alert: dict) -> List[AIThinkingStep]:
        agent_key_map = {}
        for key, agent in cls.AGENTS.items():
            agent_key_map[agent["name"]] = key

        steps = []
        llm_steps = llm_result.get("steps", [])

        for i, step_data in enumerate(llm_steps):
            agent_name = step_data.get("agent", "Reasoning Agent")
            agent_key = agent_key_map.get(agent_name, "reasoning")

            if agent_key not in cls.AGENTS:
                agent_key = "reasoning"

            is_last = (i == len(llm_steps) - 1)
            steps.append(cls.create_step(
                agent_key,
                "complete" if is_last else "working",
                step_data.get("message", "分析中..."),
                result=step_data.get("result"),
                isTyping=(not is_last and i == len(llm_steps) - 2),
            ))

        return steps

    @classmethod
    def generate_evidence(cls, alert: dict, event_type: str) -> List[EvidenceItem]:
        evidence = []

        if event_type == "phishing":
            evidence = [
                EvidenceItem(
                    id=f"ev-{alert.get('id', 'unknown')}-1",
                    type="邮件样本",
                    icon="FileText",
                    content="检测到高仿域名钓鱼邮件",
                    details=[
                        {"label": "发件域名", "value": alert.get("spoofed_domain", "可疑域名")},
                        {"label": "相似度", "value": "待确认"},
                        {"label": "附件", "value": alert.get("attachment", "待分析")}
                    ],
                    riskLevel="critical",
                    source="邮件网关"
                ),
                EvidenceItem(
                    id=f"ev-{alert.get('id', 'unknown')}-2",
                    type="威胁情报",
                    icon="Target",
                    content="IP关联已知威胁",
                    details=[
                        {"label": "源IP", "value": alert.get("source_ip", "未知")},
                        {"label": "信誉分", "value": "待查询"},
                        {"label": "组织", "value": "待确认"}
                    ],
                    riskLevel="critical",
                    source="威胁情报库"
                ),
                EvidenceItem(
                    id=f"ev-{alert.get('id', 'unknown')}-3",
                    type="用户行为",
                    icon="Activity",
                    content="多名员工点击恶意链接",
                    details=[
                        {"label": "影响人数", "value": "待确认"},
                        {"label": "响应时间", "value": "待确认"},
                        {"label": "风险等级", "value": "HIGH"}
                    ],
                    riskLevel="high",
                    source="UEBA系统"
                )
            ]
        elif event_type == "vpn":
            evidence = [
                EvidenceItem(
                    id=f"ev-{alert.get('id', 'unknown')}-1",
                    type="VPN日志",
                    icon="Lock",
                    content="从高风险地区异常登录",
                    details=[
                        {"label": "源IP", "value": alert.get("source_ip", "未知")},
                        {"label": "国家", "value": alert.get("country", "未知")},
                        {"label": "城市", "value": alert.get("city", "未知")}
                    ],
                    riskLevel="critical",
                    source="VPN网关"
                ),
                EvidenceItem(
                    id=f"ev-{alert.get('id', 'unknown')}-2",
                    type="用户上下文",
                    icon="User",
                    content="用户实际位置与登录地点不符",
                    details=[
                        {"label": "用户", "value": alert.get("username", "未知")},
                        {"label": "实际位置", "value": alert.get("actual_location", "未知")},
                        {"label": "状态", "value": alert.get("user_status", "待确认")}
                    ],
                    riskLevel="critical",
                    source="AD域控"
                )
            ]
        elif event_type == "malware":
            evidence = [
                EvidenceItem(
                    id=f"ev-{alert.get('id', 'unknown')}-1",
                    type="内存取证",
                    icon="Shield",
                    content="检测到恶意软件内存特征",
                    details=[
                        {"label": "恶意家族", "value": alert.get("malware_family", "待确认")},
                        {"label": "版本", "value": alert.get("version", "未知")},
                        {"label": "权限", "value": "待确认"}
                    ],
                    riskLevel="critical",
                    source="EDR引擎"
                ),
                EvidenceItem(
                    id=f"ev-{alert.get('id', 'unknown')}-2",
                    type="网络流量",
                    icon="Globe",
                    content="发现加密C2通信流量",
                    details=[
                        {"label": "C2地址", "value": alert.get("c2_address", "待确认")},
                        {"label": "外传数据", "value": "待分析"},
                        {"label": "持续时间", "value": "待确认"}
                    ],
                    riskLevel="critical",
                    source="NDR系统"
                )
            ]

        if not evidence:
            evidence = [
                EvidenceItem(
                    id=f"ev-{alert.get('id', 'unknown')}-1",
                    type="告警详情",
                    icon="AlertTriangle",
                    content=alert.get("title", "安全事件"),
                    details=[
                        {"label": "事件ID", "value": alert.get("event_id", "UNKNOWN")},
                        {"label": "严重程度", "value": alert.get("severity", "HIGH").upper()},
                        {"label": "来源", "value": alert.get("source", "未知")}
                    ],
                    riskLevel=alert.get("severity", "medium"),
                    source=alert.get("source", "安全系统")
                )
            ]

        return evidence

    @classmethod
    def generate_correlation_links(cls, alert: dict, event_type: str) -> List[CorrelationLink]:
        links = []

        if event_type == "phishing":
            links = [
                CorrelationLink(from_field="钓鱼邮件发送", to="用户点击链接", description="社会工程学成功"),
                CorrelationLink(from_field="用户点击链接", to="凭证输入页面", description="伪造登录页"),
                CorrelationLink(from_field="凭证输入", to="恶意软件下载", description="后续载荷投递")
            ]
        elif event_type == "vpn":
            links = [
                CorrelationLink(from_field="VPN异地登录", to="MFA绕过", description="凭证可能已泄露"),
                CorrelationLink(from_field="MFA绕过", to="RDP横向移动", description="内网侦察开始"),
                CorrelationLink(from_field="RDP扫描", to="数据批量导出", description="数据窃取行为")
            ]
        elif event_type == "malware":
            links = [
                CorrelationLink(from_field="钓鱼文档打开", to="宏代码执行", description="初始执行向量"),
                CorrelationLink(from_field="PowerShell下载", to="Beacon加载", description="载荷投递"),
                CorrelationLink(from_field="C2心跳建立", to="数据回传", description="命令控制通道激活")
            ]
        else:
            links = [
                CorrelationLink(from_field="异常行为检测", to="规则触发", description="安全策略匹配"),
                CorrelationLink(from_field="告警生成", to="AI分析启动", description="自动化研判开始")
            ]

        return links

    @classmethod
    async def analyze_alert(cls, alert: dict) -> SecurityEvent:
        event_id = f"ALT-{datetime.now().strftime('%Y%m%d')}-001"
        alert_type = alert.get("type", "").lower()
        severity = alert.get("severity", "high").lower()

        llm_result = await cls._llm_analyze_alert(alert)

        if llm_result:
            logger.info("使用真实 LLM 分析结果 - 事件: %s", alert.get("title", "未知"))
            steps = cls._convert_llm_steps(llm_result, alert)
            llm_conclusion = llm_result.get("conclusion", {})
            confidence = llm_conclusion.get("confidence", 85)
            risk_score = llm_conclusion.get("riskScore", 75)

            if "phishing" in alert_type or "email" in alert_type:
                source_icon = "FileText"
                source_color = "#ef4444"
                category = "钓鱼攻击"
            elif "vpn" in alert_type or "login" in alert_type:
                source_icon = "Lock"
                source_color = "#f97316"
                category = "身份异常"
            elif "malware" in alert_type or "edr" in alert_type:
                source_icon = "Shield"
                source_color = "#ef4444"
                category = "恶意软件"
            else:
                source_icon = "AlertTriangle"
                source_color = "#eab308"
                category = "安全事件"

            evidence_list = cls.generate_evidence(alert, alert_type)
            correlation_links = cls.generate_correlation_links(alert, alert_type)

            conclusion = AIConclusion(
                event=llm_conclusion.get("event", alert.get("title", "安全事件需要关注")),
                confidence=confidence,
                attackPhase=llm_conclusion.get("attackPhase", cls._determine_attack_phase(severity)),
                recommendations=llm_conclusion.get("recommendations", cls._generate_recommendations(severity)),
                riskScore=risk_score
            )

            return SecurityEvent(
                id=f"evt-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                eventId=event_id,
                title=alert.get("title", "安全告警"),
                source=alert.get("source", "安全系统"),
                sourceIcon=source_icon,
                sourceColor=source_color,
                severity=severity,
                category=category,
                description=alert.get("description", "检测到异常活动，需要AI进一步分析"),
                steps=steps,
                evidenceList=evidence_list,
                correlationLinks=correlation_links,
                conclusion=conclusion
            )

        logger.info("LLM 不可用，返回基础分析结果 - 事件: %s", alert.get("title", "未知"))

        if "phishing" in alert_type or "email" in alert_type:
            source_icon = "FileText"
            source_color = "#ef4444"
            category = "钓鱼攻击"
        elif "vpn" in alert_type or "login" in alert_type:
            source_icon = "Lock"
            source_color = "#f97316"
            category = "身份异常"
        elif "malware" in alert_type or "edr" in alert_type:
            source_icon = "Shield"
            source_color = "#ef4444"
            category = "恶意软件"
        else:
            source_icon = "AlertTriangle"
            source_color = "#eab308"
            category = "安全事件"

        evidence_list = cls.generate_evidence(alert, alert_type)
        correlation_links = cls.generate_correlation_links(alert, alert_type)

        steps = [
            cls.create_step(
                "soc", "complete",
                f"收到安全告警 - {alert.get('title', '异常活动检测')}",
                [
                    f"类型: {alert.get('type', '未知')}",
                    f"严重程度: {alert.get('severity', 'MEDIUM').upper()}",
                    f"来源: {alert.get('source', '未知系统')}"
                ]
            ),
            cls.create_step(
                "reasoning", "working",
                "基础分析完成，需要 LLM 配置以获取深度分析",
                isTyping=True,
                result=[
                    "LLM 未配置，无法进行深度推理分析",
                    "请设置 LLM_API_KEY 环境变量以启用 AI 分析能力",
                    "当前为基础分析模式"
                ]
            ),
            cls.create_step(
                "conclusion", "complete",
                "基础分析完成 - 请配置 LLM 以获取完整分析能力",
                [
                    "置信度: 待确认",
                    "建议: 请管理员配置 LLM 后重新分析",
                    "当前模式: 基础分析（无 AI 推理）"
                ]
            )
        ]

        conclusion = AIConclusion(
            event=alert.get("title", "安全事件需要关注"),
            confidence=50,
            attackPhase=cls._determine_attack_phase(severity),
            recommendations=cls._generate_recommendations(severity),
            riskScore=50
        )

        return SecurityEvent(
            id=f"evt-basic-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            eventId=event_id,
            title=alert.get("title", "安全告警"),
            source=alert.get("source", "安全系统"),
            sourceIcon=source_icon,
            sourceColor=source_color,
            severity=severity,
            category=category,
            description=f"[基础分析] {alert.get('description', '检测到异常活动，需要AI进一步分析')}",
            steps=steps,
            evidenceList=evidence_list,
            correlationLinks=correlation_links,
            conclusion=conclusion
        )

    @classmethod
    def _determine_attack_phase(cls, severity: str) -> str:
        phases = {
            "critical": "Initial Access → Execution → Persistence",
            "high": "Reconnaissance → Weaponization → Delivery",
            "medium": "Exploitation → Installation → C2",
            "low": "Preparation → Targeting"
        }
        return phases.get(severity, "Unknown Phase")

    @classmethod
    def _generate_recommendations(cls, severity: str) -> List[str]:
        recommendations = {
            "critical": [
                "立即隔离相关系统和账号",
                "启动应急响应流程",
                "通知管理层和安全团队",
                "保全数字取证证据"
            ],
            "high": [
                "在24小时内完成调查",
                "联系相关用户确认",
                "加强监控相关指标",
                "更新安全策略"
            ],
            "medium": [
                "添加到待处理队列",
                "下次例会讨论",
                "持续监控变化趋势"
            ],
            "low": [
                "记录为已知基线",
                "定期回顾",
                "无需紧急处理"
            ]
        }
        return recommendations.get(severity, ["请安全团队评估"])


analysis_engine = AIAnalysisEngine()