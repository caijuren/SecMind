from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AlertBase(BaseModel):
    type: str
    title: str
    description: Optional[str] = None
    risk_level: str
    status: Optional[str] = "待处理"
    source: Optional[str] = None
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    raw_log: Optional[str] = None
    tags: Optional[List[str]] = None


class AlertCreate(AlertBase):
    timestamp: Optional[datetime] = None


class AlertUpdate(BaseModel):
    status: Optional[str] = None
    ai_score: Optional[float] = None
    ai_summary: Optional[str] = None
    ai_recommendation: Optional[str] = None


class AlertRead(AlertBase):
    id: int
    timestamp: Optional[datetime] = None
    ai_score: Optional[float] = None
    ai_summary: Optional[str] = None
    ai_recommendation: Optional[str] = None

    class Config:
        from_attributes = True


class AlertStatusUpdate(BaseModel):
    status: str


class AlertListResponse(BaseModel):
    total: int
    items: List[AlertRead]
