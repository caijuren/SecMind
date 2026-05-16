from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, func

from app.database import Base


class HuntingHypothesis(Base):
    __tablename__ = "hunting_hypotheses"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    tactic = Column(String, nullable=False, index=True)
    technique = Column(String, nullable=True)
    technique_id = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="验证中", index=True)
    confidence = Column(Float, nullable=False, default=50.0)
    ioc_count = Column(Integer, nullable=False, default=0)
    related_ioc = Column(Text, nullable=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
