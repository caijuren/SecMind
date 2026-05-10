from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class EvidenceRef(BaseModel):
    source: str
    timestamp: str
    detail: str
    direction: str


class ReasoningStep(BaseModel):
    phase: str
    title: str
    description: str
    evidence: List[EvidenceRef] = []
    mitre_ref: Optional[str] = None
    confidence_delta: Optional[float] = None
    conclusion: str


class EvidenceSummary(BaseModel):
    supporting: int = 0
    contradicting: int = 0
    neutral: int = 0


class AIAnalysisBase(BaseModel):
    alert_id: int
    conclusion: Optional[str] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    attack_chain: Optional[List[Dict[str, Any]]] = None
    recommendations: Optional[List[str]] = None
    related_events: Optional[List[Dict[str, Any]]] = None
    reasoning_chain: Optional[List[ReasoningStep]] = None
    evidence_summary: Optional[EvidenceSummary] = None
    user_context: Optional[str] = None
    agent_type: Optional[str] = "综合分析"


class AIAnalysisCreate(AIAnalysisBase):
    pass


class AIAnalysisRead(AIAnalysisBase):
    id: int
    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True


class AIAnalysisRequest(BaseModel):
    alert_id: int
    agent_type: Optional[str] = "综合分析"
