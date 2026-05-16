from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime


class AIModelCreate(BaseModel):
    name: str
    provider: str
    model_id: str
    description: Optional[str] = None
    capabilities: Optional[List[str]] = None
    max_tokens: Optional[int] = 4096
    cost_per_1k_input: Optional[float] = 0.0
    cost_per_1k_output: Optional[float] = 0.0
    latency_ms: Optional[int] = 0
    accuracy_score: Optional[float] = 0.0
    is_active: Optional[bool] = True
    priority: Optional[int] = 0
    config: Optional[Any] = None


class AIModelUpdate(BaseModel):
    provider: Optional[str] = None
    model_id: Optional[str] = None
    description: Optional[str] = None
    capabilities: Optional[List[str]] = None
    max_tokens: Optional[int] = None
    cost_per_1k_input: Optional[float] = None
    cost_per_1k_output: Optional[float] = None
    latency_ms: Optional[int] = None
    accuracy_score: Optional[float] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None
    config: Optional[Any] = None


class AIModelRead(BaseModel):
    id: int
    name: str
    provider: str
    model_id: str
    description: Optional[str] = None
    capabilities: Optional[List[str]] = None
    max_tokens: int
    cost_per_1k_input: float
    cost_per_1k_output: float
    latency_ms: int
    accuracy_score: float
    is_active: bool
    priority: int
    config: Optional[Any] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RoutingCreate(BaseModel):
    task_type: str
    model_id: int
    routing_strategy: Optional[str] = "priority"
    fallback_model_id: Optional[int] = None
    config: Optional[Any] = None


class RoutingRead(BaseModel):
    id: int
    task_type: str
    model_id: int
    routing_strategy: str
    fallback_model_id: Optional[int] = None
    config: Optional[Any] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ModelCallLogRead(BaseModel):
    id: int
    model_id: int
    task_type: str
    input_tokens: int
    output_tokens: int
    latency_ms: int
    cost: float
    status: str
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RouteRequest(BaseModel):
    task_type: str
    input_text: str
    max_tokens: Optional[int] = None


class RouteResponse(BaseModel):
    model_id: int
    model_name: str
    provider: str
    output: str
    input_tokens: int
    output_tokens: int
    latency_ms: int
    cost: float
    routing_strategy: str
    fallback_used: bool


class ModelStats(BaseModel):
    total_calls: int
    success_rate: float
    avg_latency_ms: float
    total_cost: float
    calls_by_model: dict
    calls_by_task: dict
