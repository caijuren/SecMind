from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.tenant import Tenant, TenantMember, Subscription, UsageRecord

PLAN_LIMITS = {
    "free": {"max_users": 5, "max_alerts_per_day": 100, "max_api_calls_per_day": 1000, "trial_days": 14},
    "starter": {"max_users": 20, "max_alerts_per_day": 1000, "max_api_calls_per_day": 10000, "trial_days": 30},
    "professional": {"max_users": 100, "max_alerts_per_day": 10000, "max_api_calls_per_day": 100000, "trial_days": 30},
    "enterprise": {"max_users": -1, "max_alerts_per_day": -1, "max_api_calls_per_day": -1, "trial_days": 30},
}

PLAN_PRICES = {
    "free": 0,
    "starter": 299,
    "professional": 999,
    "enterprise": 4999,
}


def get_tenants(db: Session, skip: int = 0, limit: int = 50) -> Dict[str, Any]:
    query = db.query(Tenant)
    total = query.count()
    items = query.order_by(Tenant.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


def get_tenant_by_id(db: Session, tenant_id: int) -> Optional[Tenant]:
    return db.query(Tenant).filter(Tenant.id == tenant_id).first()


def get_tenant_by_slug(db: Session, slug: str) -> Optional[Tenant]:
    return db.query(Tenant).filter(Tenant.slug == slug).first()


def create_tenant(db: Session, data: dict) -> Tenant:
    plan = data.get("plan", "free")
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
    tenant = Tenant(
        name=data["name"],
        slug=data["slug"],
        owner_email=data["owner_email"],
        owner_name=data.get("owner_name"),
        plan=plan,
        max_users=limits["max_users"],
        max_alerts_per_day=limits["max_alerts_per_day"],
        max_api_calls_per_day=limits["max_api_calls_per_day"],
        expires_at=datetime.now() + timedelta(days=limits["trial_days"]),
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    subscription = Subscription(
        tenant_id=tenant.id,
        plan=plan,
        status="trial",
        trial_ends_at=tenant.expires_at,
        current_period_start=datetime.now(),
        current_period_end=tenant.expires_at,
        amount=0,
    )
    db.add(subscription)
    db.commit()

    return tenant


def update_tenant(db: Session, tenant_id: int, data: dict) -> Optional[Tenant]:
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        return None
    if "plan" in data and data["plan"] != tenant.plan:
        plan = data["plan"]
        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
        data["max_users"] = limits["max_users"]
        data["max_alerts_per_day"] = limits["max_alerts_per_day"]
        data["max_api_calls_per_day"] = limits["max_api_calls_per_day"]
    for key, value in data.items():
        if value is not None:
            setattr(tenant, key, value)
    db.commit()
    db.refresh(tenant)
    return tenant


def add_member(db: Session, tenant_id: int, user_id: int, role: str = "member") -> TenantMember:
    member = TenantMember(tenant_id=tenant_id, user_id=user_id, role=role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def remove_member(db: Session, tenant_id: int, user_id: int) -> bool:
    member = db.query(TenantMember).filter(TenantMember.tenant_id == tenant_id, TenantMember.user_id == user_id).first()
    if not member:
        return False
    db.delete(member)
    db.commit()
    return True


def get_members(db: Session, tenant_id: int) -> List[TenantMember]:
    return db.query(TenantMember).filter(TenantMember.tenant_id == tenant_id).all()


def get_tenant_quota(db: Session, tenant_id: int) -> Optional[Dict[str, Any]]:
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        return None
    current_users = db.query(func.count(TenantMember.id)).filter(TenantMember.tenant_id == tenant_id).scalar() or 0
    today = datetime.now().strftime("%Y-%m-%d")
    usage = db.query(UsageRecord).filter(UsageRecord.tenant_id == tenant_id, UsageRecord.period == today).all()
    current_alerts = 0
    current_api = 0
    for u in usage:
        if u.metric == "alerts":
            current_alerts = u.value
        elif u.metric == "api_calls":
            current_api = u.value
    return {
        "plan": tenant.plan,
        "max_users": tenant.max_users,
        "max_alerts_per_day": tenant.max_alerts_per_day,
        "max_api_calls_per_day": tenant.max_api_calls_per_day,
        "current_users": current_users,
        "current_alerts_today": current_alerts,
        "current_api_calls_today": current_api,
    }


def record_usage(db: Session, tenant_id: int, metric: str, value: int = 1) -> UsageRecord:
    today = datetime.now().strftime("%Y-%m-%d")
    existing = db.query(UsageRecord).filter(UsageRecord.tenant_id == tenant_id, UsageRecord.metric == metric, UsageRecord.period == today).first()
    if existing:
        existing.value += value
        db.commit()
        db.refresh(existing)
        return existing
    record = UsageRecord(tenant_id=tenant_id, metric=metric, value=value, period=today)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def check_alert_quota(db: Session, tenant_id: int) -> Dict[str, Any]:
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        return {"allowed": False, "reason": "租户不存在"}

    max_alerts = tenant.max_alerts_per_day
    if max_alerts == -1:
        return {"allowed": True, "current": 0, "limit": -1, "remaining": -1}

    today = datetime.now().strftime("%Y-%m-%d")
    current_alerts = (
        db.query(func.coalesce(func.sum(UsageRecord.value), 0))
        .filter(
            UsageRecord.tenant_id == tenant_id,
            UsageRecord.metric == "alerts",
            UsageRecord.period == today,
        )
        .scalar()
    )

    remaining = max(0, max_alerts - current_alerts)
    allowed = current_alerts < max_alerts

    return {
        "allowed": allowed,
        "current": current_alerts,
        "limit": max_alerts,
        "remaining": remaining,
    }


def record_alert_usage(db: Session, tenant_id: int, count: int = 1) -> Dict[str, Any]:
    quota = check_alert_quota(db, tenant_id)
    if not quota["allowed"]:
        return {"recorded": False, "reason": "已达到每日告警配额上限", "quota": quota}

    record_usage(db, tenant_id, metric="alerts", value=count)
    updated_quota = check_alert_quota(db, tenant_id)
    return {"recorded": True, "quota": updated_quota}


def create_subscription(db: Session, tenant_id: int, plan: str, payment_method: Optional[str] = None) -> Subscription:
    price = PLAN_PRICES.get(plan, 0)
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
    now = datetime.now()
    sub = Subscription(
        tenant_id=tenant_id,
        plan=plan,
        status="active",
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
        amount=price,
        payment_method=payment_method,
    )
    db.add(sub)
    db.flush()

    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if tenant:
        tenant.plan = plan
        tenant.max_users = limits["max_users"]
        tenant.max_alerts_per_day = limits["max_alerts_per_day"]
        tenant.max_api_calls_per_day = limits["max_api_calls_per_day"]
        tenant.status = "active"

    db.commit()
    db.refresh(sub)
    return sub


def get_subscription(db: Session, tenant_id: int) -> Optional[Subscription]:
    return db.query(Subscription).filter(Subscription.tenant_id == tenant_id).order_by(Subscription.id.desc()).first()
