import time
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.provider_config import ProviderConfig

router = APIRouter(prefix="/providers", tags=["Provider配置"])


# ============ Pydantic Schemas ============

class ProviderConfigCreate(BaseModel):
    """创建供应商配置的请求体"""
    name: str = Field(..., description="供应商标识名，如 openai、deepseek")
    display_name: str = Field(..., description="供应商显示名，如 OpenAI、DeepSeek")
    provider_type: str = Field(default="openai_compatible", description="供应商类型：openai_compatible, azure, ollama")
    api_key: Optional[str] = Field(None, description="API密钥")
    base_url: Optional[str] = Field(None, description="API基础地址")
    model: Optional[str] = Field(None, description="模型名称")
    max_tokens: int = Field(default=4096, description="最大token数")
    temperature: float = Field(default=0.7, description="温度参数")
    timeout: float = Field(default=30.0, description="超时时间（秒）")
    extra_config: Optional[dict] = Field(None, description="供应商特定配置")


class ProviderConfigUpdate(BaseModel):
    """更新供应商配置的请求体，所有字段可选"""
    name: Optional[str] = None
    display_name: Optional[str] = None
    provider_type: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model: Optional[str] = None
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    timeout: Optional[float] = None
    is_active: Optional[bool] = None
    extra_config: Optional[dict] = None


class ProviderConfigRead(BaseModel):
    """供应商配置的响应体，api_key已脱敏"""
    id: int
    tenant_id: Optional[int] = None
    name: str
    display_name: str
    provider_type: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model: Optional[str] = None
    max_tokens: int
    temperature: float
    timeout: float
    is_active: bool
    is_default: bool
    extra_config: Optional[dict] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class ProviderTestResult(BaseModel):
    """供应商连接测试结果"""
    success: bool
    message: str
    model_name: Optional[str] = None
    latency_ms: Optional[float] = None


# ============ 工具函数 ============

def _mask_api_key(api_key: Optional[str]) -> Optional[str]:
    """对API密钥进行脱敏处理，仅保留最后4位字符"""
    if not api_key:
        return None
    if len(api_key) <= 4:
        return "****"
    return "*" * (len(api_key) - 4) + api_key[-4:]


def _to_read(config: ProviderConfig) -> ProviderConfigRead:
    """将ORM对象转换为响应体，api_key脱敏"""
    return ProviderConfigRead(
        id=config.id,
        tenant_id=config.tenant_id,
        name=config.name,
        display_name=config.display_name,
        provider_type=config.provider_type,
        api_key=_mask_api_key(config.api_key),
        base_url=config.base_url,
        model=config.model,
        max_tokens=config.max_tokens,
        temperature=config.temperature,
        timeout=config.timeout,
        is_active=config.is_active,
        is_default=config.is_default,
        extra_config=config.extra_config,
        created_at=config.created_at.isoformat() if config.created_at else None,
        updated_at=config.updated_at.isoformat() if config.updated_at else None,
    )


# ============ API端点 ============

@router.get("", response_model=list[ProviderConfigRead])
def list_providers(db: Session = Depends(get_db)):
    """获取所有供应商配置列表"""
    configs = db.query(ProviderConfig).order_by(ProviderConfig.id.asc()).all()
    return [_to_read(c) for c in configs]


@router.post("", response_model=ProviderConfigRead, status_code=201)
def create_provider(body: ProviderConfigCreate, db: Session = Depends(get_db)):
    """创建新的供应商配置"""
    # 检查name是否已存在
    existing = db.query(ProviderConfig).filter(ProviderConfig.name == body.name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"供应商标识名 '{body.name}' 已存在")

    config = ProviderConfig(**body.model_dump())
    db.add(config)
    db.commit()
    db.refresh(config)
    return _to_read(config)


@router.get("/{provider_id}", response_model=ProviderConfigRead)
def get_provider(provider_id: int, db: Session = Depends(get_db)):
    """获取指定供应商配置"""
    config = db.query(ProviderConfig).filter(ProviderConfig.id == provider_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="供应商配置不存在")
    return _to_read(config)


