from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from app.schemas.tenant import (
    TenantCreate,
    TenantUpdate,
    TenantRead,
    TenantMemberRead,
    TenantMemberAdd,
    TenantQuota,
    SubscriptionCreate,
    SubscriptionRead,
)
from app.services.tenant_service import (
    get_tenants,
    get_tenant_by_id,
    get_tenant_by_slug,
    create_tenant,
    update_tenant,
    add_member,
    remove_member,
    get_members,
    get_tenant_quota,
    create_subscription,
    get_subscription,
)
from app.database import get_db

router = APIRouter(prefix="/tenants", tags=["多租户管理"])


@router.get("")
def list_tenants(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
    result = get_tenants(db, skip=skip, limit=limit)
    return {"total": result["total"], "items": [TenantRead.model_validate(t) for t in result["items"]]}


@router.get("/{tenant_id}", response_model=TenantRead)
def get_tenant(tenant_id: int, db: Session = Depends(get_db)):
    tenant = get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="租户不存在")
    return tenant


@router.post("", response_model=TenantRead, status_code=201)
def create_new_tenant(body: TenantCreate, db: Session = Depends(get_db)):
    existing = get_tenant_by_slug(db, body.slug)
    if existing:
        raise HTTPException(status_code=400, detail="租户标识已存在")
    return create_tenant(db, body.model_dump())


@router.put("/{tenant_id}", response_model=TenantRead)
def update_existing_tenant(tenant_id: int, body: TenantUpdate, db: Session = Depends(get_db)):
    tenant = update_tenant(db, tenant_id, body.model_dump(exclude_unset=True))
    if not tenant:
        raise HTTPException(status_code=404, detail="租户不存在")
    return tenant


@router.get("/{tenant_id}/quota", response_model=TenantQuota)
def tenant_quota(tenant_id: int, db: Session = Depends(get_db)):
    quota = get_tenant_quota(db, tenant_id)
    if not quota:
        raise HTTPException(status_code=404, detail="租户不存在")
    return quota


@router.get("/{tenant_id}/members", response_model=list[TenantMemberRead])
def list_members(tenant_id: int, db: Session = Depends(get_db)):
    return get_members(db, tenant_id)


@router.post("/{tenant_id}/members", response_model=TenantMemberRead, status_code=201)
def add_tenant_member(tenant_id: int, body: TenantMemberAdd, db: Session = Depends(get_db)):
    tenant = get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="租户不存在")
    return add_member(db, tenant_id, body.user_id, body.role)


@router.delete("/{tenant_id}/members/{user_id}", status_code=204)
def remove_tenant_member(tenant_id: int, user_id: int, db: Session = Depends(get_db)):
    if not remove_member(db, tenant_id, user_id):
        raise HTTPException(status_code=404, detail="成员不存在")


@router.get("/{tenant_id}/subscription", response_model=SubscriptionRead)
def get_tenant_subscription(tenant_id: int, db: Session = Depends(get_db)):
    sub = get_subscription(db, tenant_id)
    if not sub:
        raise HTTPException(status_code=404, detail="订阅不存在")
    return sub


@router.post("/{tenant_id}/subscription", response_model=SubscriptionRead, status_code=201)
def create_tenant_subscription(tenant_id: int, body: SubscriptionCreate, db: Session = Depends(get_db)):
    tenant = get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="租户不存在")
    return create_subscription(db, tenant_id, body.plan, body.payment_method)
