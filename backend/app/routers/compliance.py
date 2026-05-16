from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.schemas.compliance import (
    ComplianceFrameworkRead,
    ComplianceFrameworkDetail,
    ComplianceControlRead,
    ComplianceAssessmentCreate,
    ComplianceAssessmentRead,
    ComplianceAssessmentDetail,
    ComplianceResultRead,
    ComplianceResultUpdate,
    ComplianceReport,
)
from app.services.compliance_service import (
    seed_compliance,
    get_frameworks,
    get_framework,
    get_controls,
    create_assessment,
    get_assessments,
    get_assessment,
    generate_assessment,
    update_result,
    get_assessment_report,
)
from app.database import get_db

router = APIRouter(prefix="/compliance", tags=["合规管理"])


@router.post("/seed")
def seed_frameworks(db: Session = Depends(get_db)):
    result = seed_compliance(db)
    return result


@router.get("/frameworks", response_model=list[ComplianceFrameworkRead])
def list_frameworks(active_only: bool = False, db: Session = Depends(get_db)):
    return get_frameworks(db, active_only=active_only)


@router.get("/frameworks/{framework_id}", response_model=ComplianceFrameworkDetail)
def get_framework_detail(framework_id: int, db: Session = Depends(get_db)):
    framework = get_framework(db, framework_id)
    if not framework:
        raise HTTPException(status_code=404, detail="合规框架不存在")
    return framework


@router.get("/frameworks/{framework_id}/controls", response_model=list[ComplianceControlRead])
def list_controls(framework_id: int, category: Optional[str] = None, db: Session = Depends(get_db)):
    framework = get_framework(db, framework_id)
    if not framework:
        raise HTTPException(status_code=404, detail="合规框架不存在")
    return get_controls(db, framework_id, category)


@router.post("/assessments", response_model=ComplianceAssessmentRead, status_code=201)
def create_new_assessment(body: ComplianceAssessmentCreate, db: Session = Depends(get_db)):
    framework = get_framework(db, body.framework_id)
    if not framework:
        raise HTTPException(status_code=404, detail="合规框架不存在")
    return create_assessment(db, body.framework_id, body.name, body.assessor)


@router.get("/assessments", response_model=list[ComplianceAssessmentRead])
def list_assessments(framework_id: Optional[int] = None, db: Session = Depends(get_db)):
    return get_assessments(db, framework_id)


@router.get("/assessments/{assessment_id}", response_model=ComplianceAssessmentDetail)
def get_assessment_detail(assessment_id: int, db: Session = Depends(get_db)):
    assessment = get_assessment(db, assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="评估不存在")
    return assessment


@router.post("/assessments/{assessment_id}/generate", response_model=ComplianceAssessmentDetail)
def generate_assessment_results(assessment_id: int, db: Session = Depends(get_db)):
    assessment = generate_assessment(db, assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="评估不存在")
    return assessment


@router.put("/results/{result_id}", response_model=ComplianceResultRead)
def update_result_endpoint(result_id: int, body: ComplianceResultUpdate, db: Session = Depends(get_db)):
    result = update_result(
        db,
        result_id,
        status=body.status,
        evidence=body.evidence,
        findings=body.findings,
        remediation=body.remediation,
        assessed_by=body.assessed_by,
    )
    if not result:
        raise HTTPException(status_code=404, detail="评估结果不存在")
    return result


@router.get("/frameworks/{framework_id}/report", response_model=ComplianceReport)
def get_framework_report(framework_id: int, db: Session = Depends(get_db)):
    report = get_assessment_report(db, framework_id)
    if not report:
        raise HTTPException(status_code=404, detail="合规框架不存在")
    return report
