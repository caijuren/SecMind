from typing import Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.services.execution_engine import engine

router = APIRouter(prefix="/execution", tags=["处置执行"])


class ExecuteRequest(BaseModel):
    action_type: str
    target: str
    params: Optional[dict] = None


@router.post("/execute")
async def execute_action(body: ExecuteRequest):
    return await engine.execute(
        action_type=body.action_type,
        target=body.target,
        params=body.params,
    )


@router.post("/rollback/{execution_id}")
async def rollback_action(execution_id: str):
    return await engine.rollback(execution_id)


@router.get("/status/{execution_id}")
async def check_status(execution_id: str):
    return await engine.check_status(execution_id)


@router.get("/capabilities")
def list_capabilities():
    return engine.list_capabilities()


@router.get("/history")
def execution_history(limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
    return engine.execution_history(limit=limit, offset=offset)
