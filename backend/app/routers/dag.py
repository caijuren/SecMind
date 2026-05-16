from typing import Optional, List, Any

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.dag_engine import dag_engine

router = APIRouter(prefix="/dag", tags=["DAG执行引擎"])


class DAGValidateRequest(BaseModel):
    nodes: List[Any]
    edges: List[Any]


class DAGValidateResponse(BaseModel):
    valid: bool
    errors: List[str] = []


@router.post("/validate", response_model=DAGValidateResponse)
def validate_dag(body: DAGValidateRequest):
    result = dag_engine.validate_dag(body.nodes, body.edges)
    return result


@router.post("/execute/{playbook_id}")
async def execute_dag(playbook_id: int, db: Session = Depends(get_db)):
    result = await dag_engine.execute_dag(playbook_id, db)
    if result.get("status") == "failed" and result.get("error") == "剧本不存在":
        raise HTTPException(status_code=404, detail="剧本不存在")
    if result.get("status") == "failed" and result.get("error") == "DAG验证失败":
        raise HTTPException(status_code=400, detail=result)
    return result


@router.get("/status/{execution_id}")
def get_execution_status(execution_id: str):
    result = dag_engine.get_status(execution_id)
    if result.get("status") == "not_found":
        raise HTTPException(status_code=404, detail="执行记录不存在")
    return result


@router.get("/history")
def get_execution_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return dag_engine.get_history(limit=limit, offset=offset)
