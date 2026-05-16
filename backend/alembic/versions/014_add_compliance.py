"""add compliance tables

Revision ID: 014
Revises: 013
Create Date: 2026-05-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "014"
down_revision: Union[str, None] = "013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "compliance_frameworks",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("code", sa.String(), unique=True, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("version", sa.String(), nullable=True),
        sa.Column("total_controls", sa.Integer(), server_default="0"),
        sa.Column("category", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="1"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_compliance_frameworks_id", "compliance_frameworks", ["id"])
    op.create_index("ix_compliance_frameworks_code", "compliance_frameworks", ["code"])
    op.create_index("ix_compliance_frameworks_is_active", "compliance_frameworks", ["is_active"])

    op.create_table(
        "compliance_controls",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("framework_id", sa.Integer(), sa.ForeignKey("compliance_frameworks.id"), nullable=False),
        sa.Column("control_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("severity", sa.String(), server_default="medium"),
        sa.Column("mapping", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_compliance_controls_id", "compliance_controls", ["id"])
    op.create_index("ix_compliance_controls_framework_id", "compliance_controls", ["framework_id"])
    op.create_index("ix_compliance_controls_control_id", "compliance_controls", ["control_id"])
    op.create_index("ix_compliance_controls_category", "compliance_controls", ["category"])
    op.create_index("ix_compliance_controls_severity", "compliance_controls", ["severity"])

    op.create_table(
        "compliance_assessments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("framework_id", sa.Integer(), sa.ForeignKey("compliance_frameworks.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("status", sa.String(), server_default="draft"),
        sa.Column("assessor", sa.String(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("overall_score", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_compliance_assessments_id", "compliance_assessments", ["id"])
    op.create_index("ix_compliance_assessments_framework_id", "compliance_assessments", ["framework_id"])
    op.create_index("ix_compliance_assessments_status", "compliance_assessments", ["status"])

    op.create_table(
        "compliance_results",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("assessment_id", sa.Integer(), sa.ForeignKey("compliance_assessments.id"), nullable=False),
        sa.Column("control_id", sa.Integer(), sa.ForeignKey("compliance_controls.id"), nullable=False),
        sa.Column("status", sa.String(), server_default="not_assessed"),
        sa.Column("evidence", sa.JSON(), nullable=True),
        sa.Column("findings", sa.Text(), nullable=True),
        sa.Column("remediation", sa.Text(), nullable=True),
        sa.Column("assessed_at", sa.DateTime(), nullable=True),
        sa.Column("assessed_by", sa.String(), nullable=True),
    )
    op.create_index("ix_compliance_results_id", "compliance_results", ["id"])
    op.create_index("ix_compliance_results_assessment_id", "compliance_results", ["assessment_id"])
    op.create_index("ix_compliance_results_control_id", "compliance_results", ["control_id"])
    op.create_index("ix_compliance_results_status", "compliance_results", ["status"])


def downgrade() -> None:
    op.drop_table("compliance_results")
    op.drop_table("compliance_assessments")
    op.drop_table("compliance_controls")
    op.drop_table("compliance_frameworks")
