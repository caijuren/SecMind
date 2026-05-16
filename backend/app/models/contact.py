from sqlalchemy import Column, Integer, String, Text, DateTime, func

from app.database import Base


class ContactSubmission(Base):
    __tablename__ = "contact_submissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    company = Column(String, nullable=True)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="new", index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
