from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DeviceBase(BaseModel):
    name: str
    type: str
    ip: str
    port: Optional[int] = None
    protocol: Optional[str] = None
    status: Optional[str] = "在线"
    log_format: Optional[str] = None
    vendor: Optional[str] = None


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    ip: Optional[str] = None
    port: Optional[int] = None
    protocol: Optional[str] = None
    status: Optional[str] = None
    log_format: Optional[str] = None
    vendor: Optional[str] = None


class DeviceRead(DeviceBase):
    id: int
    last_sync: Optional[datetime] = None

    class Config:
        from_attributes = True
