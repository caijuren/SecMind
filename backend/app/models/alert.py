from sqlalchemy import Column, Integer, String, Float, Text, JSON, DateTime, ForeignKey

from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    type = Column(String, index=True)
    title = Column(String)
    description = Column(Text)
    risk_level = Column(String, index=True)
    status = Column(String, index=True, default="待处理")
    source = Column(String)
    source_ip = Column(String)
    destination_ip = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))
    user_name = Column(String)
    timestamp = Column(DateTime)
    raw_log = Column(Text)
    tags = Column(JSON)
    ai_score = Column(Float, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_recommendation = Column(Text, nullable=True)
