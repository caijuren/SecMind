"""
告警预处理流水线服务

实现告警预处理流程：消息接入 → AI去噪/去重 → 分级分类 → 分级研判
"""

import json
import logging
import hashlib
from datetime import datetime, timedelta
from difflib import SequenceMatcher
from typing import Optional

from pydantic import BaseModel, Field

from app.database import SessionLocal
from app.models.alert import Alert
from app.services.llm_client import llm_client

logger = logging.getLogger(__name__)


# ─── 配置模型 ───────────────────────────────────────────────

class PipelineConfig(BaseModel):
    """流水线配置"""
    noise_threshold: int = Field(
        default=70,
        description="噪声分数阈值，高于此值的告警将被过滤",
    )
    duplicate_similarity_threshold: float = Field(
        default=0.85,
        description="去重相似度阈值，高于此值视为重复告警",
    )
    auto_investigate_levels: list[str] = Field(
        default=["critical", "high"],
        description="自动研判的风险等级列表",
    )
    classification_rules: dict = Field(
        default_factory=dict,
        description="自定义分类规则",
    )


# ─── 结果模型 ───────────────────────────────────────────────

class PipelineResult(BaseModel):
    """流水线处理结果"""
    original_alert: dict
    noise_score: int
    is_noise: bool
    is_duplicate: bool
    duplicate_of: Optional[int] = None
    risk_level: str
    category: str
    auto_investigate: bool
    investigation_type: str  # "auto" 或 "manual"
    processing_timestamp: str
    pipeline_version: str = "1.0"


# ─── 常量定义 ───────────────────────────────────────────────

# 噪声关键词模式
NOISE_PATTERNS = [
    "心跳检测", "健康检查", "health_check", "heartbeat",
    "端口扫描-已确认误报", "已知测试流量", "例行巡检",
    "系统自检", "自动探测", "扫描-内网资产发现",
    "test_alert", "ping check", "synthetic monitor",
]

# 高风险关键词
HIGH_RISK_PATTERNS = [
    "勒索", "ransomware", "挖矿", "cryptominer",
    "数据外泄", "data exfiltration", "横向移动", "lateral movement",
    "权限提升", "privilege escalation", "0day", "zero-day",
    "APT", "后门", "backdoor", "webshell",
]

# 分类关键词映射
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "phishing": ["钓鱼", "phishing", "仿冒", "欺诈邮件", "钓鱼邮件", "credential harvesting"],
    "vpn": ["VPN异常", "VPN违规", "非法VPN", "VPN隧道", "VPN连接异常"],
    "malware": ["恶意软件", "malware", "病毒", "木马", "trojan", "蠕虫", "worm", "勒索", "ransomware", "挖矿"],
    "dlp": ["数据泄露", "DLP", "数据外传", "敏感数据", "数据违规", "data loss"],
    "brute_force": ["暴力破解", "brute force", "密码喷洒", "password spraying", "撞库", "credential stuffing"],
    "insider": ["内鬼", "insider", "异常下载", "权限滥用", "离职员工", "越权访问"],
}


# ─── 辅助函数 ───────────────────────────────────────────────

def _string_similarity(a: str, b: str) -> float:
    """计算两个字符串的相似度（0~1）"""
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _now_iso() -> str:
    """返回当前时间的 ISO 格式字符串"""
    return datetime.now().isoformat()


# ─── 主服务类 ───────────────────────────────────────────────

