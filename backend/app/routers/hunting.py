from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from app.schemas.hunting_hypothesis import (
    HuntingHypothesisCreate,
    HuntingHypothesisUpdate,
    HuntingHypothesisRead,
    HuntingHypothesisListResponse,
    HuntingHypothesisStats,
)
from app.services.hunting_service import (
    get_hypotheses,
    get_hypothesis_by_id,
    create_hypothesis,
    update_hypothesis,
    delete_hypothesis,
    get_hypothesis_stats,
)
from app.database import get_db

router = APIRouter(prefix="/hunting", tags=["威胁狩猎"])


@router.get("/hypotheses", response_model=HuntingHypothesisListResponse)
def list_hypotheses(
    status: Optional[str] = Query(None, description="状态筛选"),
    tactic: Optional[str] = Query(None, description="ATT&CK战术筛选"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db),
):
    return get_hypotheses(
        db=db,
        status=status,
        tactic=tactic,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.get("/hypotheses/stats", response_model=HuntingHypothesisStats)
def hypothesis_stats(db: Session = Depends(get_db)):
    return get_hypothesis_stats(db=db)


@router.get("/hypotheses/{hypothesis_id}", response_model=HuntingHypothesisRead)
def get_hypothesis(hypothesis_id: int, db: Session = Depends(get_db)):
    hypothesis = get_hypothesis_by_id(db, hypothesis_id)
    if not hypothesis:
        raise HTTPException(status_code=404, detail="狩猎假设不存在")
    return hypothesis


@router.post("/hypotheses", response_model=HuntingHypothesisRead, status_code=201)
def create_new_hypothesis(body: HuntingHypothesisCreate, db: Session = Depends(get_db)):
    hypothesis = create_hypothesis(db, body.model_dump())
    return hypothesis


@router.put("/hypotheses/{hypothesis_id}", response_model=HuntingHypothesisRead)
def update_existing_hypothesis(
    hypothesis_id: int,
    body: HuntingHypothesisUpdate,
    db: Session = Depends(get_db),
):
    hypothesis = update_hypothesis(db, hypothesis_id, body.model_dump(exclude_unset=True))
    if not hypothesis:
        raise HTTPException(status_code=404, detail="狩猎假设不存在")
    return hypothesis


@router.delete("/hypotheses/{hypothesis_id}", status_code=204)
def delete_existing_hypothesis(hypothesis_id: int, db: Session = Depends(get_db)):
    success = delete_hypothesis(db, hypothesis_id)
    if not success:
        raise HTTPException(status_code=404, detail="狩猎假设不存在")
