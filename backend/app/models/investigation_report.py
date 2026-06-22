from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class InvestigationReportDB(Base):
    """研判报告数据库模型"""
    __tablename__ = "investigation_reports"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    title = Column(String)
    verdict = Column(String)
    severity = Column(String)
    confidence = Column(Integer)
    impact_data = Column(JSON)       # 序列化的 ImpactAnalysis
    conclusion_data = Column(JSON)   # 序列化的 Conclusion
    recommendations_data = Column(JSON)  # 序列化的 list[Recommendation]
    report_data = Column(JSON)       # 完整报告
    created_at = Column(DateTime, server_default=func.now())
