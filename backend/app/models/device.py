from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey

from app.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    name = Column(String)
    type = Column(String)
    brand = Column(String)
    model = Column(String)
    ip = Column(String)
    port = Column(Integer)
    protocol = Column(String)
    status = Column(String, default="online")
    last_sync = Column(DateTime)
    log_format = Column(String)
    vendor = Column(String)
    log_level = Column(String, nullable=True)
    direction = Column(String, nullable=True)
    daily_volume = Column(Integer, default=0)
    health = Column(Integer, default=0)
    protocol_config = Column(JSON, nullable=True)
