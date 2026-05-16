from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from app.schemas.strategy import (
    StrategyCreate,
    StrategyUpdate,
    StrategyRead,
    FeedbackCreate,
    FeedbackRead,
    EvolutionRead,
    EvolveRequest,
    EvolveResponse,
)
from app.services.strategy_service import (
    seed_strategies,
    get_strategies,
    get_strategy,
    create_strategy,
    update_strategy,
    submit_feedback,
    evolve_strategy,
    get_evolutions,
    get_feedbacks,
)
from app.database import get_db

router = APIRouter(prefix="/strategies", tags=["策略自演化"])


@router.post("/seed")
def seed_strats(db: Session = Depends(get_db)):
    count = seed_strategies(db)
    return {"seeded": count}


@router.get("", response_model=list[StrategyRead])
def list_strategies(strategy_type: Optional[str] = None, active_only: bool = Query(False), db: Session = Depends(get_db)):
    return get_strategies(db, strategy_type=strategy_type, active_only=active_only)


@router.get("/evolutions", response_model=list[EvolutionRead])
def list_evolutions(strategy_id: Optional[int] = None, limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    return get_evolutions(db, strategy_id=strategy_id, limit=limit)


@router.get("/feedbacks", response_model=list[FeedbackRead])
def list_feedbacks(strategy_id: Optional[int] = None, limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    return get_feedbacks(db, strategy_id=strategy_id, limit=limit)


@router.get("/{strategy_id}", response_model=StrategyRead)
def get_strategy_detail(strategy_id: int, db: Session = Depends(get_db)):
    strategy = get_strategy(db, strategy_id)
    if not strategy:
        raise HTTPException(status_code=404, detail="策略不存在")
    return strategy


@router.post("", response_model=StrategyRead, status_code=201)
def create_new_strategy(body: StrategyCreate, db: Session = Depends(get_db)):
    return create_strategy(db, body.model_dump())


@router.put("/{strategy_id}", response_model=StrategyRead)
def update_existing_strategy(strategy_id: int, body: StrategyUpdate, db: Session = Depends(get_db)):
    strategy = update_strategy(db, strategy_id, body.model_dump(exclude_unset=True))
    if not strategy:
        raise HTTPException(status_code=404, detail="策略不存在")
    return strategy


@router.post("/feedback", response_model=FeedbackRead, status_code=201)
def create_feedback(body: FeedbackCreate, db: Session = Depends(get_db)):
    return submit_feedback(db, body.model_dump())


@router.post("/evolve", response_model=EvolveResponse)
def evolve(body: EvolveRequest, db: Session = Depends(get_db)):
    result = evolve_strategy(db, body.strategy_id, body.feedback_window)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
