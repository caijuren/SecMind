from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime


class DocumentCreate(BaseModel):
    title: str
    slug: str
    category: str
    content: str
    format: Optional[str] = "markdown"
    order: Optional[int] = 0
    status: Optional[str] = "draft"
    author: Optional[str] = None
    tags: Optional[List[str]] = None


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None
    format: Optional[str] = None
    order: Optional[int] = None
    status: Optional[str] = None
    author: Optional[str] = None
    tags: Optional[List[str]] = None


class DocumentRead(BaseModel):
    id: int
    title: str
    slug: str
    category: str
    content: str
    format: str
    order: int
    status: str
    author: Optional[str] = None
    tags: Optional[List[str]] = None
    version: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocumentSummary(BaseModel):
    id: int
    title: str
    slug: str
    category: str
    order: int
    status: str
    author: Optional[str] = None
    tags: Optional[List[str]] = None
    version: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ApiEndpoint(BaseModel):
    method: str
    path: str
    summary: str
    tags: List[str]
