from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.model_router import model_router

router = APIRouter(prefix="/ai/models", tags=["AI模型路由"])


class RouteRequest(BaseModel):
    task_type: str
    prompt: str
    priority: Optional[str] = "balanced"
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 4096


class SelectRequest(BaseModel):
    task_type: str
    priority: Optional[str] = "balanced"


class ModelInfo(BaseModel):
    name: str
    provider: str
    capabilities: List[str]
    cost_per_1k_tokens: float
    max_tokens: int
    latency_ms: int
    quality_score: float
    available: bool


class SelectResponse(BaseModel):
    model: str
    provider: str
    priority: str
    task_type: str
    candidates: List[str]


class RouteResponse(BaseModel):
    model: Optional[str] = None
    provider: Optional[str] = None
    content: str
    input_tokens: int
    output_tokens: int
    latency_ms: int
    cost: float
    priority: str
    fallback_used: bool
    error: Optional[str] = None


class ModelStatsItem(BaseModel):
    calls: int
    successes: int
    failures: int
    success_rate: float
    avg_latency_ms: float
    total_cost: float
    total_input_tokens: int
    total_output_tokens: int


class StatsSummary(BaseModel):
    total_calls: int
    total_successes: int
    total_failures: int
    overall_success_rate: float
    total_cost: float
    avg_latency_ms: float


class StatsResponse(BaseModel):
    models: dict[str, ModelStatsItem]
    summary: StatsSummary


@router.get("/available", response_model=List[ModelInfo])
def get_available_models():
    return model_router.get_available_models()


@router.get("/stats", response_model=StatsResponse)
def get_model_stats():
    return model_router.get_model_stats()


@router.post("/route", response_model=RouteResponse)
async def route_request(body: RouteRequest):
    if body.priority not in ("quality", "cost", "speed", "balanced"):
        raise HTTPException(status_code=400, detail="priority 必须为 quality/cost/speed/balanced")
    if body.task_type not in model_router.TASK_MODEL_PREFERENCE:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的任务类型: {body.task_type}，支持: {list(model_router.TASK_MODEL_PREFERENCE.keys())}",
        )
    result = await model_router.route_request(
        task_type=body.task_type,
        prompt=body.prompt,
        priority=body.priority,
        temperature=body.temperature,
        max_tokens=body.max_tokens,
    )
    return result


@router.post("/select", response_model=SelectResponse)
def select_model(body: SelectRequest):
    if body.priority not in ("quality", "cost", "speed", "balanced"):
        raise HTTPException(status_code=400, detail="priority 必须为 quality/cost/speed/balanced")
    if body.task_type not in model_router.TASK_MODEL_PREFERENCE:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的任务类型: {body.task_type}，支持: {list(model_router.TASK_MODEL_PREFERENCE.keys())}",
        )
    selected = model_router.select_model(body.task_type, body.priority)
    model_info = model_router.MODELS.get(selected, {})
    candidates = model_router.TASK_MODEL_PREFERENCE.get(body.task_type, [])
    return SelectResponse(
        model=selected,
        provider=model_info.get("provider", ""),
        priority=body.priority,
        task_type=body.task_type,
        candidates=candidates,
    )
