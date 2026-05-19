from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.services.permissions import get_current_user
from app.models.user import User
from app.models.alert import Alert
from app.models.document import Document

router = APIRouter(prefix="/search", tags=["全局搜索"])


@router.get("")
def global_search(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = []
    search_term = f"%{q}%"

    alerts = (
        db.query(Alert)
        .filter(
            or_(
                Alert.title.ilike(search_term),
                Alert.raw_log.ilike(search_term),
            )
        )
        .limit(5)
        .all()
    )
    for a in alerts:
        results.append(
            {
                "id": f"alert-{a.id}",
                "type": "alert",
                "title": a.title,
                "subtitle": f"风险等级: {a.risk_level}",
                "url": f"/signals?alert={a.id}",
            }
        )

    docs = (
        db.query(Document)
        .filter(
            or_(
                Document.title.ilike(search_term),
                Document.content.ilike(search_term),
            )
        )
        .limit(5)
        .all()
    )
    for d in docs:
        results.append(
            {
                "id": f"doc-{d.id}",
                "type": "knowledge",
                "title": d.title,
                "subtitle": d.category or "知识库",
                "url": f"/knowledge?doc={d.id}",
            }
        )

    users = (
        db.query(User)
        .filter(
            or_(
                User.name.ilike(search_term),
                User.email.ilike(search_term),
            )
        )
        .limit(5)
        .all()
    )
    for u in users:
        results.append(
            {
                "id": f"user-{u.id}",
                "type": "user",
                "title": u.name,
                "subtitle": u.email,
                "url": f"/users?user={u.id}",
            }
        )

    return {"results": results, "total": len(results)}