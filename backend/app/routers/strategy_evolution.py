from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import Optional, Any
from sqlalchemy.orm import Session

from app.services.strategy_evolution import strategy_evolution_service
from app.services.strategy_evolution_engine import strategy_evolution_engine
from app.database import get_db

router = APIRouter(prefix="/strategy/evolution", tags=["策略演化"])


class ExecutionRecordRequest(BaseModel):
    action_type: str
    target: str
    params: dict
    result: dict


class EvolutionFeedbackRequest(BaseModel):
    strategy_id: int
    execution_id: Optional[str] = None
    outcome: str
    context: Optional[dict] = None
    reward: Optional[float] = 0.0
    comment: Optional[str] = None


@router.post("/record")
async def record_execution(body: ExecutionRecordRequest):
    record = await strategy_evolution_service.record_execution_result(
        action_type=body.action_type,
        target=body.target,
        params=body.params,
        result=body.result,
    )
    return record


@router.get("/analysis")
async def analyze_strategy(period: str = Query("30d", description="分析周期，如 30d, 7d, 24h")):
    result = await strategy_evolution_service.analyze_strategy_effectiveness(period=period)
    return result


@router.get("/suggest/{action_type}")
async def suggest_optimization(action_type: str):
    result = await strategy_evolution_service.suggest_optimization(action_type=action_type)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/auto-adjust/{action_type}")
async def auto_adjust_strategy(action_type: str):
    result = await strategy_evolution_service.auto_adjust_strategy(action_type=action_type)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/rollback/{adjustment_id}")
async def rollback_adjustment(adjustment_id: str):
    result = await strategy_evolution_service.rollback_adjustment(adjustment_id=adjustment_id)
    if not result.get("rolled_back", False):
        raise HTTPException(status_code=400, detail=result.get("error", "回滚失败"))
    return result


@router.get("/history")
async def get_evolution_history(limit: int = Query(20, ge=1, le=200, description="返回条数")):
    result = await strategy_evolution_service.get_evolution_history(limit=limit)
    return result


@router.get("/params")
async def get_current_params():
    result = await strategy_evolution_service.get_current_params()
    return result


@router.post("/evolve/{strategy_id}")
def trigger_strategy_evolution(
    strategy_id: int,
    feedback_window: int = Query(50, ge=5, le=200, description="反馈窗口大小"),
    db: Session = Depends(get_db),
):
    result = strategy_evolution_engine.trigger_evolution(db, strategy_id, feedback_window)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/fitness/{strategy_id}")
def get_strategy_fitness(
    strategy_id: int,
    db: Session = Depends(get_db),
):
    result = strategy_evolution_engine.get_fitness_metrics(db, strategy_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post("/feedback")
def submit_evolution_feedback(
    body: EvolutionFeedbackRequest,
    db: Session = Depends(get_db),
):
    result = strategy_evolution_engine.record_feedback_and_check(db, body.model_dump())
    return result
