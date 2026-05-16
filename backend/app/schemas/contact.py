from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class ContactCreate(BaseModel):
    name: str
    company: Optional[str] = None
    email: str
    phone: Optional[str] = None
    message: Optional[str] = None


class ContactRead(BaseModel):
    id: int
    name: str
    company: Optional[str] = None
    email: str
    phone: Optional[str] = None
    message: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
