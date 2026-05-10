from sqlalchemy import Column, Integer, String, DateTime

from app.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)
    ip = Column(String)
    port = Column(Integer)
    protocol = Column(String)
    status = Column(String, default="在线")
    last_sync = Column(DateTime)
    log_format = Column(String)
    vendor = Column(String)
