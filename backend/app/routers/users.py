from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate, UserCreate
from app.routers.auth import get_current_user
from app.services.auth_service import create_user
from app.services.permissions import require_permission
from app.services.audit_service import record_audit
from app.dependencies import get_current_tenant_id, get_client_ip, get_user_agent

router = APIRouter(prefix="/users", tags=["用户管理"])


@router.get("")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users", "read")),
):
    users = db.query(User).order_by(User.id.asc()).all()
    return {"total": len(users), "items": users}


@router.get("/me", response_model=UserRead)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("", response_model=UserRead)
def create_user_by_admin(
    body: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users", "write")),
    tenant_id: str = Depends(get_current_tenant_id),
):
    user = create_user(
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
        status=body.status,
        avatar_url=body.avatar_url,
        last_login=body.last_login,
    )
    record_audit(
        db=db,
        tenant_id=tenant_id,
        action="create_user",
        user_id=current_user.id,
        user_name=current_user.name,
        resource_type="user",
        resource_id=str(user.id),
        detail=f"创建用户 {user.name} ({user.email})",
    )
    return user


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users", "read")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        return user
    raise HTTPException(status_code=404, detail="用户不存在")


@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users", "write")),
    tenant_id: str = Depends(get_current_tenant_id),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        update_data = body.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(user, key, value)
        db.commit()
        db.refresh(user)
        record_audit(
            db=db,
            tenant_id=tenant_id,
            action="update_user",
            user_id=current_user.id,
            user_name=current_user.name,
            resource_type="user",
            resource_id=str(user.id),
            detail=f"更新用户 {user.name}",
        )
        return user
    raise HTTPException(status_code=404, detail="用户不存在")


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users", "write")),
    tenant_id: str = Depends(get_current_tenant_id),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    user_name = user.name
    db.delete(user)
    db.commit()
    record_audit(
        db=db,
        tenant_id=tenant_id,
        action="delete_user",
        user_id=current_user.id,
        user_name=current_user.name,
        resource_type="user",
        resource_id=str(user_id),
        detail=f"删除用户 {user_name}",
    )
    return {"success": True}
