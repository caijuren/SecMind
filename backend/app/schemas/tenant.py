from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime


class TenantCreate(BaseModel):
    name: str
    slug: str
    owner_email: str
    owner_name: Optional[str] = None
    plan: Optional[str] = "free"


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None
    status: Optional[str] = None
    max_users: Optional[int] = None
    max_alerts_per_day: Optional[int] = None
    max_api_calls_per_day: Optional[int] = None
    settings: Optional[Any] = None


class TenantRead(BaseModel):
    id: int
    name: str
    slug: str
    plan: str
    status: str
    max_users: int
    max_alerts_per_day: int
    max_api_calls_per_day: int
    owner_email: str
    owner_name: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TenantMemberRead(BaseModel):
    id: int
    tenant_id: int
    user_id: int
    role: str
    joined_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TenantMemberAdd(BaseModel):
    user_id: int
    role: Optional[str] = "member"


class SubscriptionRead(BaseModel):
    id: int
    tenant_id: int
    plan: str
    status: str
    trial_ends_at: Optional[datetime] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SubscriptionCreate(BaseModel):
    plan: str
    payment_method: Optional[str] = None


class UsageRead(BaseModel):
    id: int
    tenant_id: int
    metric: str
    value: int
    period: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TenantQuota(BaseModel):
    plan: str
    max_users: int
    max_alerts_per_day: int
    max_api_calls_per_day: int
    current_users: int
    current_alerts_today: int
    current_api_calls_today: int
