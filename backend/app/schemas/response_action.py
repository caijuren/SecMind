from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class ResponseActionBase(BaseModel):
    name: str
    action_type: str
    target: str
    priority: Optional[str] = "medium"
    alert_id: Optional[int] = None
    hypothesis_id: Optional[str] = None
    hypothesis_label: Optional[str] = None
    hypothesis_confidence: Optional[float] = None
    requested_by: Optional[str] = "AI引擎"
    ai_reasoning: Optional[str] = None
    reasoning_chain: Optional[List[Any]] = None
    evidence_summary: Optional[Any] = None
    guardrails: Optional[Any] = None


class ResponseActionCreate(ResponseActionBase):
    pass


class ResponseActionUpdate(BaseModel):
    name: Optional[str] = None
    priority: Optional[str] = None
    ai_reasoning: Optional[str] = None
    reasoning_chain: Optional[List[Any]] = None
    evidence_summary: Optional[Any] = None
    guardrails: Optional[Any] = None


class ResponseActionRead(ResponseActionBase):
    id: int
    status: str
    result: Optional[str] = None
    executed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    cancelled_by: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    cancel_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ResponseActionListResponse(BaseModel):
    total: int
    items: List[ResponseActionRead]


class ActionExecuteRequest(BaseModel):
    pass


class ActionApproveRequest(BaseModel):
    approved_by: str


class ActionCancelRequest(BaseModel):
    cancelled_by: str
    reason: Optional[str] = None


class ActionResultRequest(BaseModel):
    result: Optional[str] = None


class ResponseActionStats(BaseModel):
    total: int
    by_status: dict
    by_priority: dict
    by_action_type: dict
