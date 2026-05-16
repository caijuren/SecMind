from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime


class ComplianceFrameworkCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    version: Optional[str] = None
    total_controls: int = 0
    category: Optional[List[str]] = None
    is_active: bool = True


class ComplianceFrameworkRead(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    version: Optional[str] = None
    total_controls: int
    category: Optional[Any] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ComplianceControlRead(BaseModel):
    id: int
    framework_id: int
    control_id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    severity: str
    mapping: Optional[Any] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ComplianceFrameworkDetail(ComplianceFrameworkRead):
    controls: List[ComplianceControlRead] = []


class ComplianceAssessmentCreate(BaseModel):
    framework_id: int
    name: str
    assessor: Optional[str] = None


class ComplianceAssessmentRead(BaseModel):
    id: int
    framework_id: int
    name: str
    status: str
    assessor: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    overall_score: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ComplianceResultRead(BaseModel):
    id: int
    assessment_id: int
    control_id: int
    status: str
    evidence: Optional[Any] = None
    findings: Optional[str] = None
    remediation: Optional[str] = None
    assessed_at: Optional[datetime] = None
    assessed_by: Optional[str] = None

    class Config:
        from_attributes = True


class ComplianceResultUpdate(BaseModel):
    status: Optional[str] = None
    evidence: Optional[Any] = None
    findings: Optional[str] = None
    remediation: Optional[str] = None
    assessed_by: Optional[str] = None


class ComplianceAssessmentDetail(ComplianceAssessmentRead):
    results: List[ComplianceResultRead] = []


class ComplianceReportCategory(BaseModel):
    category: str
    total: int
    compliant: int
    partially_compliant: int
    non_compliant: int
    not_assessed: int
    score: float


class ComplianceReport(BaseModel):
    framework: ComplianceFrameworkRead
    assessment: ComplianceAssessmentRead
    overall_score: float
    total_controls: int
    compliant: int
    partially_compliant: int
    non_compliant: int
    not_assessed: int
    categories: List[ComplianceReportCategory]
    results: List[ComplianceResultRead]
