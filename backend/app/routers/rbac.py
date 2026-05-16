from typing import List

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from app.schemas.rbac import (
    RoleCreate,
    RoleUpdate,
    RoleRead,
    PermissionRead,
    UserRoleAssign,
    UserPermissionsRead,
)
from app.services.rbac_service import (
    get_roles,
    get_role_by_id,
    create_role,
    update_role,
    delete_role,
    get_permissions,
    assign_user_roles,
    get_user_permissions,
    seed_rbac,
)
from app.database import get_db

router = APIRouter(prefix="/rbac", tags=["权限管理"])


@router.post("/seed", status_code=201)
def seed_rbac_data(db: Session = Depends(get_db)):
    seed_rbac(db)
    return {"message": "RBAC 数据初始化完成"}


@router.get("/roles", response_model=List[RoleRead])
def list_roles(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
    return get_roles(db, skip=skip, limit=limit)


@router.get("/roles/{role_id}", response_model=RoleRead)
def get_role(role_id: int, db: Session = Depends(get_db)):
    role = get_role_by_id(db, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")
    return role


@router.post("/roles", response_model=RoleRead, status_code=201)
def create_new_role(body: RoleCreate, db: Session = Depends(get_db)):
    role = create_role(db, body.name, body.display_name, body.description, body.permission_ids)
    return role


@router.put("/roles/{role_id}", response_model=RoleRead)
def update_existing_role(role_id: int, body: RoleUpdate, db: Session = Depends(get_db)):
    role = update_role(db, role_id, body.model_dump(exclude_unset=True))
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")
    return role


@router.delete("/roles/{role_id}", status_code=204)
def delete_existing_role(role_id: int, db: Session = Depends(get_db)):
    success = delete_role(db, role_id)
    if not success:
        raise HTTPException(status_code=400, detail="无法删除：系统角色或角色不存在")


@router.get("/permissions", response_model=List[PermissionRead])
def list_permissions(db: Session = Depends(get_db)):
    return get_permissions(db)


@router.put("/users/{user_id}/roles", response_model=UserPermissionsRead)
def assign_roles(user_id: int, body: UserRoleAssign, db: Session = Depends(get_db)):
    user = assign_user_roles(db, user_id, body.role_ids)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return get_user_permissions(db, user_id)


@router.get("/users/{user_id}/permissions", response_model=UserPermissionsRead)
def get_permissions_for_user(user_id: int, db: Session = Depends(get_db)):
    return get_user_permissions(db, user_id)
