from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from app.models.integration_adapter import IntegrationAdapter, WebhookInbound


def get_adapters(db: Session, adapter_type: Optional[str] = None, skip: int = 0, limit: int = 50) -> Dict[str, Any]:
    query = db.query(IntegrationAdapter)
    if adapter_type:
        query = query.filter(IntegrationAdapter.adapter_type == adapter_type)
    total = query.count()
    items = query.order_by(IntegrationAdapter.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


def get_adapter_by_id(db: Session, adapter_id: int) -> Optional[IntegrationAdapter]:
    return db.query(IntegrationAdapter).filter(IntegrationAdapter.id == adapter_id).first()


def create_adapter(db: Session, data: dict) -> IntegrationAdapter:
    adapter = IntegrationAdapter(**data)
    db.add(adapter)
    db.commit()
    db.refresh(adapter)
    return adapter


def update_adapter(db: Session, adapter_id: int, data: dict) -> Optional[IntegrationAdapter]:
    adapter = db.query(IntegrationAdapter).filter(IntegrationAdapter.id == adapter_id).first()
    if not adapter:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(adapter, key, value)
    db.commit()
    db.refresh(adapter)
    return adapter


def delete_adapter(db: Session, adapter_id: int) -> bool:
    adapter = db.query(IntegrationAdapter).filter(IntegrationAdapter.id == adapter_id).first()
    if not adapter:
        return False
    db.delete(adapter)
    db.commit()
    return True


def receive_webhook(db: Session, data: dict) -> WebhookInbound:
    webhook = WebhookInbound(**data)
    db.add(webhook)
    db.commit()
    db.refresh(webhook)
    return webhook


def get_webhooks(db: Session, source: Optional[str] = None, skip: int = 0, limit: int = 50) -> Dict[str, Any]:
    query = db.query(WebhookInbound)
    if source:
        query = query.filter(WebhookInbound.source == source)
    total = query.count()
    items = query.order_by(WebhookInbound.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}
