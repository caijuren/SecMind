from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate, UserCreate
from app.routers.auth import get_current_user
from app.services.auth_service import create_user

router = APIRouter(prefix="/users", tags=["用户管理"])


@router.get("")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id.asc()).all()
    return {"total": len(users), "items": users}


@router.get("/me", response_model=UserRead)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("", response_model=UserRead)
def create_user_by_admin(body: UserCreate, db: Session = Depends(get_db)):
    return create_user(
        db,
        email=body.email,
        password=body.password,
        name=body.name,
        phone=body.phone,
        department=body.department,
        position=body.position,
        level=body.level,
        manager=body.manager,
        is_sensitive=body.is_sensitive,
        office=body.office,
        recent_login_location=body.recent_login_location,
        is_on_leave=body.is_on_leave,
        is_resigned=body.is_resigned,
        role=body.role,
        status=body.status,
        avatar_url=body.avatar_url,
        last_login=body.last_login,
    )


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        return user
    raise HTTPException(status_code=404, detail="用户不存在")


@router.put("/{user_id}", response_model=UserRead)
def update_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        update_data = body.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(user, key, value)
        db.commit()
        db.refresh(user)
        return user
    raise HTTPException(status_code=404, detail="用户不存在")


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    db.delete(user)
    db.commit()
    return {"success": True}
