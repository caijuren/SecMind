from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey, Float, func
from sqlalchemy.orm import relationship

from app.database import Base


class ResponseAction(Base):
    __tablename__ = "response_actions"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    action_type = Column(String, nullable=False, index=True)
    target = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending", index=True)
    priority = Column(String, nullable=False, default="medium")
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    hypothesis_id = Column(String, nullable=True)
    hypothesis_label = Column(String, nullable=True)
    hypothesis_confidence = Column(Float, nullable=True)
    requested_by = Column(String, nullable=False, default="AI引擎")
    ai_reasoning = Column(Text, nullable=True)
    reasoning_chain = Column(JSON, nullable=True)
    evidence_summary = Column(JSON, nullable=True)
    guardrails = Column(JSON, nullable=True)
    result = Column(Text, nullable=True)
    executed_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    cancelled_by = Column(String, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancel_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    alert = relationship("Alert", backref="response_actions")


VALID_TRANSITIONS = {
    "pending": ["executing", "awaiting_approval", "cancelled"],
    "awaiting_approval": ["approved", "cancelled"],
    "approved": ["executing"],
    "executing": ["completed", "failed"],
    "completed": [],
    "failed": ["pending"],
    "cancelled": [],
}
