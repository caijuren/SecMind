from sqlalchemy import Column, Integer, String, Float, Text, JSON, DateTime, ForeignKey

from app.database import Base


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"))
    conclusion = Column(Text)
    risk_score = Column(Float)
    risk_level = Column(String)
    attack_chain = Column(JSON)
    recommendations = Column(JSON)
    related_events = Column(JSON)
    reasoning_chain = Column(JSON)
    evidence_summary = Column(JSON)
    user_context = Column(Text, nullable=True)
    timestamp = Column(DateTime)
    agent_type = Column(String, default="综合分析")
