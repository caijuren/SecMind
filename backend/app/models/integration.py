from sqlalchemy import Column, Integer, String, Boolean, JSON

from app.database import Base


class IntegrationApp(Base):
    __tablename__ = "integration_apps"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True)
    name = Column(String)
    description = Column(String)
    category = Column(String, nullable=True)
    status = Column(String, default="disconnected")
    color = Column(String, nullable=True)
    last_sync = Column(String, nullable=True)
    api_url = Column(String, nullable=True)
    api_key = Column(String, nullable=True)
    sync_frequency = Column(String, default="15min")
    source = Column(String, default="integrated")


class Webhook(Base):
    __tablename__ = "webhooks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    url = Column(String)
    events = Column(JSON, default=list)
    active = Column(Boolean, default=True)
    created_at = Column(String)
