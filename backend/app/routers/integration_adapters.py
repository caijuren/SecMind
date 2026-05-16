from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from app.schemas.integration_adapter import (
    AdapterCreate,
    AdapterUpdate,
    AdapterRead,
    WebhookInboundCreate,
    WebhookInboundRead,
)
from typing import List as TypingList
from pydantic import BaseModel


class AdapterListResponse(BaseModel):
    total: int
    items: TypingList[AdapterRead]


class WebhookListResponse(BaseModel):
    total: int
    items: TypingList[WebhookInboundRead]
from app.services.integration_adapter_service import (
    get_adapters,
    get_adapter_by_id,
    create_adapter,
    update_adapter,
    delete_adapter,
    receive_webhook,
    get_webhooks,
)
from app.database import get_db

router = APIRouter(prefix="/integrations", tags=["集成中心"])


@router.get("/adapters", response_model=AdapterListResponse)
def list_adapters(adapter_type: Optional[str] = Query(None), skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
    return get_adapters(db, adapter_type=adapter_type, skip=skip, limit=limit)


@router.get("/adapters/{adapter_id}", response_model=AdapterRead)
def get_adapter(adapter_id: int, db: Session = Depends(get_db)):
    adapter = get_adapter_by_id(db, adapter_id)
    if not adapter:
        raise HTTPException(status_code=404, detail="适配器不存在")
    return adapter


@router.post("/adapters", response_model=AdapterRead, status_code=201)
def create_new_adapter(body: AdapterCreate, db: Session = Depends(get_db)):
    return create_adapter(db, body.model_dump())


@router.put("/adapters/{adapter_id}", response_model=AdapterRead)
def update_existing_adapter(adapter_id: int, body: AdapterUpdate, db: Session = Depends(get_db)):
    adapter = update_adapter(db, adapter_id, body.model_dump(exclude_unset=True))
    if not adapter:
        raise HTTPException(status_code=404, detail="适配器不存在")
    return adapter


@router.delete("/adapters/{adapter_id}", status_code=204)
def remove_adapter(adapter_id: int, db: Session = Depends(get_db)):
    if not delete_adapter(db, adapter_id):
        raise HTTPException(status_code=404, detail="适配器不存在")


@router.post("/webhooks/inbound", response_model=WebhookInboundRead, status_code=201)
def receive_inbound_webhook(body: WebhookInboundCreate, db: Session = Depends(get_db)):
    return receive_webhook(db, body.model_dump())


@router.get("/webhooks/inbound", response_model=WebhookListResponse)
def list_webhooks(source: Optional[str] = Query(None), skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
    return get_webhooks(db, source=source, skip=skip, limit=limit)
