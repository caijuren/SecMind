from typing import Dict
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DeviceBase(BaseModel):
    name: str
    type: str
    brand: Optional[str] = None
    model: Optional[str] = None
    ip: str
    port: Optional[int] = None
    protocol: Optional[str] = None
    status: Optional[str] = "online"
    log_format: Optional[str] = None
    vendor: Optional[str] = None
    log_level: Optional[str] = None
    direction: Optional[str] = None
    daily_volume: Optional[int] = 0
    health: Optional[int] = 0
    protocol_config: Optional[Dict[str, str]] = None


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    ip: Optional[str] = None
    port: Optional[int] = None
    protocol: Optional[str] = None
    status: Optional[str] = None
    log_format: Optional[str] = None
    vendor: Optional[str] = None
    log_level: Optional[str] = None
    direction: Optional[str] = None
    daily_volume: Optional[int] = None
    health: Optional[int] = None
    protocol_config: Optional[Dict[str, str]] = None


class DeviceRead(DeviceBase):
    id: int
    last_sync: Optional[datetime] = None

    class Config:
        from_attributes = True
