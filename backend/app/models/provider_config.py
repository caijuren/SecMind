from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, JSON, Float, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class ProviderConfig(Base):
    """AI模型供应商配置，用于存储客户自定义的API Key和URL等信息"""
    __tablename__ = "provider_configs"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    name = Column(String, unique=True, nullable=False)  # 标识名，如 "openai", "deepseek", "custom"
    display_name = Column(String, nullable=False)  # 显示名，如 "OpenAI", "DeepSeek", "自定义模型"
    provider_type = Column(String, nullable=False, default="openai_compatible")  # 类型：openai_compatible, azure, ollama
    api_key = Column(Text, nullable=True)  # API密钥（生产环境应加密存储）
    base_url = Column(String, nullable=True)  # API基础地址
    model = Column(String, nullable=True)  # 模型名称
    max_tokens = Column(Integer, default=4096)  # 最大token数
    temperature = Column(Float, default=0.7)  # 温度参数
    timeout = Column(Float, default=30.0)  # 超时时间（秒）
    is_active = Column(Boolean, default=False)  # 是否启用
    is_default = Column(Boolean, default=False)  # 是否为默认供应商
    extra_config = Column(JSON, nullable=True)  # 供应商特定配置
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
