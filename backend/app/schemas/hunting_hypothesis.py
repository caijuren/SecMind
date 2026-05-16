from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class HuntingHypothesisBase(BaseModel):
    name: str
    tactic: str
    technique: Optional[str] = None
    technique_id: Optional[str] = None
    description: Optional[str] = None
    confidence: Optional[float] = 50.0
    related_ioc: Optional[str] = None
    alert_id: Optional[int] = None
    created_by: Optional[str] = None


class HuntingHypothesisCreate(HuntingHypothesisBase):
    pass


class HuntingHypothesisUpdate(BaseModel):
    name: Optional[str] = None
    tactic: Optional[str] = None
    technique: Optional[str] = None
    technique_id: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    confidence: Optional[float] = None
    ioc_count: Optional[int] = None
    related_ioc: Optional[str] = None


class HuntingHypothesisRead(HuntingHypothesisBase):
    id: int
    status: str
    ioc_count: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class HuntingHypothesisListResponse(BaseModel):
    total: int
    items: List[HuntingHypothesisRead]


class HuntingHypothesisStats(BaseModel):
    total: int
    by_status: dict
    by_tactic: dict
