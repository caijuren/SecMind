from fastapi import APIRouter, HTTPException

from app.schemas.ai_analysis import AIAnalysisRead, AIAnalysisRequest, AIAnalysisCreate
from app.services.ai_service import create_analysis, get_analyses, get_analysis_by_id

router = APIRouter(prefix="/ai", tags=["AI分析"])


@router.post("/analyze", response_model=AIAnalysisRead)
def analyze_alert(request: AIAnalysisRequest):
    from app.services.alert_service import get_alert_by_id

    alert = get_alert_by_id(request.alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="告警不存在")

    analysis = create_analysis(alert_id=request.alert_id, agent_type=request.agent_type)
    return analysis


@router.get("/analyses")
def list_analyses(skip: int = 0, limit: int = 20):
    return get_analyses(skip=skip, limit=limit)


@router.get("/analyses/{analysis_id}", response_model=AIAnalysisRead)
def get_analysis(analysis_id: int):
    analysis = get_analysis_by_id(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="分析记录不存在")
    return analysis
