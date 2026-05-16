from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, func, ForeignKey

from app.database import Base


class Playbook(Base):
    __tablename__ = "playbooks"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    trigger = Column(String, nullable=True)
    steps = Column(Integer, nullable=False, default=0)
    executions = Column(Integer, nullable=False, default=0)
    last_execution = Column(DateTime, nullable=True)
    status = Column(String, nullable=False, default="enabled", index=True)
    nodes = Column(JSON, nullable=True)
    edges = Column(JSON, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
