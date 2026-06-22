import json
import logging
from typing import Optional
from datetime import datetime

from sqlalchemy import func as sa_func

from app.database import SessionLocal
from app.models.knowledge import KnowledgeEntry
from app.services.llm_client import llm_client

logger = logging.getLogger(__name__)

# 示例种子数据，用于演示
_SEED_DATA = [
    {
        "title": "Cobalt Strike Beacon 通信特征识别",
        "content": "Cobalt Strike Beacon 通常使用HTTPS协议与C2服务器通信，特征包括：1) 固定的URI路径模式（如/aaaa、/bbbb等）；2) Jitter值通常在0-37%之间；3) 默认使用JA3指纹；4) HTTP GET请求中携带元数据；5) HTTP POST请求中携带任务输出。检测建议：监控异常的定期HTTPS连接、分析JA3指纹、检查Beacon心跳模式。",
        "category": "threat_intel",
        "tags": ["cobalt_strike", "c2", "beacon", "威胁情报"],
        "source": "manual",
        "severity": "high",
        "related_iocs": [],
        "related_mitre": ["T1071.001", "T1573.002", "T1059.001"],
        "confidence": 0.92,
        "is_verified": 1,
        "verified_by": "security_admin",
        "created_by": "security_admin",
    },
    {
        "title": "勒索软件应急响应标准流程",
        "content": "勒索软件事件应急响应标准操作流程：\n1. 隔离：立即隔离受感染主机，断开网络连接\n2. 保留：保留现场证据，不要急于清除或重启\n3. 识别：确定勒索软件家族，分析加密方式\n4. 遏制：检查横向移动痕迹，隔离相关账户\n5. 恢复：从备份恢复数据，验证备份完整性\n6. 总结：编写事件报告，更新防护策略\n注意事项：切勿支付赎金，优先保护未感染系统。",
        "category": "playbook",
        "tags": ["勒索软件", "应急响应", "标准流程"],
        "source": "manual",
        "severity": "critical",
        "related_iocs": [],
        "related_mitre": ["T1486", "T1490"],
        "confidence": 0.95,
        "is_verified": 1,
        "verified_by": "security_admin",
        "created_by": "security_admin",
    },
    {
        "title": "某金融机构APT攻击案例分析",
        "content": "2024年某金融机构遭受APT攻击案例分析：\n攻击链：鱼叉式钓鱼邮件 → 宏文档投递 → PowerShell下载器 → Cobalt Strike植入 → 内网横向移动 → 数据窃取\n攻击者使用了自定义的PowerShell加载器，通过DNS隧道进行C2通信，利用WMI进行横向移动。\n关键IOC：\n- C2域名：update-service[.]example[.]com\n- 文件哈希：a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4\n- MITRE ATT&CK: T1566.001, T1059.001, T1071.004, T1047\n经验教训：加强邮件安全网关、部署DNS监控、启用WMI事件日志。",
        "category": "case_study",
        "tags": ["APT", "金融", "钓鱼攻击", "横向移动"],
        "source": "manual",
        "severity": "critical",
        "related_iocs": ["update-service.example.com", "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"],
        "related_mitre": ["T1566.001", "T1059.001", "T1071.004", "T1047"],
        "confidence": 0.88,
        "is_verified": 1,
        "verified_by": "analyst_01",
        "created_by": "analyst_01",
    },
    {
        "title": "安全日志收集最佳实践",
        "content": "安全日志收集与管理的最佳实践：\n1. 日志源覆盖：确保覆盖所有关键系统（AD、防火墙、EDR、邮件网关等）\n2. 日志格式：统一使用CEF或JSON格式，便于解析\n3. 时间同步：所有系统使用NTP同步时间，确保日志时间戳一致\n4. 保留策略：热数据30天，温数据90天，冷数据1年\n5. 告警关联：建立跨设备日志关联规则\n6. 完整性保护：使用日志哈希或数字签名防止篡改\n7. 合规要求：满足等保2.0和GDPR日志保留要求",
        "category": "best_practice",
        "tags": ["日志管理", "最佳实践", "合规"],
        "source": "manual",
        "severity": "medium",
        "related_iocs": [],
        "related_mitre": ["T1070", "T1562.002"],
        "confidence": 0.90,
        "is_verified": 1,
        "verified_by": "security_admin",
        "created_by": "security_admin",
    },
    {
        "title": "Emotet恶意软件IOC情报",
        "content": "Emotet银行木马最新IOC情报（2024年12月更新）：\nC2服务器IP列表：\n- 203.0.113[.]45\n- 198.51.100[.]78\n- 192.0.2[.]123\n恶意域名：\n- service-update[.]malware-domain[.]com\n- secure-login[.]phishing-site[.]net\n文件哈希（SHA256）：\n- e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n传播方式：钓鱼邮件附带恶意宏文档、恶意链接\n关联恶意软件：TrickBot、QakBot、Ryuk勒索软件",
        "category": "ioc",
        "tags": ["emotet", "木马", "IOC", "银行木马"],
        "source": "imported",
        "severity": "high",
        "related_iocs": ["203.0.113.45", "198.51.100.78", "192.0.2.123", "service-update.malware-domain.com", "secure-login.phishing-site.net"],
        "related_mitre": ["T1566.001", "T1204.002", "T1105"],
        "confidence": 0.85,
        "is_verified": 0,
        "verified_by": None,
        "created_by": "threat_intel_bot",
    },
]


