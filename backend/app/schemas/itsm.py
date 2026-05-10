from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ITSMTicketBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "待处理"
    priority: Optional[str] = None
    assignee: Optional[str] = None
    alert_id: Optional[int] = None


class ITSMTicketCreate(ITSMTicketBase):
    pass


class ITSMTicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None
    resolution: Optional[str] = None


class ITSMTicketRead(ITSMTicketBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    resolution: Optional[str] = None

    class Config:
        from_attributes = True
