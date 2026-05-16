from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.integration import IntegrationApp, Webhook
from app.schemas.integration import (
    IntegrationAppCreate,
    IntegrationAppRead,
    IntegrationAppUpdate,
    WebhookCreate,
    WebhookRead,
    WebhookUpdate,
)

router = APIRouter(prefix="/integrations", tags=["集成管理"])


@router.get("/apps")
def list_apps(db: Session = Depends(get_db)):
    apps = db.query(IntegrationApp).order_by(IntegrationApp.id.asc()).all()
    return {"total": len(apps), "items": apps}


@router.post("/apps", response_model=IntegrationAppRead)
def create_app(body: IntegrationAppCreate, db: Session = Depends(get_db)):
    existing = db.query(IntegrationApp).filter(IntegrationApp.slug == body.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="该集成已存在")
    app = IntegrationApp(**body.model_dump())
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.put("/apps/{app_id}", response_model=IntegrationAppRead)
def update_app(app_id: int, body: IntegrationAppUpdate, db: Session = Depends(get_db)):
    app = db.query(IntegrationApp).filter(IntegrationApp.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="集成不存在")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(app, key, value)
    if body.status == "connected":
        app.last_sync = datetime.now().strftime("%Y-%m-%d %H:%M")
    db.commit()
    db.refresh(app)
    return app


@router.get("/webhooks")
def list_webhooks(db: Session = Depends(get_db)):
    webhooks = db.query(Webhook).order_by(Webhook.id.asc()).all()
    return {"total": len(webhooks), "items": webhooks}


@router.post("/webhooks", response_model=WebhookRead)
def create_webhook(body: WebhookCreate, db: Session = Depends(get_db)):
    webhook = Webhook(**body.model_dump())
    db.add(webhook)
    db.commit()
    db.refresh(webhook)
    return webhook


@router.put("/webhooks/{webhook_id}", response_model=WebhookRead)
def update_webhook(webhook_id: int, body: WebhookUpdate, db: Session = Depends(get_db)):
    webhook = db.query(Webhook).filter(Webhook.id == webhook_id).first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook 不存在")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(webhook, key, value)
    db.commit()
    db.refresh(webhook)
    return webhook