def _entry_to_dict(entry: KnowledgeEntry) -> dict:
    """将ORM对象转换为字典"""
    return {
        "id": entry.id,
        "tenant_id": entry.tenant_id,
        "title": entry.title,
        "content": entry.content,
        "category": entry.category,
        "tags": entry.tags or [],
        "source": entry.source,
        "severity": entry.severity,
        "related_iocs": entry.related_iocs or [],
        "related_mitre": entry.related_mitre or [],
        "confidence": entry.confidence,
        "reference_count": entry.reference_count,
        "is_verified": entry.is_verified,
        "verified_by": entry.verified_by,
        "created_by": entry.created_by,
        "created_at": entry.created_at.isoformat() if entry.created_at else None,
        "updated_at": entry.updated_at.isoformat() if entry.updated_at else None,
    }


class KnowledgeService:
    """知识库服务，提供知识条目的增删改查、搜索和相似案例匹配"""

    @staticmethod
    async def search(query: str, category: str = None, limit: int = 20) -> list[dict]:
        """搜索知识库 - 使用简单文本匹配，LLM可用时回退到语义搜索"""
        with SessionLocal() as db:
            # 先进行数据库文本匹配搜索
            q = db.query(KnowledgeEntry)
            if category:
                q = q.filter(KnowledgeEntry.category == category)

            # 简单文本匹配：标题或内容包含关键词
            keyword = f"%{query}%"
            q = q.filter(
                (KnowledgeEntry.title.ilike(keyword))
                | (KnowledgeEntry.content.ilike(keyword))
            )
            q = q.order_by(KnowledgeEntry.reference_count.desc(), KnowledgeEntry.created_at.desc())
            entries = q.limit(limit).all()
            results = [_entry_to_dict(e) for e in entries]

            # 如果文本匹配结果不足且LLM可用，尝试语义搜索
            if len(results) < limit and llm_client.is_available:
                try:
                    semantic_results = await KnowledgeService._semantic_search(
                        db, query, category, limit - len(results)
                    )
                    # 去重：排除已有的ID
                    existing_ids = {r["id"] for r in results}
                    for r in semantic_results:
                        if r["id"] not in existing_ids:
                            results.append(r)
                except Exception as e:
                    logger.warning("语义搜索失败，仅使用文本匹配结果: %s", e)

            return results

    @staticmethod
    async def _semantic_search(
        db, query: str, category: str, limit: int
    ) -> list[dict]:
        """使用LLM进行语义搜索"""
        # 获取候选条目（排除已匹配的）
        q = db.query(KnowledgeEntry)
        if category:
            q = q.filter(KnowledgeEntry.category == category)

        candidates = q.order_by(KnowledgeEntry.created_at.desc()).limit(100).all()
        if not candidates:
            return []

        # 构建摘要列表供LLM判断相关性
        summaries = []
        for c in candidates:
            summaries.append({
                "id": c.id,
                "title": c.title,
                "category": c.category,
                "tags": c.tags or [],
                "content_preview": c.content[:200] if c.content else "",
            })

        messages = [
            {
                "role": "system",
                "content": "你是一个安全知识库搜索助手。根据用户的搜索查询，从给定的知识条目列表中找出语义相关的条目ID。返回JSON格式的ID列表，按相关性从高到低排序。",
            },
            {
                "role": "user",
                "content": f"搜索查询: {query}\n\n知识条目列表:\n{json.dumps(summaries, ensure_ascii=False)}\n\n请返回最相关的{limit}个条目ID，格式: {{\"ids\": [1, 2, 3]}}",
            },
        ]

        result = await llm_client.chat_json(messages, temperature=0.1)
        matched_ids = result.get("ids", [])

        if not matched_ids:
            return []

        # 根据LLM返回的ID查询完整条目
        matched_entries = (
            db.query(KnowledgeEntry)
            .filter(KnowledgeEntry.id.in_(matched_ids))
            .all()
        )
        # 按LLM返回的顺序排列
        entry_map = {e.id: e for e in matched_entries}
        ordered = []
        for mid in matched_ids:
            if mid in entry_map:
                ordered.append(_entry_to_dict(entry_map[mid]))

        return ordered[:limit]

    @staticmethod
    async def find_similar_cases(alert_data: dict, limit: int = 5) -> list[dict]:
        """查找历史相似的告警/案例 - 使用LLM进行相似度匹配"""
        with SessionLocal() as db:
            # 获取案例类型的条目作为候选
            candidates = (
                db.query(KnowledgeEntry)
                .filter(KnowledgeEntry.category.in_(["case_study", "threat_intel", "ioc"]))
                .order_by(KnowledgeEntry.created_at.desc())
                .limit(50)
                .all()
            )

            if not candidates:
                return []

            if not llm_client.is_available:
                # LLM不可用时，基于关键词简单匹配
                alert_text = json.dumps(alert_data, ensure_ascii=False).lower()
                scored = []
                for c in candidates:
                    score = 0
                    # 匹配IOC
                    for ioc in (c.related_iocs or []):
                        if ioc.lower() in alert_text:
                            score += 10
                    # 匹配MITRE技术
                    for mitre in (c.related_mitre or []):
                        if mitre.lower() in alert_text:
                            score += 5
                    # 匹配标签
                    for tag in (c.tags or []):
                        if tag.lower() in alert_text:
                            score += 3
                    if score > 0:
                        scored.append((score, c))

                scored.sort(key=lambda x: x[0], reverse=True)
                return [_entry_to_dict(c) for _, c in scored[:limit]]

            # LLM可用时，进行语义相似度匹配
            summaries = []
            for c in candidates:
                summaries.append({
                    "id": c.id,
                    "title": c.title,
                    "category": c.category,
                    "tags": c.tags or [],
                    "related_iocs": c.related_iocs or [],
                    "related_mitre": c.related_mitre or [],
                    "content_preview": c.content[:300] if c.content else "",
                })

            messages = [
                {
                    "role": "system",
                    "content": "你是一个安全分析助手。根据告警数据，从历史案例中找出最相似的案例。考虑攻击手法、IOC、MITRE ATT&CK技术等因素进行匹配。返回JSON格式的ID列表，按相似度从高到低排序。",
                },
                {
                    "role": "user",
                    "content": f"告警数据:\n{json.dumps(alert_data, ensure_ascii=False)}\n\n历史案例列表:\n{json.dumps(summaries, ensure_ascii=False)}\n\n请返回最相似的{limit}个案例ID，格式: {{\"ids\": [1, 2, 3]}}",
                },
            ]

            result = await llm_client.chat_json(messages, temperature=0.1)
            matched_ids = result.get("ids", [])

            if not matched_ids:
                return []

            matched_entries = (
                db.query(KnowledgeEntry)
                .filter(KnowledgeEntry.id.in_(matched_ids))
                .all()
            )
            entry_map = {e.id: e for e in matched_entries}
            ordered = []
            for mid in matched_ids:
                if mid in entry_map:
                    ordered.append(_entry_to_dict(entry_map[mid]))

            return ordered[:limit]

    @staticmethod
    async def create_entry(data: dict) -> dict:
        """创建新的知识条目"""
        with SessionLocal() as db:
            entry = KnowledgeEntry(
                tenant_id=data.get("tenant_id"),
                title=data["title"],
                content=data["content"],
                category=data["category"],
                tags=data.get("tags", []),
                source=data.get("source", "manual"),
                severity=data.get("severity"),
                related_iocs=data.get("related_iocs", []),
                related_mitre=data.get("related_mitre", []),
                confidence=data.get("confidence", 0.0),
                created_by=data.get("created_by"),
            )
            db.add(entry)
            db.commit()
            db.refresh(entry)
            return _entry_to_dict(entry)

    @staticmethod
    async def update_entry(entry_id: int, data: dict) -> dict:
        """更新知识条目"""
        with SessionLocal() as db:
            entry = db.query(KnowledgeEntry).filter(KnowledgeEntry.id == entry_id).first()
            if not entry:
                raise ValueError(f"知识条目不存在: {entry_id}")

            # 更新允许修改的字段
            updatable_fields = [
                "title", "content", "category", "tags", "source",
                "severity", "related_iocs", "related_mitre", "confidence",
            ]
            for field in updatable_fields:
                if field in data:
                    setattr(entry, field, data[field])

            db.commit()
            db.refresh(entry)
            return _entry_to_dict(entry)

    @staticmethod
    async def delete_entry(entry_id: int) -> bool:
        """删除知识条目"""
        with SessionLocal() as db:
            entry = db.query(KnowledgeEntry).filter(KnowledgeEntry.id == entry_id).first()
            if not entry:
                return False
            db.delete(entry)
            db.commit()
            return True

    @staticmethod
    async def get_stats() -> dict:
        """获取知识库统计信息"""
        with SessionLocal() as db:
            total = db.query(sa_func.count(KnowledgeEntry.id)).scalar() or 0
            verified = db.query(sa_func.count(KnowledgeEntry.id)).filter(
                KnowledgeEntry.is_verified == 1
            ).scalar() or 0

            # 按分类统计
            category_counts = {}
            rows = db.query(
                KnowledgeEntry.category,
                sa_func.count(KnowledgeEntry.id),
            ).group_by(KnowledgeEntry.category).all()
            for cat, cnt in rows:
                category_counts[cat] = cnt

            # 按严重程度统计
            severity_counts = {}
            rows = db.query(
                KnowledgeEntry.severity,
                sa_func.count(KnowledgeEntry.id),
            ).group_by(KnowledgeEntry.severity).all()
            for sev, cnt in rows:
                if sev:
                    severity_counts[sev] = cnt

            # 按来源统计
            source_counts = {}
            rows = db.query(
                KnowledgeEntry.source,
                sa_func.count(KnowledgeEntry.id),
            ).group_by(KnowledgeEntry.source).all()
            for src, cnt in rows:
                if src:
                    source_counts[src] = cnt

            # 总引用次数
            total_references = db.query(
                sa_func.sum(KnowledgeEntry.reference_count)
            ).scalar() or 0

            return {
                "total": total,
                "verified": verified,
                "unverified": total - verified,
                "category_counts": category_counts,
                "severity_counts": severity_counts,
                "source_counts": source_counts,
                "total_references": total_references,
            }

    @staticmethod
    async def increment_reference(entry_id: int) -> None:
        """在调查中引用时增加引用计数"""
        with SessionLocal() as db:
            entry = db.query(KnowledgeEntry).filter(KnowledgeEntry.id == entry_id).first()
            if entry:
                entry.reference_count = (entry.reference_count or 0) + 1
                db.commit()

    @staticmethod
    async def list_entries(
        category: str = None,
        search: str = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        """分页列出知识条目"""
        with SessionLocal() as db:
            q = db.query(KnowledgeEntry)

            if category:
                q = q.filter(KnowledgeEntry.category == category)

            if search:
                keyword = f"%{search}%"
                q = q.filter(
                    (KnowledgeEntry.title.ilike(keyword))
                    | (KnowledgeEntry.content.ilike(keyword))
                )

            total = q.count()

            entries = (
                q.order_by(KnowledgeEntry.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
                .all()
            )

            return {
                "total": total,
                "page": page,
                "page_size": page_size,
                "items": [_entry_to_dict(e) for e in entries],
            }

    @staticmethod
    async def get_entry(entry_id: int) -> Optional[dict]:
        """获取单个知识条目"""
        with SessionLocal() as db:
            entry = db.query(KnowledgeEntry).filter(KnowledgeEntry.id == entry_id).first()
            if not entry:
                return None
            return _entry_to_dict(entry)

    @staticmethod
    async def verify_entry(entry_id: int, verified_by: str) -> Optional[dict]:
        """验证知识条目"""
        with SessionLocal() as db:
            entry = db.query(KnowledgeEntry).filter(KnowledgeEntry.id == entry_id).first()
            if not entry:
                return None
            entry.is_verified = 1
            entry.verified_by = verified_by
            db.commit()
            db.refresh(entry)
            return _entry_to_dict(entry)

    @staticmethod
    async def seed() -> dict:
        """使用示例数据初始化知识库（用于演示）"""
        with SessionLocal() as db:
            # 检查是否已有数据
            existing = db.query(sa_func.count(KnowledgeEntry.id)).scalar() or 0
            if existing > 0:
                return {"message": f"知识库已有 {existing} 条数据，跳过初始化", "seeded": 0}

            count = 0
            for item in _SEED_DATA:
                entry = KnowledgeEntry(**item)
                db.add(entry)
                count += 1

            db.commit()
            return {"message": f"成功初始化 {count} 条示例数据", "seeded": count}


knowledge_service = KnowledgeService()
