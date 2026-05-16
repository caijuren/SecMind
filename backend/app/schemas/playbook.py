from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class PlaybookBase(BaseModel):
    name: str
    description: Optional[str] = None
    trigger: Optional[str] = None
    steps: Optional[int] = 0
    executions: Optional[int] = 0
    status: Optional[str] = "enabled"
    nodes: Optional[List[Any]] = None
    edges: Optional[List[Any]] = None
    created_by: Optional[str] = None


class PlaybookCreate(PlaybookBase):
    pass


class PlaybookUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger: Optional[str] = None
    steps: Optional[int] = None
    executions: Optional[int] = None
    status: Optional[str] = None
    nodes: Optional[List[Any]] = None
    edges: Optional[List[Any]] = None


class PlaybookRead(PlaybookBase):
    id: int
    last_execution: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PlaybookListResponse(BaseModel):
    total: int
    items: List[PlaybookRead]


class PlaybookStats(BaseModel):
    total: int
    by_status: dict
