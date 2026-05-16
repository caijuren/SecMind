from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.schemas.billing import (
    OrderCreate,
    OrderRead,
    InvoiceRead,
    InvoiceRequest,
    ConversionPreview,
    TrialStatus,
)
from app.services.billing_service import (
    get_trial_status,
    preview_conversion,
    create_order,
    simulate_payment,
    request_invoice,
    get_orders,
    get_order,
    get_invoices,
    cancel_order,
)
from app.database import get_db

router = APIRouter(prefix="/billing", tags=["账单与转化"])


@router.get("/tenants/{tenant_id}/trial-status", response_model=TrialStatus)
def trial_status(tenant_id: int, db: Session = Depends(get_db)):
    result = get_trial_status(db, tenant_id)
    if not result:
        raise HTTPException(status_code=404, detail="租户不存在")
    return result


@router.get("/tenants/{tenant_id}/conversion-preview", response_model=ConversionPreview)
def conversion_preview(tenant_id: int, target_plan: str, db: Session = Depends(get_db)):
    result = preview_conversion(db, tenant_id, target_plan)
    if not result:
        raise HTTPException(status_code=404, detail="租户不存在")
    return result


@router.post("/tenants/{tenant_id}/orders", response_model=OrderRead, status_code=201)
def create_new_order(tenant_id: int, body: OrderCreate, db: Session = Depends(get_db)):
    order = create_order(db, tenant_id, body.plan, body.payment_method, body.metadata_)
    return order


@router.get("/tenants/{tenant_id}/orders", response_model=list[OrderRead])
def list_orders(tenant_id: int, db: Session = Depends(get_db)):
    return get_orders(db, tenant_id)


@router.get("/orders/{order_id}", response_model=OrderRead)
def get_order_detail(order_id: int, db: Session = Depends(get_db)):
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.post("/orders/{order_id}/pay", response_model=OrderRead)
def pay_order(order_id: int, db: Session = Depends(get_db)):
    order = simulate_payment(db, order_id)
    if not order:
        raise HTTPException(status_code=400, detail="订单不存在或无法支付")
    return order


@router.post("/orders/{order_id}/cancel", response_model=OrderRead)
def cancel_order_endpoint(order_id: int, db: Session = Depends(get_db)):
    order = cancel_order(db, order_id)
    if not order:
        raise HTTPException(status_code=400, detail="订单不存在或无法取消")
    return order


@router.post("/orders/{order_id}/invoice", response_model=InvoiceRead, status_code=201)
def create_invoice(order_id: int, body: InvoiceRequest, db: Session = Depends(get_db)):
    invoice = request_invoice(db, order_id, body.title, body.buyer_name, body.buyer_tax_no)
    if not invoice:
        raise HTTPException(status_code=400, detail="订单不存在或未支付")
    return invoice


@router.get("/tenants/{tenant_id}/invoices", response_model=list[InvoiceRead])
def list_invoices(tenant_id: int, db: Session = Depends(get_db)):
    return get_invoices(db, tenant_id)
