from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.audit_log import AuditLog


def record_audit(
    db: Session,
    tenant_id: str,
    action: str,
    user_id: Optional[int] = None,
    user_name: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    detail: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    extra: Optional[dict] = None,
) -> AuditLog:
    log = AuditLog(
        tenant_id=tenant_id,
        user_id=user_id,
        user_name=user_name,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        detail=detail,
        ip_address=ip_address,
        user_agent=user_agent,
        extra=extra,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_audit_logs(
    db: Session,
    tenant_id: str,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    user_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> Dict[str, Any]:
    query = db.query(AuditLog).filter(AuditLog.tenant_id == tenant_id)

    if action:
        query = query.filter(AuditLog.action == action)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            (AuditLog.user_name.ilike(search_lower))
            | (AuditLog.detail.ilike(search_lower))
            | (AuditLog.action.ilike(search_lower))
        )

    total = query.count()
    items = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


def export_audit_logs(
    db: Session,
    tenant_id: str,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    user_id: Optional[int] = None,
    search: Optional[str] = None,
    format: str = "csv",
) -> List[Dict[str, Any]]:
    query = db.query(AuditLog).filter(AuditLog.tenant_id == tenant_id)

    if action:
        query = query.filter(AuditLog.action == action)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            (AuditLog.user_name.ilike(search_lower))
            | (AuditLog.detail.ilike(search_lower))
        )

    logs = query.order_by(desc(AuditLog.created_at)).all()

    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "tenant_id": log.tenant_id,
            "user_id": log.user_id,
            "user_name": log.user_name,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "detail": log.detail,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        })

    return result


def get_audit_stats(db: Session, tenant_id: str) -> Dict[str, Any]:
    total = db.query(func.count(AuditLog.id)).filter(AuditLog.tenant_id == tenant_id).scalar() or 0

    by_action = {}
    rows = db.query(AuditLog.action, func.count(AuditLog.id)).filter(
        AuditLog.tenant_id == tenant_id
    ).group_by(AuditLog.action).all()
    for action, count in rows:
        by_action[action] = count

    by_resource = {}
    rows = db.query(AuditLog.resource_type, func.count(AuditLog.id)).filter(
        AuditLog.tenant_id == tenant_id
    ).group_by(AuditLog.resource_type).all()
    for resource_type, count in rows:
        by_resource[resource_type or "其他"] = count

    return {
        "total": total,
        "by_action": by_action,
        "by_resource": by_resource,
    }