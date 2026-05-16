from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class ChatSessionCreate(BaseModel):
    title: Optional[str] = "新对话"
    alert_id: Optional[int] = None


class ChatSessionRead(BaseModel):
    id: int
    user_id: int
    title: str
    alert_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageRead(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    tool_calls: Optional[List[Any]] = None
    tool_results: Optional[List[Any]] = None
    confidence: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChatSessionDetail(ChatSessionRead):
    messages: List[ChatMessageRead] = []


class ReportCreate(BaseModel):
    name: str
    description: Optional[str] = None
    report_type: Optional[str] = "custom"
    config: Optional[Any] = None
    time_range_start: Optional[datetime] = None
    time_range_end: Optional[datetime] = None


class ReportUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Any] = None
    status: Optional[str] = None
    time_range_start: Optional[datetime] = None
    time_range_end: Optional[datetime] = None


class ReportRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    report_type: str
    config: Optional[Any] = None
    time_range_start: Optional[datetime] = None
    time_range_end: Optional[datetime] = None
    status: str
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReportListResponse(BaseModel):
    total: int
    items: List[ReportRead]
