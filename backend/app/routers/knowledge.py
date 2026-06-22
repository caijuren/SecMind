from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.services.knowledge_service import knowledge_service

router = APIRouter(prefix="/knowledge", tags=["知识库"])


# ========== 请求模型 ==========

class KnowledgeCreateRequest(BaseModel):
    """创建知识条目请求"""
    title: str
    content: str
    category: str  # threat_intel, playbook, case_study, best_practice, ioc
    tags: Optional[list[str]] = None
    source: Optional[str] = "manual"
    severity: Optional[str] = None
    related_iocs: Optional[list[str]] = None
    related_mitre: Optional[list[str]] = None
    confidence: Optional[float] = 0.0
    created_by: Optional[str] = None
    tenant_id: Optional[int] = None


class KnowledgeUpdateRequest(BaseModel):
    """更新知识条目请求"""
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None
    source: Optional[str] = None
    severity: Optional[str] = None
    related_iocs: Optional[list[str]] = None
    related_mitre: Optional[list[str]] = None
    confidence: Optional[float] = None


class SimilarCaseRequest(BaseModel):
    """相似案例查询请求"""
    alert_data: dict


class VerifyRequest(BaseModel):
    """验证请求"""
    verified_by: str


# ========== 路由端点 ==========


@router.get("")
async def list_entries(
    category: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """分页列出知识条目，支持分类过滤和搜索"""
    return await knowledge_service.list_entries(
        category=category, search=search, page=page, page_size=page_size
    )


@router.post("")
async def create_entry(req: KnowledgeCreateRequest):
    """创建新的知识条目"""
    data = req.model_dump(exclude_none=True)
    return await knowledge_service.create_entry(data)


@router.get("/search")
async def search_knowledge(
    query: str,
    category: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
):
    """搜索知识库，支持文本匹配和语义搜索"""
    return await knowledge_service.search(query=query, category=category, limit=limit)


@router.post("/similar")
async def find_similar_cases(req: SimilarCaseRequest):
    """根据告警数据查找历史相似案例"""
    return await knowledge_service.find_similar_cases(alert_data=req.alert_data)


@router.get("/stats")
async def get_stats():
    """获取知识库统计信息"""
    return await knowledge_service.get_stats()


@router.post("/seed")
async def seed_knowledge():
    """使用示例数据初始化知识库（用于演示）"""
    return await knowledge_service.seed()


@router.get("/{entry_id}")
async def get_entry(entry_id: int):
    """获取单个知识条目详情"""
    result = await knowledge_service.get_entry(entry_id)
    if not result:
        raise HTTPException(status_code=404, detail="知识条目不存在")
    return result


@router.put("/{entry_id}")
async def update_entry(entry_id: int, req: KnowledgeUpdateRequest):
    """更新知识条目"""
    data = req.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="未提供任何更新字段")
    try:
        return await knowledge_service.update_entry(entry_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{entry_id}")
async def delete_entry(entry_id: int):
    """删除知识条目"""
    success = await knowledge_service.delete_entry(entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="知识条目不存在")
    return {"message": "删除成功"}


@router.post("/{entry_id}/verify")
async def verify_entry(entry_id: int, req: VerifyRequest):
    """验证知识条目"""
    result = await knowledge_service.verify_entry(entry_id, req.verified_by)
    if not result:
        raise HTTPException(status_code=404, detail="知识条目不存在")
    return result
