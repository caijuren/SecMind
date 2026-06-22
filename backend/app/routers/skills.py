"""Skill管理路由"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.services import mcp_skill_service

router = APIRouter(prefix="/skills", tags=["Skill管理"])


# ────────────────────── 请求模型 ──────────────────────

class SkillCreate(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    category: str = "investigation"
    skill_type: str = "atomic"
    required_connectors: Optional[list] = None
    parameters: Optional[list] = None
    script_path: Optional[str] = None
    script_content: Optional[str] = None
    execution_timeout: int = 300
    trigger_mode: str = "manual"
    tenant_id: Optional[int] = None


class SkillUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    skill_type: Optional[str] = None
    required_connectors: Optional[list] = None
    parameters: Optional[list] = None
    script_path: Optional[str] = None
    script_content: Optional[str] = None
    execution_timeout: Optional[int] = None
    is_active: Optional[bool] = None
    trigger_mode: Optional[str] = None


class SkillExecuteBody(BaseModel):
    parameters: dict = {}


# ────────────────────── 接口 ──────────────────────

@router.get("")
def list_skills(
    category: Optional[str] = Query(None, description="分类过滤"),
    skill_type: Optional[str] = Query(None, description="类型过滤"),
    is_active: Optional[bool] = Query(None, description="是否启用过滤"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """获取Skill列表"""
    return mcp_skill_service.list_skills(db, category=category, skill_type=skill_type, is_active=is_active, skip=skip, limit=limit)


@router.post("")
def create_skill(body: SkillCreate, db: Session = Depends(get_db)):
    """创建Skill定义"""
    try:
        skill = mcp_skill_service.create_skill(db, body.model_dump(exclude_unset=True))
        return skill
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{skill_id}")
def update_skill(skill_id: int, body: SkillUpdate, db: Session = Depends(get_db)):
    """更新Skill定义"""
    try:
        skill = mcp_skill_service.update_skill(db, skill_id, body.model_dump(exclude_unset=True))
        if not skill:
            raise HTTPException(status_code=404, detail="Skill不存在")
        return skill
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{skill_id}")
def delete_skill(skill_id: int, db: Session = Depends(get_db)):
    """删除Skill定义"""
    success = mcp_skill_service.delete_skill(db, skill_id)
    if not success:
        raise HTTPException(status_code=404, detail="Skill不存在")
    return {"message": "删除成功"}


@router.post("/{skill_id}/execute")
async def execute_skill(skill_id: int, body: SkillExecuteBody, db: Session = Depends(get_db)):
    """执行Skill"""
    try:
        execution = await mcp_skill_service.execute_skill(db, skill_id, body.parameters)
        return execution
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{skill_id}/executions")
def get_skill_executions(
    skill_id: int,
    status: Optional[str] = Query(None, description="状态过滤"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """获取Skill执行历史"""
    return mcp_skill_service.get_execution_history(db, skill_id=skill_id, status=status, skip=skip, limit=limit)


@router.get("/executions/{execution_id}")
def get_execution_detail(execution_id: int, db: Session = Depends(get_db)):
    """获取执行记录详情"""
    execution = mcp_skill_service.get_execution_by_id(db, execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="执行记录不存在")
    return execution


@router.post("/seed")
def seed_skills(db: Session = Depends(get_db)):
    """填充示例Skill数据（用于演示）"""
    result = mcp_skill_service.seed_sample_data(db)
    return result
