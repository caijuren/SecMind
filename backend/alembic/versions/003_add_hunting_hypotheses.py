"""add hunting_hypotheses table

Revision ID: 003
Revises: 002
Create Date: 2026-05-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "hunting_hypotheses",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("tactic", sa.String(), nullable=False),
        sa.Column("technique", sa.String(), nullable=True),
        sa.Column("technique_id", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="验证中"),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="50.0"),
        sa.Column("ioc_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("related_ioc", sa.Text(), nullable=True),
        sa.Column("alert_id", sa.Integer(), sa.ForeignKey("alerts.id"), nullable=True),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_hunting_hypotheses_id", "hunting_hypotheses", ["id"])
    op.create_index("ix_hunting_hypotheses_status", "hunting_hypotheses", ["status"])
    op.create_index("ix_hunting_hypotheses_tactic", "hunting_hypotheses", ["tactic"])


def downgrade() -> None:
    op.drop_index("ix_hunting_hypotheses_tactic", table_name="hunting_hypotheses")
    op.drop_index("ix_hunting_hypotheses_status", table_name="hunting_hypotheses")
    op.drop_index("ix_hunting_hypotheses_id", table_name="hunting_hypotheses")
    op.drop_table("hunting_hypotheses")
