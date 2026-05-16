from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Float, Boolean, func

from app.database import Base


class AIModel(Base):
    __tablename__ = "ai_models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    provider = Column(String, nullable=False, index=True)
    model_id = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    capabilities = Column(JSON, nullable=True)
    max_tokens = Column(Integer, default=4096)
    cost_per_1k_input = Column(Float, default=0.0)
    cost_per_1k_output = Column(Float, default=0.0)
    latency_ms = Column(Integer, default=0)
    accuracy_score = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True, index=True)
    priority = Column(Integer, default=0)
    config = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class ModelRouting(Base):
    __tablename__ = "model_routings"

    id = Column(Integer, primary_key=True, index=True)
    task_type = Column(String, nullable=False, unique=True, index=True)
    model_id = Column(Integer, nullable=False, index=True)
    routing_strategy = Column(String, nullable=False, default="priority")
    fallback_model_id = Column(Integer, nullable=True)
    config = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class ModelCallLog(Base):
    __tablename__ = "model_call_logs"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, nullable=False, index=True)
    task_type = Column(String, nullable=False, index=True)
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    latency_ms = Column(Integer, default=0)
    cost = Column(Float, default=0.0)
    status = Column(String, nullable=False, default="success", index=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
