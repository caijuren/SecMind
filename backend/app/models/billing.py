from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey, Float, func
from sqlalchemy.orm import relationship

from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    order_no = Column(String, unique=True, nullable=False, index=True)
    plan = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="CNY")
    status = Column(String, nullable=False, default="pending", index=True)
    payment_method = Column(String, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    tenant = relationship("Tenant", backref="orders")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    invoice_no = Column(String, unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    tax_rate = Column(Float, default=0.06)
    tax_amount = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)
    status = Column(String, nullable=False, default="issued", index=True)
    buyer_name = Column(String, nullable=True)
    buyer_tax_no = Column(String, nullable=True)
    issued_at = Column(DateTime, server_default=func.now(), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    tenant = relationship("Tenant", backref="invoices")
    order = relationship("Order", backref="invoices")
