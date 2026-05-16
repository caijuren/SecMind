from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey, Float, func
from sqlalchemy.orm import relationship

from app.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    plan = Column(String, nullable=False, default="free", index=True)
    status = Column(String, nullable=False, default="active", index=True)
    max_users = Column(Integer, default=5)
    max_alerts_per_day = Column(Integer, default=100)
    max_api_calls_per_day = Column(Integer, default=1000)
    settings = Column(JSON, nullable=True)
    owner_email = Column(String, nullable=False)
    owner_name = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    members = relationship("TenantMember", backref="tenant")


class TenantMember(Base):
    __tablename__ = "tenant_members"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String, nullable=False, default="member")
    joined_at = Column(DateTime, server_default=func.now(), nullable=False)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    plan = Column(String, nullable=False)
    status = Column(String, nullable=False, default="trial", index=True)
    trial_ends_at = Column(DateTime, nullable=True)
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    amount = Column(Float, nullable=True)
    currency = Column(String, default="CNY")
    payment_method = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class UsageRecord(Base):
    __tablename__ = "usage_records"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    metric = Column(String, nullable=False, index=True)
    value = Column(Integer, default=0)
    period = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
