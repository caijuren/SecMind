from sqlalchemy import Column, Integer, String, Boolean

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
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
