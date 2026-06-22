"""
研判报告引擎 - 生成安全事件研判报告，包含影响分析、结论判定和处置建议
"""

import json
import logging
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.services.llm_client import llm_client

logger = logging.getLogger(__name__)


# ==================== Pydantic 数据模型 ====================

class ImpactAnalysis(BaseModel):
    """影响分析模型"""
    affected_systems: list[str] = Field(default_factory=list, description="受影响的系统列表")
    affected_users: list[str] = Field(default_factory=list, description="受影响的用户列表")
    data_exposure_risk: str = Field(default="none", description="数据泄露风险: none/low/medium/high/critical")
    business_impact: str = Field(default="none", description="业务影响: none/low/medium/high/critical")
    lateral_movement_risk: str = Field(default="none", description="横向移动风险: none/low/medium/high/critical")
    blast_radius_description: str = Field(default="", description="爆炸半径描述")


class Conclusion(BaseModel):
    """研判结论模型"""
    verdict: str = Field(description="判定结果: TP/FP/BP/INC")
    verdict_display: str = Field(description="判定结果中文显示: 确认威胁/误报/良性正向/安全事件")
    confidence: int = Field(ge=0, le=100, description="置信度 0-100")
    summary: str = Field(default="", description="结论摘要")
    severity: str = Field(default="medium", description="严重程度")
    key_findings: list[str] = Field(default_factory=list, description="关键发现列表")


class Recommendation(BaseModel):
    """处置建议模型"""
    action: str = Field(description="建议动作")
    priority: str = Field(default="medium", description="优先级: immediate/high/medium/low")
    category: str = Field(default="containment", description="类别: containment/eradication/recovery/evidence_preservation")
    description: str = Field(default="", description="详细描述")
    responsible_role: str = Field(default="安全运营团队", description="负责角色")