@router.put("/{provider_id}", response_model=ProviderConfigRead)
def update_provider(provider_id: int, body: ProviderConfigUpdate, db: Session = Depends(get_db)):
    """更新供应商配置"""
    config = db.query(ProviderConfig).filter(ProviderConfig.id == provider_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="供应商配置不存在")

    update_data = body.model_dump(exclude_unset=True)

    # 如果更新name，检查是否与其他记录冲突
    if "name" in update_data and update_data["name"] != config.name:
        existing = db.query(ProviderConfig).filter(ProviderConfig.name == update_data["name"]).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"供应商标识名 '{update_data['name']}' 已存在")

    for field, value in update_data.items():
        setattr(config, field, value)

    db.commit()
    db.refresh(config)
    return _to_read(config)


@router.delete("/{provider_id}")
def delete_provider(provider_id: int, db: Session = Depends(get_db)):
    """删除供应商配置"""
    config = db.query(ProviderConfig).filter(ProviderConfig.id == provider_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="供应商配置不存在")

    db.delete(config)
    db.commit()
    return {"detail": "供应商配置已删除"}


@router.post("/{provider_id}/test", response_model=ProviderTestResult)
async def test_provider(provider_id: int, db: Session = Depends(get_db)):
    """测试供应商连接，发送简单聊天请求验证Key和URL是否可用"""
    config = db.query(ProviderConfig).filter(ProviderConfig.id == provider_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="供应商配置不存在")

    if not config.api_key:
        return ProviderTestResult(success=False, message="未配置API密钥")
    if not config.base_url:
        return ProviderTestResult(success=False, message="未配置API基础地址")
    if not config.model:
        return ProviderTestResult(success=False, message="未配置模型名称")

    # 构建请求地址
    base_url = config.base_url.rstrip("/")
    url = f"{base_url}/chat/completions"

    headers = {
        "Authorization": f"Bearer {config.api_key}",
        "Content-Type": "application/json",
    }

    # 发送最简聊天请求
    payload = {
        "model": config.model,
        "messages": [{"role": "user", "content": "Hi"}],
        "max_tokens": 5,
    }

    start_time = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(url, json=payload, headers=headers)
        latency_ms = round((time.perf_counter() - start_time) * 1000, 1)

        if response.status_code == 200:
            data = response.json()
            model_name = data.get("model", config.model)
            return ProviderTestResult(
                success=True,
                message="连接测试成功",
                model_name=model_name,
                latency_ms=latency_ms,
            )
        else:
            # 尝试解析错误信息
            try:
                error_data = response.json()
                error_msg = error_data.get("error", {}).get("message", response.text[:200])
            except Exception:
                error_msg = response.text[:200]
            return ProviderTestResult(
                success=False,
                message=f"连接测试失败 (HTTP {response.status_code}): {error_msg}",
                latency_ms=latency_ms,
            )
    except httpx.TimeoutException:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 1)
        return ProviderTestResult(
            success=False,
            message=f"连接超时（{config.timeout}秒）",
            latency_ms=latency_ms,
        )
    except httpx.ConnectError:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 1)
        return ProviderTestResult(
            success=False,
            message=f"无法连接到 {url}",
            latency_ms=latency_ms,
        )
    except Exception as e:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 1)
        return ProviderTestResult(
            success=False,
            message=f"测试异常: {str(e)}",
            latency_ms=latency_ms,
        )


@router.post("/{provider_id}/set-default", response_model=ProviderConfigRead)
def set_default_provider(provider_id: int, db: Session = Depends(get_db)):
    """将指定供应商设为默认供应商"""
    config = db.query(ProviderConfig).filter(ProviderConfig.id == provider_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="供应商配置不存在")

    # 取消当前默认供应商
    db.query(ProviderConfig).filter(ProviderConfig.is_default == True).update({"is_default": False})

    # 设置新的默认供应商
    config.is_default = True
    config.is_active = True  # 默认供应商自动启用
    db.commit()
    db.refresh(config)
    return _to_read(config)
