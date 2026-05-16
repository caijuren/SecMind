import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.tenant import Tenant, Subscription
from app.models.billing import Order, Invoice
from app.services.tenant_service import PLAN_LIMITS, PLAN_PRICES


def _gen_order_no() -> str:
    now = datetime.now()
    return f"ORD{now.strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"


def _gen_invoice_no() -> str:
    now = datetime.now()
    return f"INV{now.strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"


def get_trial_status(db: Session, tenant_id: int) -> Optional[Dict[str, Any]]:
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        return None
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).order_by(Subscription.id.desc()).first()
    is_trial = sub.status == "trial" if sub else False
    trial_ends_at = sub.trial_ends_at if sub else None
    days_remaining = 0
    is_expired = False
    if trial_ends_at:
        delta = trial_ends_at - datetime.now()
        days_remaining = max(0, delta.days)
        is_expired = delta.total_seconds() <= 0
    return {
        "is_trial": is_trial,
        "trial_ends_at": trial_ends_at,
        "days_remaining": days_remaining,
        "is_expired": is_expired,
        "plan": tenant.plan,
    }


def preview_conversion(db: Session, tenant_id: int, target_plan: str) -> Optional[Dict[str, Any]]:
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        return None
    current_price = PLAN_PRICES.get(tenant.plan, 0)
    target_price = PLAN_PRICES.get(target_plan, 0)
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).order_by(Subscription.id.desc()).first()
    proration_days = 0
    proration_amount = 0.0
    if sub and sub.current_period_end:
        delta = sub.current_period_end - datetime.now()
        proration_days = max(0, delta.days)
        if current_price > 0 and proration_days > 0:
            daily_current = current_price / 30
            daily_target = target_price / 30
            proration_amount = round((daily_target - daily_current) * proration_days, 2)
    total_amount = max(0, target_price + proration_amount)
    return {
        "current_plan": tenant.plan,
        "target_plan": target_plan,
        "current_price": current_price,
        "target_price": target_price,
        "proration_days": proration_days,
        "proration_amount": proration_amount,
        "total_amount": total_amount,
    }


def create_order(db: Session, tenant_id: int, plan: str, payment_method: Optional[str] = None, metadata: Optional[Dict] = None) -> Order:
    amount = PLAN_PRICES.get(plan, 0)
    order = Order(
        tenant_id=tenant_id,
        order_no=_gen_order_no(),
        plan=plan,
        amount=amount,
        currency="CNY",
        status="pending",
        payment_method=payment_method,
        metadata_=metadata,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def simulate_payment(db: Session, order_id: int) -> Optional[Order]:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order or order.status != "pending":
        return None
    order.status = "paid"
    order.paid_at = datetime.now()
    db.flush()

    tenant = db.query(Tenant).filter(Tenant.id == order.tenant_id).first()
    if tenant:
        limits = PLAN_LIMITS.get(order.plan, PLAN_LIMITS["free"])
        tenant.plan = order.plan
        tenant.max_users = limits["max_users"]
        tenant.max_alerts_per_day = limits["max_alerts_per_day"]
        tenant.max_api_calls_per_day = limits["max_api_calls_per_day"]
        tenant.status = "active"
        if tenant.expires_at and tenant.expires_at < datetime.now():
            tenant.expires_at = datetime.now() + timedelta(days=30)

    sub = Subscription(
        tenant_id=order.tenant_id,
        plan=order.plan,
        status="active",
        current_period_start=datetime.now(),
        current_period_end=datetime.now() + timedelta(days=30),
        amount=order.amount,
        payment_method=order.payment_method,
    )
    db.add(sub)
    db.commit()
    db.refresh(order)
    return order


def request_invoice(db: Session, order_id: int, title: Optional[str] = None, buyer_name: Optional[str] = None, buyer_tax_no: Optional[str] = None) -> Optional[Invoice]:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order or order.status != "paid":
        return None
    tax_rate = 0.06
    tax_amount = round(order.amount * tax_rate, 2)
    total_amount = round(order.amount + tax_amount, 2)
    invoice = Invoice(
        tenant_id=order.tenant_id,
        order_id=order.id,
        invoice_no=_gen_invoice_no(),
        title=title or f"SecMind {order.plan.upper()} 订阅服务费",
        amount=order.amount,
        tax_rate=tax_rate,
        tax_amount=tax_amount,
        total_amount=total_amount,
        status="issued",
        buyer_name=buyer_name,
        buyer_tax_no=buyer_tax_no,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


def get_orders(db: Session, tenant_id: int) -> List[Order]:
    return db.query(Order).filter(Order.tenant_id == tenant_id).order_by(Order.id.desc()).all()


def get_order(db: Session, order_id: int) -> Optional[Order]:
    return db.query(Order).filter(Order.id == order_id).first()


def get_invoices(db: Session, tenant_id: int) -> List[Invoice]:
    return db.query(Invoice).filter(Invoice.tenant_id == tenant_id).order_by(Invoice.id.desc()).all()


def cancel_order(db: Session, order_id: int) -> Optional[Order]:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order or order.status != "pending":
        return None
    order.status = "cancelled"
    db.commit()
    db.refresh(order)
    return order
