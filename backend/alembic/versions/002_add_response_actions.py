"""add response_actions table

Revision ID: 002
Revises: 001
Create Date: 2026-05-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "response_actions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("action_type", sa.String(), nullable=False),
        sa.Column("target", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("priority", sa.String(), nullable=False, server_default="medium"),
        sa.Column("alert_id", sa.Integer(), sa.ForeignKey("alerts.id"), nullable=True),
        sa.Column("hypothesis_id", sa.String(), nullable=True),
        sa.Column("hypothesis_label", sa.String(), nullable=True),
        sa.Column("hypothesis_confidence", sa.Float(), nullable=True),
        sa.Column("requested_by", sa.String(), nullable=False, server_default="AI引擎"),
        sa.Column("ai_reasoning", sa.Text(), nullable=True),
        sa.Column("reasoning_chain", sa.JSON(), nullable=True),
        sa.Column("evidence_summary", sa.JSON(), nullable=True),
        sa.Column("guardrails", sa.JSON(), nullable=True),
        sa.Column("result", sa.Text(), nullable=True),
        sa.Column("executed_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("approved_by", sa.String(), nullable=True),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.Column("cancelled_by", sa.String(), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(), nullable=True),
        sa.Column("cancel_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_response_actions_id", "response_actions", ["id"])
    op.create_index("ix_response_actions_status", "response_actions", ["status"])
    op.create_index("ix_response_actions_action_type", "response_actions", ["action_type"])


def downgrade() -> None:
    op.drop_index("ix_response_actions_action_type", table_name="response_actions")
    op.drop_index("ix_response_actions_status", table_name="response_actions")
    op.drop_index("ix_response_actions_id", table_name="response_actions")
    op.drop_table("response_actions")
