from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, nullable=True)
    department = Column(String)
    position = Column(String)
    level = Column(String)
    manager = Column(String)
    is_sensitive = Column(Boolean, default=False)
    office = Column(String)
    recent_login_location = Column(String)
    is_on_leave = Column(Boolean, default=False)
    is_resigned = Column(Boolean, default=False)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user")
    status = Column(String, default="active")
    avatar_url = Column(String, nullable=True)
    last_login = Column(DateTime, default=datetime.utcnow)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    refresh_token = Column(String, nullable=True)
