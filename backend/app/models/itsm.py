from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey

from app.database import Base


class ITSMTicket(Base):
    __tablename__ = "itsm_tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    status = Column(String, default="待处理")
    priority = Column(String)
    assignee = Column(String)
    alert_id = Column(Integer, ForeignKey("alerts.id"))
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    resolution = Column(Text, nullable=True)
