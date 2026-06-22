"""
告警预处理流水线 API Router

暴露告警预处理流水线服务为 API 端点，包括：
去噪、去重、分级分类、研判路由、批量处理、配置管理
"""

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.alert_pipeline import AlertPipelineService, PipelineConfig, PipelineResult

router = APIRouter(prefix="/alert-pipeline", tags=["告警预处理"])

# 全局服务实例
_pipeline_service = AlertPipelineService()


# ─── 请求模型 ───────────────────────────────────────────────

class AlertData(BaseModel):
    """原始告警数据"""
    title: str
    type: str
    severity: str = "high"
    source: str = "未知系统"
    description: Optional[str] = None
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    user_name: Optional[str] = None
    ai_score: Optional[float] = None


class RouteRequest(BaseModel):
    """研判路由请求"""
    alert: AlertData
    risk_level: str


class BatchRequest(BaseModel):
    """批量预处理请求"""
    alerts: list[AlertData]


class ConfigUpdate(BaseModel):
    """流水线配置更新（所有字段可选）"""
    noise_threshold: Optional[int] = None
    duplicate_similarity_threshold: Optional[float] = None
    auto_investigate_levels: Optional[list[str]] = None
    classification_rules: Optional[dict] = None


# ─── 端点 ───────────────────────────────────────────────────

@router.post("/preprocess", response_model=PipelineResult)
async def preprocess_alert(alert: AlertData):
    """
    完整的告警预处理流水线

    流程：去噪 → 去重 → 分级分类 → 研判路由
    """
    try:
        result = await _pipeline_service.preprocess(alert.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"预处理失败: {str(e)}")


@router.post("/denoise")
async def denoise_alert(alert: AlertData):
    """
    告警去噪步骤

    返回噪声评分及判断结果
    """
    try:
        result = await _pipeline_service.denoise(alert.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"去噪失败: {str(e)}")


@router.post("/deduplicate")
async def deduplicate_alert(alert: AlertData):
    """
    告警去重步骤

    返回是否重复、关联告警ID及相似度评分
    """
    try:
        result = await _pipeline_service.deduplicate(alert.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"去重失败: {str(e)}")


@router.post("/classify")
async def classify_alert(alert: AlertData):
    """
    告警分级分类步骤

    返回风险等级、分类、置信度和关键指标
    """
    try:
        result = await _pipeline_service.classify(alert.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分类失败: {str(e)}")


@router.post("/route")
async def route_investigation(request: RouteRequest):
    """
    研判路由步骤

    根据告警数据和风险等级决定自动/人工研判
    """
    try:
        result = await _pipeline_service.route_investigation(
            request.alert.model_dump(), request.risk_level
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"研判路由失败: {str(e)}")


@router.get("/config", response_model=PipelineConfig)
async def get_config():
    """获取当前流水线配置"""
    return _pipeline_service.config


@router.put("/config", response_model=PipelineConfig)
async def update_config(config_update: ConfigUpdate):
    """
    更新流水线配置

    所有字段均为可选，仅更新传入的字段
    """
    update_data = config_update.model_dump(exclude_none=True)
    if not update_data:
        return _pipeline_service.config

    current = _pipeline_service.config.model_dump()
    current.update(update_data)
    _pipeline_service.config = PipelineConfig(**current)
    return _pipeline_service.config


@router.post("/batch")
async def batch_preprocess(request: BatchRequest):
    """
    批量预处理多个告警

    对每条告警执行完整的预处理流水线
    """
    try:
        results = []
        for alert in request.alerts:
            result = await _pipeline_service.preprocess(alert.model_dump())
            results.append(result)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量预处理失败: {str(e)}")
