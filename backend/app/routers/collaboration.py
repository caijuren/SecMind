from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from app.schemas.collaboration import (
    CommentCreate,
    CommentRead,
    NotificationRead,
    NotificationStats,
)
from typing import List as TypingList
from pydantic import BaseModel


class CommentListResponse(BaseModel):
    total: int
    items: TypingList[CommentRead]


class NotificationListResponse(BaseModel):
    total: int
    items: TypingList[NotificationRead]
from app.services.collaboration_service import (
    create_comment,
    get_comments,
    delete_comment,
    get_notifications,
    mark_notification_read,
    mark_all_read,
    get_notification_stats,
)
from app.database import get_db
from app.services.permissions import get_current_user
from app.models.user import User

router = APIRouter(prefix="/collaboration", tags=["协作"])


@router.post("/comments", response_model=CommentRead, status_code=201)
def add_comment(body: CommentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    comment = create_comment(db, current_user.id, current_user.name, body.model_dump())
    return comment


@router.get("/comments", response_model=CommentListResponse)
def list_comments(alert_id: Optional[int] = Query(None), skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
    return get_comments(db, alert_id=alert_id, skip=skip, limit=limit)


@router.delete("/comments/{comment_id}", status_code=204)
def remove_comment(comment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    success = delete_comment(db, comment_id)
    if not success:
        raise HTTPException(status_code=404, detail="评论不存在")


@router.get("/notifications", response_model=NotificationListResponse)
def list_notifications(is_read: Optional[int] = Query(None), skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_notifications(db, current_user.id, is_read=is_read, skip=skip, limit=limit)


@router.get("/notifications/stats", response_model=NotificationStats)
def notification_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_notification_stats(db, current_user.id)


@router.put("/notifications/{notification_id}/read", response_model=NotificationRead)
def read_notification(notification_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = mark_notification_read(db, notification_id, current_user.id)
    if not notif:
        raise HTTPException(status_code=404, detail="通知不存在")
    return notif


@router.put("/notifications/read-all")
def read_all_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = mark_all_read(db, current_user.id)
    return {"marked_read": count}
