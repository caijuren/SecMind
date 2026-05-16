from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Float, Boolean, func

from app.database import Base


class Strategy(Base):
    __tablename__ = "strategies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    strategy_type = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    rules = Column(JSON, nullable=False)
    conditions = Column(JSON, nullable=True)
    actions = Column(JSON, nullable=True)
    confidence_threshold = Column(Float, default=0.8)
    priority = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, index=True)
    version = Column(Integer, default=1)
    parent_id = Column(Integer, nullable=True)
    fitness_score = Column(Float, default=0.5)
    total_executions = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class StrategyEvolution(Base):
    __tablename__ = "strategy_evolutions"

    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(Integer, nullable=False, index=True)
    old_version = Column(Integer, nullable=False)
    new_version = Column(Integer, nullable=False)
    change_type = Column(String, nullable=False)
    change_description = Column(Text, nullable=True)
    old_rules = Column(JSON, nullable=True)
    new_rules = Column(JSON, nullable=True)
    trigger_reason = Column(String, nullable=True)
    fitness_before = Column(Float, nullable=True)
    fitness_after = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class StrategyFeedback(Base):
    __tablename__ = "strategy_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(Integer, nullable=False, index=True)
    execution_id = Column(String, nullable=True)
    outcome = Column(String, nullable=False, index=True)
    context = Column(JSON, nullable=True)
    reward = Column(Float, default=0.0)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class StrategyAdjustment(Base):
    __tablename__ = "strategy_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(Integer, nullable=False, index=True)
    action_type = Column(String, nullable=False, index=True)
    parameter_name = Column(String, nullable=False)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    adjustment_ratio = Column(Float, nullable=True)
    reason = Column(Text, nullable=True)
    is_rolled_back = Column(Boolean, default=False, index=True)
    rolled_back_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
