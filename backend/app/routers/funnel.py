from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.services import funnel_service

router = APIRouter(prefix="/funnel", tags=["转化漏斗"])


class TrackEventRequest(BaseModel):
    user_id: str
    stage: str
    metadata: Optional[dict] = None


@router.post("/track")
def track_event(body: TrackEventRequest):
    try:
        event = funnel_service.track_event(body.user_id, body.stage, body.metadata)
        return {"status": "ok", "event": {**event, "timestamp": event["timestamp"].isoformat()}}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/data")
def get_funnel_data(period: str = Query("30d", description="统计周期，如 30d, 7d, 90d")):
    return funnel_service.get_funnel_data(period)


@router.get("/conversion")
def get_conversion_rate(
    from_stage: str = Query(..., description="起始阶段"),
    to_stage: str = Query(..., description="目标阶段"),
    period: str = Query("30d", description="统计周期"),
):
    rate = funnel_service.get_conversion_rate(from_stage, to_stage, period)
    return {"from_stage": from_stage, "to_stage": to_stage, "period": period, "conversion_rate": rate}


@router.get("/dropoff")
def get_drop_off_analysis(period: str = Query("30d", description="统计周期")):
    return funnel_service.get_drop_off_analysis(period)


@router.get("/trend")
def get_trend_data(period: str = Query("90d", description="统计周期")):
    return funnel_service.get_trend_data(period)
