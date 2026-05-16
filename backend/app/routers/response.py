from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from app.schemas.response_action import (
    ResponseActionCreate,
    ResponseActionUpdate,
    ResponseActionRead,
    ResponseActionListResponse,
    ActionApproveRequest,
    ActionCancelRequest,
    ActionResultRequest,
    ResponseActionStats,
)
from app.services.response_service import (
    get_actions,
    get_action_by_id,
    create_action,
    update_action,
    transition_status,
    get_action_stats,
)
from app.database import get_db

router = APIRouter(prefix="/response", tags=["处置执行"])


@router.get("/actions", response_model=ResponseActionListResponse)
def list_actions(
    status: Optional[str] = Query(None, description="状态筛选"),
    priority: Optional[str] = Query(None, description="优先级筛选"),
    action_type: Optional[str] = Query(None, description="动作类型筛选"),
    hypothesis_id: Optional[str] = Query(None, description="假说ID筛选"),
    alert_id: Optional[int] = Query(None, description="关联告警ID"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db),
):
    return get_actions(
        db=db,
        status=status,
        priority=priority,
        action_type=action_type,
        hypothesis_id=hypothesis_id,
        alert_id=alert_id,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.get("/actions/stats", response_model=ResponseActionStats)
def action_stats(db: Session = Depends(get_db)):
    return get_action_stats(db=db)


@router.get("/actions/{action_id}", response_model=ResponseActionRead)
def get_action(action_id: int, db: Session = Depends(get_db)):
    action = get_action_by_id(db, action_id)
    if not action:
        raise HTTPException(status_code=404, detail="处置动作不存在")
    return action


@router.post("/actions", response_model=ResponseActionRead, status_code=201)
def create_new_action(body: ResponseActionCreate, db: Session = Depends(get_db)):
    action = create_action(db, body.model_dump())
    return action


@router.put("/actions/{action_id}", response_model=ResponseActionRead)
def update_existing_action(
    action_id: int,
    body: ResponseActionUpdate,
    db: Session = Depends(get_db),
):
    action = update_action(db, action_id, body.model_dump(exclude_unset=True))
    if not action:
        raise HTTPException(status_code=404, detail="处置动作不存在")
    return action


@router.post("/actions/{action_id}/execute", response_model=ResponseActionRead)
def execute_action(action_id: int, db: Session = Depends(get_db)):
    action = transition_status(db, action_id, "executing")
    if not action:
        raise HTTPException(status_code=400, detail="无法执行：当前状态不允许转换到 executing")
    return action


@router.post("/actions/{action_id}/approve", response_model=ResponseActionRead)
def approve_action(
    action_id: int,
    body: ActionApproveRequest,
    db: Session = Depends(get_db),
):
    action = transition_status(
        db, action_id, "approved", approved_by=body.approved_by
    )
    if not action:
        raise HTTPException(status_code=400, detail="无法审批：当前状态不允许转换到 approved")
    return action


@router.post("/actions/{action_id}/cancel", response_model=ResponseActionRead)
def cancel_action(
    action_id: int,
    body: ActionCancelRequest,
    db: Session = Depends(get_db),
):
    action = transition_status(
        db,
        action_id,
        "cancelled",
        cancelled_by=body.cancelled_by,
        cancel_reason=body.reason,
    )
    if not action:
        raise HTTPException(status_code=400, detail="无法取消：当前状态不允许转换到 cancelled")
    return action


@router.post("/actions/{action_id}/complete", response_model=ResponseActionRead)
def complete_action(
    action_id: int,
    body: ActionResultRequest,
    db: Session = Depends(get_db),
):
    action = transition_status(db, action_id, "completed", result=body.result)
    if not action:
        raise HTTPException(status_code=400, detail="无法完成：当前状态不允许转换到 completed")
    return action


@router.post("/actions/{action_id}/fail", response_model=ResponseActionRead)
def fail_action(
    action_id: int,
    body: ActionResultRequest,
    db: Session = Depends(get_db),
):
    action = transition_status(db, action_id, "failed", result=body.result)
    if not action:
        raise HTTPException(status_code=400, detail="无法标记失败：当前状态不允许转换到 failed")
    return action


@router.post("/actions/{action_id}/submit-approval", response_model=ResponseActionRead)
def submit_for_approval(action_id: int, db: Session = Depends(get_db)):
    action = transition_status(db, action_id, "awaiting_approval")
    if not action:
        raise HTTPException(status_code=400, detail="无法提交审批：当前状态不允许转换到 awaiting_approval")
    return action


@router.post("/actions/{action_id}/retry", response_model=ResponseActionRead)
def retry_action(action_id: int, db: Session = Depends(get_db)):
    action = transition_status(db, action_id, "pending")
    if not action:
        raise HTTPException(status_code=400, detail="无法重试：只有 failed 状态可以重试")
    return action
