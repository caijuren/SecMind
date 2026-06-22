"""MCP连接器管理路由"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.services import mcp_skill_service

router = APIRouter(prefix="/mcp", tags=["MCP管理"])


# ────────────────────── 请求模型 ──────────────────────

class ConnectorCreate(BaseModel):
    name: str
    display_name: str
    connector_type: str = "api"
    endpoint_url: Optional[str] = None
    api_key: Optional[str] = None
    config: Optional[dict] = None
    tenant_id: Optional[int] = None


class ConnectorUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    connector_type: Optional[str] = None
    endpoint_url: Optional[str] = None
    api_key: Optional[str] = None
    config: Optional[dict] = None
    is_active: Optional[bool] = None
    status: Optional[str] = None


# ────────────────────── 接口 ──────────────────────

@router.get("/connectors")
def list_connectors(
    connector_type: Optional[str] = Query(None, description="连接器类型过滤"),
    is_active: Optional[bool] = Query(None, description="是否启用过滤"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """获取MCP连接器列表"""
    return mcp_skill_service.list_connectors(db, connector_type=connector_type, is_active=is_active, skip=skip, limit=limit)


@router.post("/connectors")
def create_connector(body: ConnectorCreate, db: Session = Depends(get_db)):
    """创建MCP连接器"""
    try:
        connector = mcp_skill_service.create_connector(db, body.model_dump(exclude_unset=True))
        return connector
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/connectors/{connector_id}")
def update_connector(connector_id: int, body: ConnectorUpdate, db: Session = Depends(get_db)):
    """更新MCP连接器"""
    try:
        connector = mcp_skill_service.update_connector(db, connector_id, body.model_dump(exclude_unset=True))
        if not connector:
            raise HTTPException(status_code=404, detail="连接器不存在")
        return connector
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/connectors/{connector_id}")
def delete_connector(connector_id: int, db: Session = Depends(get_db)):
    """删除MCP连接器"""
    success = mcp_skill_service.delete_connector(db, connector_id)
    if not success:
        raise HTTPException(status_code=404, detail="连接器不存在")
    return {"message": "删除成功"}


@router.post("/connectors/{connector_id}/test")
async def test_connection(connector_id: int, db: Session = Depends(get_db)):
    """测试MCP连接器连通性"""
    result = await mcp_skill_service.test_connection(db, connector_id)
    return result


@router.post("/connectors/{connector_id}/toggle")
def toggle_connector(connector_id: int, db: Session = Depends(get_db)):
    """切换连接器启用/禁用状态"""
    connector = mcp_skill_service.toggle_connector(db, connector_id)
    if not connector:
        raise HTTPException(status_code=404, detail="连接器不存在")
    return connector
