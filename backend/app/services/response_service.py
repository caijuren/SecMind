from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.response_action import ResponseAction, VALID_TRANSITIONS


def get_actions(
    db: Session,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    action_type: Optional[str] = None,
    hypothesis_id: Optional[str] = None,
    alert_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> Dict[str, Any]:
    query = db.query(ResponseAction).options(joinedload(ResponseAction.alert))

    if status:
        query = query.filter(ResponseAction.status == status)
    if priority:
        query = query.filter(ResponseAction.priority == priority)
    if action_type:
        query = query.filter(ResponseAction.action_type == action_type)
    if hypothesis_id:
        query = query.filter(ResponseAction.hypothesis_id == hypothesis_id)
    if alert_id:
        query = query.filter(ResponseAction.alert_id == alert_id)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            (ResponseAction.name.ilike(search_lower))
            | (ResponseAction.target.ilike(search_lower))
            | (ResponseAction.ai_reasoning.ilike(search_lower))
        )

    total = query.count()
    items = query.order_by(ResponseAction.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


def get_action_by_id(db: Session, action_id: int) -> Optional[ResponseAction]:
    return db.query(ResponseAction).filter(ResponseAction.id == action_id).first()


def create_action(db: Session, action_data: dict) -> ResponseAction:
    action = ResponseAction(**action_data)
    db.add(action)
    db.commit()
    db.refresh(action)
    return action


def update_action(db: Session, action_id: int, update_data: dict) -> Optional[ResponseAction]:
    action = db.query(ResponseAction).filter(ResponseAction.id == action_id).first()
    if not action:
        return None
    for key, value in update_data.items():
        if value is not None:
            setattr(action, key, value)
    db.commit()
    db.refresh(action)
    return action


def transition_status(
    db: Session,
    action_id: int,
    new_status: str,
    **kwargs,
) -> Optional[ResponseAction]:
    action = db.query(ResponseAction).filter(ResponseAction.id == action_id).first()
    if not action:
        return None

    current = action.status
    if new_status not in VALID_TRANSITIONS.get(current, []):
        return None

    action.status = new_status
    action.updated_at = datetime.now()

    if new_status == "executing":
        action.executed_at = datetime.now()
    elif new_status == "completed":
        action.completed_at = datetime.now()
        if "result" in kwargs:
            action.result = kwargs["result"]
    elif new_status == "failed":
        action.completed_at = datetime.now()
        if "result" in kwargs:
            action.result = kwargs["result"]
    elif new_status == "approved":
        action.approved_by = kwargs.get("approved_by")
        action.approved_at = datetime.now()
    elif new_status == "cancelled":
        action.cancelled_by = kwargs.get("cancelled_by")
        action.cancelled_at = datetime.now()
        action.cancel_reason = kwargs.get("cancel_reason")
    elif new_status == "awaiting_approval":
        pass
    elif new_status == "pending":
        action.executed_at = None
        action.completed_at = None
        action.result = None

    db.commit()
    db.refresh(action)
    return action


def get_action_stats(db: Session) -> Dict[str, Any]:
    total = db.query(func.count(ResponseAction.id)).scalar() or 0

    by_status = {}
    for row in db.query(ResponseAction.status, func.count(ResponseAction.id)).group_by(ResponseAction.status).all():
        by_status[row[0] or "pending"] = row[1]

    by_priority = {}
    for row in db.query(ResponseAction.priority, func.count(ResponseAction.id)).group_by(ResponseAction.priority).all():
        by_priority[row[0] or "medium"] = row[1]

    by_action_type = {}
    for row in db.query(ResponseAction.action_type, func.count(ResponseAction.id)).group_by(ResponseAction.action_type).all():
        by_action_type[row[0] or "other"] = row[1]

    return {
        "total": total,
        "by_status": by_status,
        "by_priority": by_priority,
        "by_action_type": by_action_type,
    }
