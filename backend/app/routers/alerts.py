from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.schemas.alert import AlertRead, AlertStatusUpdate, AlertListResponse
from app.services.alert_service import get_alerts, get_alert_by_id, update_alert_status

router = APIRouter(prefix="/alerts", tags=["告警"])


@router.get("", response_model=AlertListResponse)
def list_alerts(
    type: Optional[str] = Query(None, description="告警类型筛选"),
    risk_level: Optional[str] = Query(None, description="风险等级筛选"),
    status: Optional[str] = Query(None, description="状态筛选"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
):
    result = get_alerts(
        alert_type=type,
        risk_level=risk_level,
        status=status,
        search=search,
        skip=skip,
        limit=limit,
    )
    return result


@router.get("/{alert_id}", response_model=AlertRead)
def get_alert(alert_id: int):
    alert = get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="告警不存在")
    return alert


@router.put("/{alert_id}/status", response_model=AlertRead)
def update_status(alert_id: int, body: AlertStatusUpdate):
    alert = update_alert_status(alert_id, body.status)
    if not alert:
        raise HTTPException(status_code=404, detail="告警不存在")
    return alert
