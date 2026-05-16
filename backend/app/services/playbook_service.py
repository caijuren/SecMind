from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.playbook import Playbook


def get_playbooks(
    db: Session,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> Dict[str, Any]:
    query = db.query(Playbook)

    if status:
        query = query.filter(Playbook.status == status)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            (Playbook.name.ilike(search_lower))
            | (Playbook.description.ilike(search_lower))
            | (Playbook.trigger.ilike(search_lower))
        )

    total = query.count()
    items = query.order_by(Playbook.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


def get_playbook_by_id(db: Session, playbook_id: int) -> Optional[Playbook]:
    return db.query(Playbook).filter(Playbook.id == playbook_id).first()


def create_playbook(db: Session, playbook_data: dict) -> Playbook:
    playbook = Playbook(**playbook_data)
    db.add(playbook)
    db.commit()
    db.refresh(playbook)
    return playbook


def update_playbook(db: Session, playbook_id: int, update_data: dict) -> Optional[Playbook]:
    playbook = db.query(Playbook).filter(Playbook.id == playbook_id).first()
    if not playbook:
        return None
    for key, value in update_data.items():
        if value is not None:
            setattr(playbook, key, value)
    db.commit()
    db.refresh(playbook)
    return playbook


def delete_playbook(db: Session, playbook_id: int) -> bool:
    playbook = db.query(Playbook).filter(Playbook.id == playbook_id).first()
    if not playbook:
        return False
    db.delete(playbook)
    db.commit()
    return True


def get_playbook_stats(db: Session) -> Dict[str, Any]:
    total = db.query(func.count(Playbook.id)).scalar() or 0

    by_status = {}
    for row in db.query(Playbook.status, func.count(Playbook.id)).group_by(Playbook.status).all():
        by_status[row[0] or "enabled"] = row[1]

    return {
        "total": total,
        "by_status": by_status,
    }
