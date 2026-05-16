from sqlalchemy import Column, Integer, String, Boolean, Float

from app.database import Base


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    system_name = Column(String, default="SecMind")
    session_timeout = Column(Integer, default=30)
    ip_whitelist = Column(String, default="")
    log_retention = Column(Integer, default=90)
    mfa_enabled = Column(Boolean, default=True)
    password_min_length = Column(Integer, default=12)
    ai_model = Column(String, default="gpt-4o")
    ai_temperature = Column(Float, default=0.3)
    ai_max_tokens = Column(Integer, default=4096)
    rag_enabled = Column(Boolean, default=True)
