from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, func, ForeignKey

from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
    format = Column(String, nullable=False, default="markdown")
    order = Column(Integer, default=0)
    status = Column(String, nullable=False, default="draft", index=True)
    author = Column(String, nullable=True)
    tags = Column(JSON, nullable=True)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
