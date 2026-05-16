from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Boolean, Float, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class ComplianceFramework(Base):
    __tablename__ = "compliance_frameworks"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    version = Column(String, nullable=True)
    total_controls = Column(Integer, default=0)
    category = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    controls = relationship("ComplianceControl", backref="framework", cascade="all, delete-orphan")
    assessments = relationship("ComplianceAssessment", backref="framework", cascade="all, delete-orphan")


class ComplianceControl(Base):
    __tablename__ = "compliance_controls"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    framework_id = Column(Integer, ForeignKey("compliance_frameworks.id"), nullable=False, index=True)
    control_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True, index=True)
    severity = Column(String, default="medium", index=True)
    mapping = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    results = relationship("ComplianceResult", backref="control", cascade="all, delete-orphan")


class ComplianceAssessment(Base):
    __tablename__ = "compliance_assessments"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    framework_id = Column(Integer, ForeignKey("compliance_frameworks.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    status = Column(String, default="draft", index=True)
    assessor = Column(String, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    overall_score = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    results = relationship("ComplianceResult", backref="assessment", cascade="all, delete-orphan")


class ComplianceResult(Base):
    __tablename__ = "compliance_results"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    assessment_id = Column(Integer, ForeignKey("compliance_assessments.id"), nullable=False, index=True)
    control_id = Column(Integer, ForeignKey("compliance_controls.id"), nullable=False, index=True)
    status = Column(String, default="not_assessed", index=True)
    evidence = Column(JSON, nullable=True)
    findings = Column(Text, nullable=True)
    remediation = Column(Text, nullable=True)
    assessed_at = Column(DateTime, nullable=True)
    assessed_by = Column(String, nullable=True)
