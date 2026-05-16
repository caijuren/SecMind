from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, func

from app.database import Base


class IntegrationAdapter(Base):
    __tablename__ = "integration_adapters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    adapter_type = Column(String, nullable=False, index=True)
    vendor = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    config = Column(JSON, nullable=True)
    status = Column(String, nullable=False, default="disconnected", index=True)
    last_sync = Column(DateTime, nullable=True)
    events_received = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class WebhookInbound(Base):
    __tablename__ = "webhook_inbound"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False, index=True)
    event_type = Column(String, nullable=False)
    payload = Column(JSON, nullable=True)
    processed = Column(Integer, default=0, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
