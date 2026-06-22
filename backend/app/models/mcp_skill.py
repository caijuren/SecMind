from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Float, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base

class MCPConnector(Base):
    """MCP连接器配置"""
    __tablename__ = "mcp_connectors"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    name = Column(String, unique=True, nullable=False)  # e.g. "virustotal", "abuseipdb"
    display_name = Column(String, nullable=False)
    connector_type = Column(String, nullable=False, default="api")  # api, database, file, script
    endpoint_url = Column(String, nullable=True)
    api_key = Column(Text, nullable=True)
    config = Column(JSON, default=dict)  # connector-specific config
    is_active = Column(Boolean, default=False)
    last_connected = Column(DateTime, nullable=True)
    status = Column(String, default="disconnected")  # connected, disconnected, error
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class SkillDefinition(Base):
    """Skill定义 - 对应赵老师的AtomicCapability"""
    __tablename__ = "skill_definitions"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    name = Column(String, unique=True, nullable=False)  # e.g. "A9_email_replay"
    display_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False, default="investigation")  # investigation, response, management, utility
    skill_type = Column(String, nullable=False, default="atomic")  # atomic, composite
    required_connectors = Column(JSON, default=list)  # list of MCP connector names needed
    parameters = Column(JSON, default=list)  # parameter definitions
    script_path = Column(String, nullable=True)  # path to execution script
    script_content = Column(Text, nullable=True)  # inline script content
    execution_timeout = Column(Integer, default=300)  # seconds
    is_active = Column(Boolean, default=True)
    trigger_mode = Column(String, default="manual")  # auto, manual, approval
    execution_count = Column(Integer, default=0)
    last_executed = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class SkillExecution(Base):
    """Skill执行记录"""
    __tablename__ = "skill_executions"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    skill_id = Column(Integer, ForeignKey("skill_definitions.id"), nullable=False)
    trigger_type = Column(String, default="manual")  # auto, manual, approval
    parameters = Column(JSON, default=dict)
    status = Column(String, default="pending")  # pending, running, completed, failed, timeout
    result = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
