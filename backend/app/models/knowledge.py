from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class KnowledgeEntry(Base):
    """知识库条目模型"""

    __tablename__ = "knowledge_entries"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=False, index=True)  # threat_intel, playbook, case_study, best_practice, ioc
    tags = Column(JSON, default=list)
    source = Column(String, nullable=True)  # manual, ai_generated, imported
    severity = Column(String, nullable=True)  # critical, high, medium, low, info
    related_iocs = Column(JSON, default=list)  # 关联的IOC指标列表
    related_mitre = Column(JSON, default=list)  # MITRE ATT&CK 技术ID列表
    confidence = Column(Float, default=0.0)
    reference_count = Column(Integer, default=0)  # 在调查中被引用的次数
    is_verified = Column(Integer, default=0)  # 0=未验证, 1=已验证
    verified_by = Column(String, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