class InvestigationReport(BaseModel):
    """研判报告模型"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    alert_id: Optional[int] = Field(default=None, description="关联告警ID")
    title: str = Field(default="", description="报告标题")
    generated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    impact: ImpactAnalysis = Field(default_factory=ImpactAnalysis)
    conclusion: Conclusion = Field(...)
    recommendations: list[Recommendation] = Field(default_factory=list)
    report_version: str = Field(default="1.0")


# ==================== 判定映射 ====================

VERDICT_MAP = {
    "TP": "确认威胁",
    "FP": "误报",
    "BP": "良性正向",
    "INC": "安全事件",
}

VALID_RISK_LEVELS = {"none", "low", "medium", "high", "critical"}
VALID_VERDICTS = {"TP", "FP", "BP", "INC"}
VALID_PRIORITIES = {"immediate", "high", "medium", "low"}
VALID_CATEGORIES = {"containment", "eradication", "recovery", "evidence_preservation"}


# ==================== 研判报告服务 ====================

class InvestigationReportService:
    """
    研判报告服务

    根据告警数据和AI分析结果，生成包含影响分析、明确结论和处置建议的完整研判报告。
    优先使用LLM进行智能分析，LLM不可用时回退到规则引擎。
    """

    @classmethod
    async def generate_report(cls, alert_data: dict, analysis_result: dict) -> InvestigationReport:
        """
        主入口：生成完整的研判报告

        Args:
            alert_data: 告警数据字典
            analysis_result: AI分析结果字典

        Returns:
            InvestigationReport: 完整的研判报告
        """
        logger.info("开始生成研判报告 - 告警: %s", alert_data.get("title", "未知"))

        # 1. 影响分析
        impact = await cls.analyze_impact(alert_data, analysis_result)

        # 2. 生成结论
        conclusion = await cls.generate_conclusion(alert_data, analysis_result, impact)

        # 3. 生成建议
        recommendations = await cls.generate_recommendations(conclusion, impact)

        # 4. 组装报告
        alert_id = alert_data.get("id")
        title = cls._build_report_title(alert_data, conclusion)

        report = InvestigationReport(
            alert_id=alert_id,
            title=title,
            impact=impact,
            conclusion=conclusion,
            recommendations=recommendations,
        )

        logger.info(
            "研判报告生成完成 - 判定: %s(%s) 置信度: %d%%",
            conclusion.verdict, conclusion.verdict_display, conclusion.confidence,
        )
        return report

    @classmethod
    async def analyze_impact(cls, alert_data: dict, analysis_result: dict) -> ImpactAnalysis:
        """
        分析影响范围和爆炸半径

        Args:
            alert_data: 告警数据
            analysis_result: AI分析结果

        Returns:
            ImpactAnalysis: 影响分析结果
        """
        if llm_client.is_available:
            try:
                impact = await cls._llm_analyze_impact(alert_data, analysis_result)
                if impact is not None:
                    return impact
            except Exception as e:
                logger.error("LLM 影响分析失败，回退到规则引擎: %s", str(e))

        return cls._rule_based_impact(alert_data, analysis_result)

    @classmethod
    async def generate_conclusion(
        cls, alert_data: dict, analysis_result: dict, impact: ImpactAnalysis
    ) -> Conclusion:
        """
        生成明确的研判结论

        必须产出清晰、确定的判定结果，不能仅有分析而无结论。

        Args:
            alert_data: 告警数据
            analysis_result: AI分析结果
            impact: 影响分析

        Returns:
            Conclusion: 研判结论
        """
        if llm_client.is_available:
            try:
                conclusion = await cls._llm_generate_conclusion(alert_data, analysis_result, impact)
                if conclusion is not None:
                    return conclusion
            except Exception as e:
                logger.error("LLM 结论生成失败，回退到规则引擎: %s", str(e))

        return cls._rule_based_conclusion(alert_data, analysis_result, impact)

    @classmethod
    async def generate_recommendations(
        cls, conclusion: Conclusion, impact: ImpactAnalysis
    ) -> list[Recommendation]:
        """
        根据结论和影响分析生成处置建议

        Args:
            conclusion: 研判结论
            impact: 影响分析

        Returns:
            list[Recommendation]: 处置建议列表
        """
        if llm_client.is_available:
            try:
                recommendations = await cls._llm_generate_recommendations(conclusion, impact)
                if recommendations is not None:
                    return recommendations
            except Exception as e:
                logger.error("LLM 建议生成失败，回退到规则引擎: %s", str(e))

        return cls._rule_based_recommendations(conclusion, impact)

    # ==================== LLM 分析方法 ====================

    @classmethod
    async def _llm_analyze_impact(cls, alert_data: dict, analysis_result: dict) -> Optional[ImpactAnalysis]:
        """使用LLM进行影响分析"""
        messages = [
            {
                "role": "system",
                "content": (
                    "你是一位资深安全运营分析师，专门负责安全事件的影响范围评估。\n\n"
                    "请分析给定告警和分析结果，评估事件的影响范围。以 JSON 格式返回以下字段：\n"
                    "1. affected_systems: 受影响的系统列表（字符串数组）\n"
                    "2. affected_users: 受影响的用户列表（字符串数组）\n"
                    "3. data_exposure_risk: 数据泄露风险等级（none/low/medium/high/critical）\n"
                    "4. business_impact: 业务影响等级（none/low/medium/high/critical）\n"
                    "5. lateral_movement_risk: 横向移动风险等级（none/low/medium/high/critical）\n"
                    "6. blast_radius_description: 爆炸半径的文字描述\n\n"
                    "只返回JSON，不要包含其他内容。分析要专业、准确，使用中文。"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"告警数据：\n{json.dumps(alert_data, ensure_ascii=False, default=str)}\n\n"
                    f"AI分析结果：\n{json.dumps(analysis_result, ensure_ascii=False, default=str)}"
                ),
            },
        ]

        result = await llm_client.chat_json(messages, temperature=0.3)

        data_exposure = result.get("data_exposure_risk", "none")
        business = result.get("business_impact", "none")
        lateral = result.get("lateral_movement_risk", "none")

        return ImpactAnalysis(
            affected_systems=result.get("affected_systems", []),
            affected_users=result.get("affected_users", []),
            data_exposure_risk=data_exposure if data_exposure in VALID_RISK_LEVELS else "none",
            business_impact=business if business in VALID_RISK_LEVELS else "none",
            lateral_movement_risk=lateral if lateral in VALID_RISK_LEVELS else "none",
            blast_radius_description=result.get("blast_radius_description", ""),
        )

    @classmethod
    async def _llm_generate_conclusion(
        cls, alert_data: dict, analysis_result: dict, impact: ImpactAnalysis
    ) -> Optional[Conclusion]:
        """使用LLM生成研判结论"""
        messages = [
            {
                "role": "system",
                "content": (
                    "你是一位资深安全研判专家，负责对安全事件做出明确、确定的研判结论。\n\n"
                    "重要要求：你必须给出一个明确的判定结果，不能模棱两可。\n\n"
                    "判定类型说明：\n"
                    "- TP (True Positive/确认威胁): 告警真实，确认存在安全威胁\n"
                    "- FP (False Positive/误报): 告警为误报，无实际威胁\n"
                    "- BP (Benign Positive/良性正向): 告警真实但属于正常业务行为\n"
                    "- INC (Incident/安全事件): 已确认发生安全事件，需要应急响应\n\n"
                    "请以 JSON 格式返回以下字段：\n"
                    "1. verdict: 判定结果（必须是 TP/FP/BP/INC 之一）\n"
                    "2. confidence: 置信度（0-100整数）\n"
                    "3. summary: 结论摘要（一段清晰的中文描述，说明判定理由）\n"
                    "4. severity: 严重程度（critical/high/medium/low/info）\n"
                    "5. key_findings: 关键发现列表（字符串数组，列出支撑判定的核心证据）\n\n"
                    "只返回JSON，不要包含其他内容。结论必须明确、有据可依。"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"告警数据：\n{json.dumps(alert_data, ensure_ascii=False, default=str)}\n\n"
                    f"AI分析结果：\n{json.dumps(analysis_result, ensure_ascii=False, default=str)}\n\n"
                    f"影响分析：\n{impact.model_dump_json(ensure_ascii=False)}"
                ),
            },
        ]

        result = await llm_client.chat_json(messages, temperature=0.2)

        verdict = result.get("verdict", "TP")
        if verdict not in VALID_VERDICTS:
            verdict = "TP"

        return Conclusion(
            verdict=verdict,
            verdict_display=VERDICT_MAP[verdict],
            confidence=max(0, min(100, int(result.get("confidence", 70)))),
            summary=result.get("summary", ""),
            severity=result.get("severity", "medium"),
            key_findings=result.get("key_findings", []),
        )

    @classmethod
    async def _llm_generate_recommendations(
        cls, conclusion: Conclusion, impact: ImpactAnalysis
    ) -> Optional[list[Recommendation]]:
        """使用LLM生成处置建议"""
        messages = [
            {
                "role": "system",
                "content": (
                    "你是一位安全应急响应专家，负责根据研判结论和影响分析制定处置建议。\n\n"
                    "请以 JSON 数组格式返回建议列表，每条建议包含以下字段：\n"
                    "1. action: 建议动作（简短的中文描述）\n"
                    "2. priority: 优先级（immediate/high/medium/low）\n"
                    "3. category: 类别（containment/eradication/recovery/evidence_preservation）\n"
                    "4. description: 详细描述（中文，说明具体操作步骤）\n"
                    "5. responsible_role: 负责角色\n\n"
                    "类别说明：\n"
                    "- containment: 遏制措施，阻止威胁扩散\n"
                    "- eradication: 根除措施，消除威胁源\n"
                    "- recovery: 恢复措施，恢复正常业务\n"
                    "- evidence_preservation: 证据保全，保存取证数据\n\n"
                    "只返回JSON数组，不要包含其他内容。建议要具体、可操作。"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"研判结论：\n{conclusion.model_dump_json(ensure_ascii=False)}\n\n"
                    f"影响分析：\n{impact.model_dump_json(ensure_ascii=False)}"
                ),
            },
        ]

        result = await llm_client.chat_json(messages, temperature=0.3)

        if not isinstance(result, list):
            result = result.get("recommendations", result.get("data", []))

        recommendations = []
        for item in result:
            if not isinstance(item, dict):
                continue
            priority = item.get("priority", "medium")
            category = item.get("category", "containment")
            recommendations.append(Recommendation(
                action=item.get("action", ""),
                priority=priority if priority in VALID_PRIORITIES else "medium",
                category=category if category in VALID_CATEGORIES else "containment",
                description=item.get("description", ""),
                responsible_role=item.get("responsible_role", "安全运营团队"),
            ))

        return recommendations if recommendations else None

    # ==================== 规则引擎回退方法 ====================

    @classmethod
    def _rule_based_impact(cls, alert_data: dict, analysis_result: dict) -> ImpactAnalysis:
        """基于规则的影响分析（LLM不可用时的回退方案）"""
        severity = cls._normalize_severity(alert_data, analysis_result)
        alert_type = alert_data.get("type", "").lower()
        source_ip = alert_data.get("source_ip", "")
        dest_ip = alert_data.get("destination_ip", "")
        username = alert_data.get("user_name", "") or alert_data.get("username", "")

        # 受影响系统
        affected_systems = []
        if dest_ip:
            affected_systems.append(f"目标系统({dest_ip})")
        if source_ip:
            affected_systems.append(f"来源系统({source_ip})")
        if not affected_systems:
            affected_systems = ["待确认"]

        # 受影响用户
        affected_users = [username] if username else ["待确认"]

        # 风险等级映射
        risk_map = {
            "critical": "critical",
            "high": "high",
            "medium": "medium",
            "low": "low",
            "info": "none",
        }

        # 根据告警类型调整风险
        data_risk = risk_map.get(severity, "none")
        business_risk = risk_map.get(severity, "none")
        lateral_risk = "none"

        if alert_type in ("phishing", "email"):
            data_risk = "high" if severity in ("critical", "high") else "medium"
            business_risk = "medium"
            lateral_risk = "high" if severity == "critical" else "medium"
        elif alert_type in ("vpn", "login", "bruteforce"):
            data_risk = "medium"
            business_risk = "low"
            lateral_risk = "critical" if severity in ("critical", "high") else "medium"
        elif alert_type in ("malware", "edr"):
            data_risk = "critical" if severity == "critical" else "high"
            business_risk = "high" if severity in ("critical", "high") else "medium"
            lateral_risk = "critical" if severity in ("critical", "high") else "high"
        elif alert_type == "dlp":
            data_risk = "critical"
            business_risk = "high"
            lateral_risk = "low"

        # 爆炸半径描述
        blast_desc = cls._build_blast_radius(alert_type, severity, affected_systems, affected_users)

        return ImpactAnalysis(
            affected_systems=affected_systems,
            affected_users=affected_users,
            data_exposure_risk=data_risk,
            business_impact=business_risk,
            lateral_movement_risk=lateral_risk,
            blast_radius_description=blast_desc,
        )

    @classmethod
    def _rule_based_conclusion(
        cls, alert_data: dict, analysis_result: dict, impact: ImpactAnalysis
    ) -> Conclusion:
        """基于规则的结论生成（LLM不可用时的回退方案）"""
        severity = cls._normalize_severity(alert_data, analysis_result)
        alert_type = alert_data.get("type", "").lower()
        risk_score = analysis_result.get("risk_score", analysis_result.get("riskScore", 50))
        title = alert_data.get("title", "安全告警")

        # 判定逻辑
        verdict, confidence, summary, key_findings = cls._determine_verdict(
            alert_data, analysis_result, impact, severity, alert_type, risk_score, title
        )

        return Conclusion(
            verdict=verdict,
            verdict_display=VERDICT_MAP[verdict],
            confidence=confidence,
            summary=summary,
            severity=severity,
            key_findings=key_findings,
        )

    @classmethod
    def _rule_based_recommendations(
        cls, conclusion: Conclusion, impact: ImpactAnalysis
    ) -> list[Recommendation]:
        """基于规则的处置建议生成（LLM不可用时的回退方案）"""
        recommendations = []
        verdict = conclusion.verdict
        severity = conclusion.severity

        if verdict == "INC":
            # 安全事件 - 需要全面应急响应
            recommendations.extend([
                Recommendation(
                    action="立即隔离受影响系统",
                    priority="immediate",
                    category="containment",
                    description="将受影响的系统从网络中隔离，阻止威胁进一步扩散",
                    responsible_role="安全运维团队",
                ),
                Recommendation(
                    action="重置相关账号凭证",
                    priority="immediate",
                    category="eradication",
                    description="重置所有受影响用户的密码，撤销现有会话令牌",
                    responsible_role="身份管理团队",
                ),
                Recommendation(
                    action="保全取证证据",
                    priority="immediate",
                    category="evidence_preservation",
                    description="对受影响系统进行内存快照和磁盘镜像，保存日志和流量数据",
                    responsible_role="安全取证团队",
                ),
                Recommendation(
                    action="启动应急响应流程",
                    priority="immediate",
                    category="containment",
                    description="通知管理层和安全团队，启动正式的应急响应流程",
                    responsible_role="安全负责人",
                ),
            ])
        elif verdict == "TP":
            # 确认威胁
            if severity in ("critical", "high"):
                recommendations.extend([
                    Recommendation(
                        action="隔离受影响系统",
                        priority="immediate",
                        category="containment",
                        description="立即隔离受影响的系统和网络区域",
                        responsible_role="安全运维团队",
                    ),
                    Recommendation(
                        action="阻断威胁通信",
                        priority="high",
                        category="containment",
                        description="在防火墙和代理层面阻断已知的恶意IP和域名",
                        responsible_role="网络安全团队",
                    ),
                ])
            else:
                recommendations.append(Recommendation(
                    action="限制受影响系统访问权限",
                    priority="high",
                    category="containment",
                    description="对受影响系统实施最小权限访问控制",
                    responsible_role="安全运维团队",
                ))

            recommendations.extend([
                Recommendation(
                    action="收集和保全证据",
                    priority="high",
                    category="evidence_preservation",
                    description="收集相关日志、流量数据和系统快照",
                    responsible_role="安全取证团队",
                ),
                Recommendation(
                    action="清除威胁并恢复系统",
                    priority="medium",
                    category="recovery",
                    description="在确认威胁已消除后，恢复系统正常运行",
                    responsible_role="安全运维团队",
                ),
            ])
        elif verdict == "BP":
            # 良性正向
            recommendations.extend([
                Recommendation(
                    action="更新检测规则白名单",
                    priority="medium",
                    category="eradication",
                    description="将已确认的良性行为加入检测白名单，减少后续误报",
                    responsible_role="安全运营团队",
                ),
                Recommendation(
                    action="记录基线行为",
                    priority="low",
                    category="evidence_preservation",
                    description="将此行为记录为正常基线，供后续分析参考",
                    responsible_role="安全运营团队",
                ),
            ])
        elif verdict == "FP":
            # 误报
            recommendations.extend([
                Recommendation(
                    action="优化检测规则",
                    priority="medium",
                    category="eradication",
                    description="调整触发误报的检测规则，提高检测精确度",
                    responsible_role="安全运营团队",
                ),
                Recommendation(
                    action="关闭此告警",
                    priority="low",
                    category="recovery",
                    description="确认误报后关闭此告警，恢复正常状态",
                    responsible_role="安全运营团队",
                ),
            ])

        # 根据影响分析补充建议
        if impact.lateral_movement_risk in ("high", "critical"):
            recommendations.append(Recommendation(
                action="加强网络分段和监控",
                priority="high",
                category="containment",
                description="检查并加强网络分段策略，增加横向移动检测规则",
                responsible_role="网络安全团队",
            ))

        if impact.data_exposure_risk in ("high", "critical"):
            recommendations.append(Recommendation(
                action="评估数据泄露范围",
                priority="high",
                category="evidence_preservation",
                description="评估可能泄露的数据范围和敏感程度，必要时启动数据泄露通报流程",
                responsible_role="数据安全团队",
            ))

        return recommendations

    # ==================== 辅助方法 ====================

    @classmethod
    def _normalize_severity(cls, alert_data: dict, analysis_result: dict) -> str:
        """统一严重程度格式"""
        severity = (
            analysis_result.get("risk_level")
            or analysis_result.get("severity")
            or alert_data.get("risk_level")
            or alert_data.get("severity")
            or "medium"
        ).lower()

        severity_map = {
            "critical": "critical",
            "high": "high",
            "medium": "medium",
            "low": "low",
            "info": "info",
        }
        return severity_map.get(severity, "medium")

    @classmethod
    def _determine_verdict(
        cls,
        alert_data: dict,
        analysis_result: dict,
        impact: ImpactAnalysis,
        severity: str,
        alert_type: str,
        risk_score: float,
        title: str,
    ) -> tuple:
        """基于规则判定告警结论"""
        # 从分析结果中提取已有判定信息
        existing_verdict = analysis_result.get("verdict", "")
        if existing_verdict in VALID_VERDICTS:
            verdict = existing_verdict
        else:
            # 根据风险评分和影响范围判定
            risk_score = float(risk_score) if risk_score else 50

            if risk_score >= 80 and severity in ("critical", "high"):
                verdict = "INC"
            elif risk_score >= 60:
                verdict = "TP"
            elif risk_score >= 30:
                verdict = "BP"
            else:
                verdict = "FP"

        # 根据判定结果生成置信度和摘要
        confidence_map = {
            "INC": 90 if severity == "critical" else 80,
            "TP": 75,
            "BP": 65,
            "FP": 70,
        }
        confidence = confidence_map.get(verdict, 60)

        # 如果影响范围较大，提高置信度
        if impact.business_impact in ("high", "critical") or impact.data_exposure_risk in ("high", "critical"):
            confidence = min(100, confidence + 10)

        # 生成摘要
        summary_map = {
            "INC": f"经研判，该事件确认为安全事件。{title}已对业务造成实际影响，需要立即启动应急响应。",
            "TP": f"经研判，该告警确认为真实威胁。{title}存在安全风险，需要及时处置。",
            "BP": f"经研判，该告警为良性正向。{title}属于正常业务行为触发，无需紧急处置。",
            "FP": f"经研判，该告警为误报。{title}未发现实际安全威胁，建议优化检测规则。",
        }
        summary = summary_map.get(verdict, "无法确定告警性质，建议人工复核。")

        # 关键发现
        key_findings = cls._extract_key_findings(alert_data, analysis_result, impact, verdict)

        return verdict, confidence, summary, key_findings

    @classmethod
    def _extract_key_findings(
        cls,
        alert_data: dict,
        analysis_result: dict,
        impact: ImpactAnalysis,
        verdict: str,
    ) -> list[str]:
        """提取关键发现"""
        findings = []

        # 从分析结果中提取
        reasoning = analysis_result.get("reasoning_chain", [])
        if isinstance(reasoning, list):
            for item in reasoning[:3]:
                if isinstance(item, dict):
                    findings.append(item.get("content", item.get("message", str(item))))
                elif isinstance(item, str):
                    findings.append(item)

        evidence = analysis_result.get("evidence_summary", [])
        if isinstance(evidence, list):
            for item in evidence[:2]:
                if isinstance(item, str):
                    findings.append(item)

        # 从影响分析中提取
        if impact.affected_systems and impact.affected_systems != ["待确认"]:
            findings.append(f"受影响系统: {', '.join(impact.affected_systems[:5])}")

        if impact.data_exposure_risk in ("high", "critical"):
            findings.append(f"数据泄露风险等级: {impact.data_exposure_risk}")

        if impact.lateral_movement_risk in ("high", "critical"):
            findings.append(f"横向移动风险等级: {impact.lateral_movement_risk}")

        # 如果没有提取到任何发现，生成默认发现
        if not findings:
            title = alert_data.get("title", "未知告警")
            source = alert_data.get("source", "未知来源")
            findings = [
                f"告警来源: {source}",
                f"告警标题: {title}",
                f"判定结果: {VERDICT_MAP.get(verdict, verdict)}",
            ]

        return findings[:8]  # 最多保留8条

    @classmethod
    def _build_report_title(cls, alert_data: dict, conclusion: Conclusion) -> str:
        """构建报告标题"""
        title = alert_data.get("title", "安全告警")
        return f"[{conclusion.verdict_display}] {title} - 研判报告"

    @classmethod
    def _build_blast_radius(
        cls,
        alert_type: str,
        severity: str,
        affected_systems: list[str],
        affected_users: list[str],
    ) -> str:
        """构建爆炸半径描述"""
        type_names = {
            "phishing": "钓鱼攻击",
            "email": "邮件安全",
            "vpn": "VPN异常",
            "login": "登录异常",
            "bruteforce": "暴力破解",
            "malware": "恶意软件",
            "edr": "终端安全",
            "dlp": "数据泄露",
        }
        type_name = type_names.get(alert_type, "安全事件")

        systems_str = "、".join(affected_systems[:3])
        users_str = "、".join(affected_users[:3])

        desc = f"本次{type_name}事件"
        if severity in ("critical", "high"):
            desc += "影响范围较大"
        else:
            desc += "影响范围有限"

        if affected_systems and affected_systems != ["待确认"]:
            desc += f"，涉及系统: {systems_str}"
        if affected_users and affected_users != ["待确认"]:
            desc += f"，涉及用户: {users_str}"

        return desc


# 服务单例
investigation_report_service = InvestigationReportService()
