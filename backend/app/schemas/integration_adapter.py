from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime


class AdapterCreate(BaseModel):
    name: str
    adapter_type: str
    vendor: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Any] = None


class AdapterUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[Any] = None
    status: Optional[str] = None


class AdapterRead(BaseModel):
    id: int
    name: str
    adapter_type: str
    vendor: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Any] = None
    status: str
    last_sync: Optional[datetime] = None
    events_received: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WebhookInboundRead(BaseModel):
    id: int
    source: str
    event_type: str
    payload: Optional[Any] = None
    processed: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WebhookInboundCreate(BaseModel):
    source: str
    event_type: str
    payload: Optional[Any] = None
