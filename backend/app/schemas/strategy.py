from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime


class StrategyCreate(BaseModel):
    name: str
    strategy_type: str
    description: Optional[str] = None
    rules: List[dict]
    conditions: Optional[List[dict]] = None
    actions: Optional[List[dict]] = None
    confidence_threshold: Optional[float] = 0.8
    priority: Optional[int] = 0


class StrategyUpdate(BaseModel):
    description: Optional[str] = None
    rules: Optional[List[dict]] = None
    conditions: Optional[List[dict]] = None
    actions: Optional[List[dict]] = None
    confidence_threshold: Optional[float] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None


class StrategyRead(BaseModel):
    id: int
    name: str
    strategy_type: str
    description: Optional[str] = None
    rules: Any
    conditions: Optional[Any] = None
    actions: Optional[Any] = None
    confidence_threshold: float
    priority: int
    is_active: bool
    version: int
    parent_id: Optional[int] = None
    fitness_score: float
    total_executions: int
    success_count: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FeedbackCreate(BaseModel):
    strategy_id: int
    execution_id: Optional[str] = None
    outcome: str
    context: Optional[dict] = None
    reward: Optional[float] = 0.0
    comment: Optional[str] = None


class FeedbackRead(BaseModel):
    id: int
    strategy_id: int
    execution_id: Optional[str] = None
    outcome: str
    context: Optional[Any] = None
    reward: float
    comment: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EvolutionRead(BaseModel):
    id: int
    strategy_id: int
    old_version: int
    new_version: int
    change_type: str
    change_description: Optional[str] = None
    old_rules: Optional[Any] = None
    new_rules: Optional[Any] = None
    trigger_reason: Optional[str] = None
    fitness_before: Optional[float] = None
    fitness_after: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EvolveRequest(BaseModel):
    strategy_id: int
    feedback_window: Optional[int] = 50


class EvolveResponse(BaseModel):
    strategy_id: int
    evolved: bool
    old_version: int
    new_version: int
    change_type: Optional[str] = None
    change_description: Optional[str] = None
    fitness_before: float
    fitness_after: float