class AlertPipelineService:
    """告警预处理流水线服务"""

    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or PipelineConfig()

    # ── 主入口 ──────────────────────────────────────────────

    async def preprocess(self, alert_data: dict) -> dict:
        """
        告警预处理主入口

        流程：去噪 → 去重 → 分类 → 研判路由
        返回 PipelineResult 的字典形式
        """
        logger.info("开始预处理告警: title=%s", alert_data.get("title", "未知"))

        # 1. AI 去噪
        denoise_result = await self.denoise(alert_data)
        noise_score = denoise_result["noise_score"]
        is_noise = denoise_result["is_noise"]
        logger.info("去噪结果: noise_score=%d, is_noise=%s", noise_score, is_noise)

        # 2. 去重
        dedup_result = await self.deduplicate(alert_data)
        is_duplicate = dedup_result["is_duplicate"]
        duplicate_of = dedup_result.get("duplicate_of")
        logger.info("去重结果: is_duplicate=%s, duplicate_of=%s", is_duplicate, duplicate_of)

        # 3. 分级分类
        classify_result = await self.classify(alert_data)
        risk_level = classify_result["risk_level"]
        category = classify_result["category"]
        logger.info("分类结果: risk_level=%s, category=%s", risk_level, category)

        # 4. 分级研判路由
        route_result = await self.route_investigation(alert_data, risk_level)
        auto_investigate = route_result["auto_investigate"]
        investigation_type = route_result["investigation_type"]
        logger.info("研判路由: auto_investigate=%s, investigation_type=%s", auto_investigate, investigation_type)

        result = PipelineResult(
            original_alert=alert_data,
            noise_score=noise_score,
            is_noise=is_noise,
            is_duplicate=is_duplicate,
            duplicate_of=duplicate_of,
            risk_level=risk_level,
            category=category,
            auto_investigate=auto_investigate,
            investigation_type=investigation_type,
            processing_timestamp=_now_iso(),
        )

        logger.info("告警预处理完成: risk_level=%s, category=%s", risk_level, category)
        return result.model_dump()

    # ── AI 去噪 ─────────────────────────────────────────────

    async def denoise(self, alert_data: dict) -> dict:
        """
        AI 驱动的告警去噪

        使用 LLM 判断告警是否为噪声（误报、低价值、重复性告警）
        若 LLM 不可用，退化为基于规则的启发式判断
        """
        if llm_client.is_available:
            try:
                return await self._denoise_with_llm(alert_data)
            except Exception as e:
                logger.warning("LLM 去噪失败，退化为规则判断: %s", str(e))

        return self._denoise_with_rules(alert_data)

    async def _denoise_with_llm(self, alert_data: dict) -> dict:
        """使用 LLM 进行去噪分析"""
        prompt = f"""你是一名安全告警分析专家。请判断以下告警是否为噪声（误报、低价值、重复性告警）。

告警信息：
- 标题: {alert_data.get('title', '')}
- 描述: {alert_data.get('description', '')}
- 类型: {alert_data.get('type', '')}
- 来源: {alert_data.get('source', '')}
- 源IP: {alert_data.get('source_ip', '')}
- 目标IP: {alert_data.get('destination_ip', '')}

请返回 JSON 格式：
{{
    "noise_score": 0-100的整数，0表示绝对不是噪声，100表示确定是噪声,
    "is_noise": true或false,
    "noise_reason": "判断原因的简短说明"
}}"""

        messages = [{"role": "user", "content": prompt}]
        result = await llm_client.chat_json(messages, temperature=0.1)

        noise_score = int(result.get("noise_score", 0))
        is_noise = bool(result.get("is_noise", False))
        noise_reason = str(result.get("noise_reason", ""))

        # 用配置阈值覆盖 is_noise
        if noise_score >= self.config.noise_threshold:
            is_noise = True

        return {
            "noise_score": noise_score,
            "is_noise": is_noise,
            "noise_reason": noise_reason,
        }

    def _denoise_with_rules(self, alert_data: dict) -> dict:
        """基于规则的启发式去噪（LLM 不可用时的降级方案）"""
        title = (alert_data.get("title") or "").lower()
        description = (alert_data.get("description") or "").lower()
        combined = f"{title} {description}"

        noise_score = 0
        noise_reasons = []

        # 检查已知噪声模式
        matched_noise = [p for p in NOISE_PATTERNS if p.lower() in combined]
        if matched_noise:
            noise_score += 60
            noise_reasons.append(f"匹配噪声模式: {', '.join(matched_noise)}")

        # 检查来源是否为已知测试源
        source = (alert_data.get("source") or "").lower()
        if source in ("test", "demo", "模拟", "测试"):
            noise_score += 30
            noise_reasons.append("来源为测试/模拟系统")

        # 检查标题是否过短或无意义
        if len(title.strip()) < 4:
            noise_score += 20
            noise_reasons.append("告警标题过短")

        # 检查是否包含"已处理"或"已关闭"等状态词
        if any(kw in combined for kw in ["已处理", "已关闭", "resolved", "closed", "false positive"]):
            noise_score += 40
            noise_reasons.append("告警包含已处理/误报标识")

        noise_score = min(noise_score, 100)
        is_noise = noise_score >= self.config.noise_threshold
        noise_reason = "；".join(noise_reasons) if noise_reasons else "未匹配噪声规则"

        return {
            "noise_score": noise_score,
            "is_noise": is_noise,
            "noise_reason": noise_reason,
        }

    # ── 去重 ────────────────────────────────────────────────

    async def deduplicate(self, alert_data: dict) -> dict:
        """
        告警去重

        基于 source_ip、type、标题相似度、时间窗口（1小时）判断是否为重复告警
        """
        source_ip = alert_data.get("source_ip", "")
        alert_type = alert_data.get("type", "")
        title = alert_data.get("title", "")

        try:
            db = SessionLocal()
            try:
                # 查询最近1小时内的同类型告警
                time_window = datetime.now() - timedelta(hours=1)
                candidates = (
                    db.query(Alert)
                    .filter(
                        Alert.type == alert_type,
                        Alert.source_ip == source_ip,
                        Alert.timestamp >= time_window,
                    )
                    .order_by(Alert.timestamp.desc())
                    .limit(50)
                    .all()
                )

                best_match_id: Optional[int] = None
                best_similarity: float = 0.0

                for candidate in candidates:
                    # 计算综合相似度
                    similarity = self._calculate_similarity(
                        alert_data, candidate
                    )
                    if similarity > best_similarity:
                        best_similarity = similarity
                        best_match_id = candidate.id

                is_duplicate = best_similarity >= self.config.duplicate_similarity_threshold

                return {
                    "is_duplicate": is_duplicate,
                    "duplicate_of": best_match_id if is_duplicate else None,
                    "similarity_score": int(best_similarity * 100),
                }
            finally:
                db.close()
        except Exception as e:
            logger.warning("去重查询数据库失败: %s", str(e))
            return {
                "is_duplicate": False,
                "duplicate_of": None,
                "similarity_score": 0,
            }

    def _calculate_similarity(self, alert_data: dict, candidate: Alert) -> float:
        """计算告警与候选告警的综合相似度"""
        weights = {
            "source_ip": 0.25,
            "type": 0.20,
            "title": 0.35,
            "description": 0.20,
        }

        scores = {}

        # source_ip 完全匹配
        scores["source_ip"] = 1.0 if alert_data.get("source_ip") == candidate.source_ip else 0.0

        # type 完全匹配
        scores["type"] = 1.0 if alert_data.get("type") == candidate.type else 0.0

        # 标题相似度
        scores["title"] = _string_similarity(
            alert_data.get("title", ""), candidate.title or ""
        )

        # 描述相似度
        scores["description"] = _string_similarity(
            alert_data.get("description", ""), candidate.description or ""
        )

        return sum(scores[k] * weights[k] for k in weights)

    # ── 分级分类 ─────────────────────────────────────────────

    async def classify(self, alert_data: dict) -> dict:
        """
        告警分级分类

        分级：critical / high / medium / low（先高后低）
        分类：phishing / vpn / malware / dlp / brute_force / insider / other
        """
        if llm_client.is_available:
            try:
                return await self._classify_with_llm(alert_data)
            except Exception as e:
                logger.warning("LLM 分类失败，退化为规则判断: %s", str(e))

        return self._classify_with_rules(alert_data)

    async def _classify_with_llm(self, alert_data: dict) -> dict:
        """使用 LLM 进行分级分类"""
        prompt = f"""你是一名安全告警分级分类专家。请对以下告警进行风险分级和分类。

告警信息：
- 标题: {alert_data.get('title', '')}
- 描述: {alert_data.get('description', '')}
- 类型: {alert_data.get('type', '')}
- 来源: {alert_data.get('source', '')}
- 源IP: {alert_data.get('source_ip', '')}
- 目标IP: {alert_data.get('destination_ip', '')}

风险等级（优先判定高级别）：
- critical: 需要立即响应的严重安全事件（如勒索病毒、数据大规模泄露、0day利用）
- high: 高风险安全事件（如钓鱼攻击成功、恶意软件感染、暴力破解成功）
- medium: 中等风险事件（如可疑登录、异常流量、策略违规）
- low: 低风险事件（如策略告警、信息通知、低可疑度行为）

分类类别：phishing / vpn / malware / dlp / brute_force / insider / other

请返回 JSON 格式：
{{
    "risk_level": "critical/high/medium/low",
    "category": "phishing/vpn/malware/dlp/brute_force/insider/other",
    "confidence": 0.0-1.0的置信度,
    "key_indicators": ["关键指标1", "关键指标2"]
}}"""

        messages = [{"role": "user", "content": prompt}]
        result = await llm_client.chat_json(messages, temperature=0.1)

        risk_level = str(result.get("risk_level", "low")).lower()
        if risk_level not in ("critical", "high", "medium", "low"):
            risk_level = "low"

        category = str(result.get("category", "other")).lower()
        if category not in ("phishing", "vpn", "malware", "dlp", "brute_force", "insider", "other"):
            category = "other"

        confidence = float(result.get("confidence", 0.5))
        key_indicators = result.get("key_indicators", [])

        return {
            "risk_level": risk_level,
            "category": category,
            "confidence": confidence,
            "key_indicators": key_indicators,
        }

    def _classify_with_rules(self, alert_data: dict) -> dict:
        """基于规则的分级分类（LLM 不可用时的降级方案）"""
        title = (alert_data.get("title") or "").lower()
        description = (alert_data.get("description") or "").lower()
        combined = f"{title} {description}"
        alert_type = (alert_data.get("type") or "").lower()

        # ── 分类：匹配关键词 ──
        category = "other"
        best_category_score = 0
        for cat, keywords in CATEGORY_KEYWORDS.items():
            match_count = sum(1 for kw in keywords if kw.lower() in combined)
            if match_count > best_category_score:
                best_category_score = match_count
                category = cat

        # 如果类型字段直接匹配分类
        type_category_map = {
            "phishing": "phishing",
            "vpn": "vpn",
            "malware": "malware",
            "dlp": "dlp",
            "brute_force": "brute_force",
            "insider": "insider",
        }
        if alert_type in type_category_map:
            category = type_category_map[alert_type]

        # ── 分级：先高后低 ──
        risk_level = "low"
        key_indicators = []

        # Critical 级别
        critical_patterns = [
            "勒索", "ransomware", "0day", "zero-day", "数据大规模泄露",
            "APT", "后门", "backdoor", "webshell", "供应链攻击",
        ]
        for p in critical_patterns:
            if p.lower() in combined:
                risk_level = "critical"
                key_indicators.append(p)
                break

        # High 级别
        if risk_level == "low":
            for p in HIGH_RISK_PATTERNS:
                if p.lower() in combined:
                    risk_level = "high"
                    key_indicators.append(p)
                    break

        # Medium 级别
        if risk_level == "low":
            medium_patterns = [
                "异常", "可疑", "suspicious", "anomaly", "违规",
                "未授权", "unauthorized", "异常登录", "异常流量",
            ]
            for p in medium_patterns:
                if p.lower() in combined:
                    risk_level = "medium"
                    key_indicators.append(p)
                    break

        # 如果已有 ai_score，作为辅助参考
        ai_score = alert_data.get("ai_score")
        if ai_score is not None:
            try:
                score = float(ai_score)
                if score >= 80 and risk_level in ("low", "medium"):
                    risk_level = "high"
                elif score >= 50 and risk_level == "low":
                    risk_level = "medium"
            except (ValueError, TypeError):
                pass

        # 应用自定义分类规则
        custom_rules = self.config.classification_rules
        if custom_rules:
            for rule_key, rule_value in custom_rules.items():
                if isinstance(rule_value, list):
                    for pattern in rule_value:
                        if pattern.lower() in combined:
                            if rule_key in ("critical", "high", "medium", "low"):
                                risk_level = rule_key
                            key_indicators.append(f"自定义规则: {pattern}")
                            break

        confidence = 0.9 if key_indicators else 0.5

        return {
            "risk_level": risk_level,
            "category": category,
            "confidence": confidence,
            "key_indicators": key_indicators,
        }

    # ── 分级研判路由 ─────────────────────────────────────────

    async def route_investigation(self, alert_data: dict, risk_level: str) -> dict:
        """
        分级研判路由

        - High/Critical → 自动研判 (auto_investigate=True)
        - Medium/Low → 人工研判 (auto_investigate=False)
        """
        auto_investigate = risk_level in self.config.auto_investigate_levels

        if auto_investigate:
            investigation_type = "auto"
            assigned_to = "ai_investigator"
            strategy_id = self._select_strategy(risk_level, alert_data)
        else:
            investigation_type = "manual"
            assigned_to = "security_analyst"
            strategy_id = None

        logger.info(
            "研判路由: risk_level=%s → %s (assigned_to=%s)",
            risk_level,
            investigation_type,
            assigned_to,
        )

        return {
            "auto_investigate": auto_investigate,
            "investigation_type": investigation_type,
            "assigned_to": assigned_to,
            "strategy_id": strategy_id,
        }

    def _select_strategy(self, risk_level: str, alert_data: dict) -> str:
        """根据风险等级和告警类型选择研判策略"""
        category = (alert_data.get("type") or "").lower()

        strategy_map = {
            "phishing": "phishing_investigation",
            "vpn": "vpn_anomaly_investigation",
            "malware": "malware_containment",
            "dlp": "dlp_data_tracing",
            "brute_force": "brute_force_response",
            "insider": "insider_threat_investigation",
        }

        strategy = strategy_map.get(category, "generic_security_investigation")

        if risk_level == "critical":
            strategy = f"critical_{strategy}"

        return strategy
