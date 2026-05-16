from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.collaboration import Comment, Notification
from app.models.user import User


def create_comment(db: Session, user_id: int, user_name: str, data: dict) -> Comment:
    comment = Comment(
        alert_id=data.get("alert_id"),
        user_id=user_id,
        user_name=user_name,
        content=data["content"],
        mentions=data.get("mentions"),
        parent_id=data.get("parent_id"),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    if data.get("mentions"):
        mentioned_names = data["mentions"]
        mentioned_users = db.query(User).filter(User.name.in_(mentioned_names)).all()
        user_map = {u.name: u for u in mentioned_users}
        for mentioned_name in mentioned_names:
            mentioned_user = user_map.get(mentioned_name)
            if mentioned_user:
                notif = Notification(
                    user_id=mentioned_user.id,
                    type="mention",
                    title=f"{user_name} 在评论中@了你",
                    content=data["content"][:200],
                    reference_type="comment",
                    reference_id=comment.id,
                )
                db.add(notif)
        db.commit()

    return comment


def get_comments(db: Session, alert_id: Optional[int] = None, skip: int = 0, limit: int = 50) -> Dict[str, Any]:
    query = db.query(Comment)
    if alert_id:
        query = query.filter(Comment.alert_id == alert_id)
    total = query.count()
    items = query.order_by(Comment.id.asc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


def delete_comment(db: Session, comment_id: int) -> bool:
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        return False
    db.delete(comment)
    db.commit()
    return True


def create_notification(db: Session, user_id: int, type: str, title: str, content: Optional[str] = None, reference_type: Optional[str] = None, reference_id: Optional[int] = None) -> Notification:
    notif = Notification(user_id=user_id, type=type, title=title, content=content, reference_type=reference_type, reference_id=reference_id)
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def get_notifications(db: Session, user_id: int, is_read: Optional[int] = None, skip: int = 0, limit: int = 20) -> Dict[str, Any]:
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    total = query.count()
    items = query.order_by(Notification.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


def mark_notification_read(db: Session, notification_id: int, user_id: int) -> Optional[Notification]:
    notif = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    if not notif:
        return None
    notif.is_read = 1
    db.commit()
    db.refresh(notif)
    return notif


def mark_all_read(db: Session, user_id: int) -> int:
    result = db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == 0).update({"is_read": 1})
    db.commit()
    return result


def get_notification_stats(db: Session, user_id: int) -> Dict[str, Any]:
    total = db.query(func.count(Notification.id)).filter(Notification.user_id == user_id).scalar() or 0
    unread = db.query(func.count(Notification.id)).filter(Notification.user_id == user_id, Notification.is_read == 0).scalar() or 0
    return {"total": total, "unread": unread}
