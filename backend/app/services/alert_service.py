from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.alert import Alert


def get_alerts(
    db: Session,
    alert_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> Dict[str, Any]:
    query = db.query(Alert)

    if alert_type:
        query = query.filter(Alert.type == alert_type)
    if risk_level:
        query = query.filter(Alert.risk_level == risk_level)
    if status:
        query = query.filter(Alert.status == status)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            (Alert.title.ilike(search_lower))
            | (Alert.description.ilike(search_lower))
            | (Alert.user_name.ilike(search_lower))
        )

    total = query.count()
    items = query.order_by(Alert.id.asc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


def get_alert_by_id(db: Session, alert_id: int) -> Optional[Alert]:
    return db.query(Alert).filter(Alert.id == alert_id).first()


def update_alert_status(db: Session, alert_id: int, new_status: str) -> Optional[Alert]:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.status = new_status
        db.commit()
        db.refresh(alert)
    return alert


def get_alert_stats(db: Session) -> Dict[str, Any]:
    total = db.query(func.count(Alert.id)).scalar() or 0

    by_risk = {}
    for row in db.query(Alert.risk_level, func.count(Alert.id)).group_by(Alert.risk_level).all():
        by_risk[row[0] or "低"] = row[1]

    by_status = {}
    for row in db.query(Alert.status, func.count(Alert.id)).group_by(Alert.status).all():
        by_status[row[0] or "待处理"] = row[1]

    by_type = {}
    for row in db.query(Alert.type, func.count(Alert.id)).group_by(Alert.type).all():
        by_type[row[0] or "其他"] = row[1]

    return {
        "total": total,
        "by_risk_level": by_risk,
        "by_status": by_status,
        "by_type": by_type,
    }
