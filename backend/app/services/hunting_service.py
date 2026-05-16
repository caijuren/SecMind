from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.hunting_hypothesis import HuntingHypothesis


def get_hypotheses(
    db: Session,
    status: Optional[str] = None,
    tactic: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> Dict[str, Any]:
    query = db.query(HuntingHypothesis)

    if status:
        query = query.filter(HuntingHypothesis.status == status)
    if tactic:
        query = query.filter(HuntingHypothesis.tactic == tactic)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            (HuntingHypothesis.name.ilike(search_lower))
            | (HuntingHypothesis.technique_id.ilike(search_lower))
            | (HuntingHypothesis.tactic.ilike(search_lower))
        )

    total = query.count()
    items = query.order_by(HuntingHypothesis.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


def get_hypothesis_by_id(db: Session, hypothesis_id: int) -> Optional[HuntingHypothesis]:
    return db.query(HuntingHypothesis).filter(HuntingHypothesis.id == hypothesis_id).first()


def create_hypothesis(db: Session, hypothesis_data: dict) -> HuntingHypothesis:
    hypothesis = HuntingHypothesis(**hypothesis_data)
    db.add(hypothesis)
    db.commit()
    db.refresh(hypothesis)
    return hypothesis


def update_hypothesis(db: Session, hypothesis_id: int, update_data: dict) -> Optional[HuntingHypothesis]:
    hypothesis = db.query(HuntingHypothesis).filter(HuntingHypothesis.id == hypothesis_id).first()
    if not hypothesis:
        return None
    for key, value in update_data.items():
        if value is not None:
            setattr(hypothesis, key, value)
    db.commit()
    db.refresh(hypothesis)
    return hypothesis


def delete_hypothesis(db: Session, hypothesis_id: int) -> bool:
    hypothesis = db.query(HuntingHypothesis).filter(HuntingHypothesis.id == hypothesis_id).first()
    if not hypothesis:
        return False
    db.delete(hypothesis)
    db.commit()
    return True


def get_hypothesis_stats(db: Session) -> Dict[str, Any]:
    total = db.query(func.count(HuntingHypothesis.id)).scalar() or 0

    by_status = {}
    for row in db.query(HuntingHypothesis.status, func.count(HuntingHypothesis.id)).group_by(HuntingHypothesis.status).all():
        by_status[row[0] or "验证中"] = row[1]

    by_tactic = {}
    for row in db.query(HuntingHypothesis.tactic, func.count(HuntingHypothesis.id)).group_by(HuntingHypothesis.tactic).all():
        by_tactic[row[0] or "其他"] = row[1]

    return {
        "total": total,
        "by_status": by_status,
        "by_tactic": by_tactic,
    }
