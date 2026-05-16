from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from app.schemas.ai_model import (
    AIModelCreate,
    AIModelUpdate,
    AIModelRead,
    RoutingCreate,
    RoutingRead,
    RouteRequest,
    RouteResponse,
    ModelCallLogRead,
    ModelStats,
)
from app.services.ai_model_service import (
    seed_ai_models,
    get_models,
    get_model,
    create_model,
    update_model,
    get_routings,
    get_routing,
    create_routing,
    route_request,
    get_model_stats,
    get_call_logs,
)
from app.database import get_db

router = APIRouter(prefix="/ai-models", tags=["AI模型路由"])


@router.post("/seed")
def seed_models(db: Session = Depends(get_db)):
    count = seed_ai_models(db)
    return {"seeded": count}


@router.get("", response_model=list[AIModelRead])
def list_models(active_only: bool = Query(False), db: Session = Depends(get_db)):
    return get_models(db, active_only=active_only)


@router.get("/stats", response_model=ModelStats)
def model_stats(db: Session = Depends(get_db)):
    return get_model_stats(db)


@router.get("/routings", response_model=list[RoutingRead])
def list_routings(db: Session = Depends(get_db)):
    return get_routings(db)


@router.get("/logs", response_model=list[ModelCallLogRead])
def list_logs(model_id: Optional[int] = None, limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    return get_call_logs(db, model_id=model_id, limit=limit)


@router.get("/{model_id}", response_model=AIModelRead)
def get_model_detail(model_id: int, db: Session = Depends(get_db)):
    model = get_model(db, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="模型不存在")
    return model


@router.post("", response_model=AIModelRead, status_code=201)
def create_new_model(body: AIModelCreate, db: Session = Depends(get_db)):
    return create_model(db, body.model_dump())


@router.put("/{model_id}", response_model=AIModelRead)
def update_existing_model(model_id: int, body: AIModelUpdate, db: Session = Depends(get_db)):
    model = update_model(db, model_id, body.model_dump(exclude_unset=True))
    if not model:
        raise HTTPException(status_code=404, detail="模型不存在")
    return model


@router.post("/routings", response_model=RoutingRead, status_code=201)
def create_new_routing(body: RoutingCreate, db: Session = Depends(get_db)):
    existing = get_routing(db, body.task_type)
    if existing:
        raise HTTPException(status_code=400, detail="该任务类型路由已存在")
    return create_routing(db, body.model_dump())


@router.post("/route", response_model=RouteResponse)
def route_task(body: RouteRequest, db: Session = Depends(get_db)):
    result = route_request(db, body.task_type, body.input_text, body.max_tokens)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
