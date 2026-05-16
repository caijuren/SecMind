from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CommentCreate(BaseModel):
    alert_id: Optional[int] = None
    content: str
    mentions: Optional[List[str]] = None
    parent_id: Optional[int] = None


class CommentRead(BaseModel):
    id: int
    alert_id: Optional[int] = None
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    content: str
    mentions: Optional[List[str]] = None
    parent_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationRead(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    content: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    is_read: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationStats(BaseModel):
    total: int
    unread: int
