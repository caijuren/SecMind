from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class OrderCreate(BaseModel):
    plan: str
    payment_method: Optional[str] = None
    metadata_: Optional[Any] = None


class OrderRead(BaseModel):
    id: int
    tenant_id: int
    order_no: str
    plan: str
    amount: float
    currency: str
    status: str
    payment_method: Optional[str] = None
    paid_at: Optional[datetime] = None
    metadata_: Optional[Any] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InvoiceRead(BaseModel):
    id: int
    tenant_id: int
    order_id: int
    invoice_no: str
    title: str
    amount: float
    tax_rate: float
    tax_amount: Optional[float] = None
    total_amount: Optional[float] = None
    status: str
    buyer_name: Optional[str] = None
    buyer_tax_no: Optional[str] = None
    issued_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InvoiceRequest(BaseModel):
    title: Optional[str] = None
    buyer_name: Optional[str] = None
    buyer_tax_no: Optional[str] = None


class ConversionPreview(BaseModel):
    current_plan: str
    target_plan: str
    current_price: float
    target_price: float
    proration_days: int
    proration_amount: float
    total_amount: float


class TrialStatus(BaseModel):
    is_trial: bool
    trial_ends_at: Optional[datetime] = None
    days_remaining: int
    is_expired: bool
    plan: str
