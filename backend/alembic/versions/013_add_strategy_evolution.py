"""add strategy evolution tables

Revision ID: 013
Revises: 012
Create Date: 2026-05-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "strategies",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(), unique=True, nullable=False),
        sa.Column("strategy_type", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("rules", sa.JSON(), nullable=False),
        sa.Column("conditions", sa.JSON(), nullable=True),
        sa.Column("actions", sa.JSON(), nullable=True),
        sa.Column("confidence_threshold", sa.Float(), server_default="0.8"),
        sa.Column("priority", sa.Integer(), server_default="0"),
        sa.Column("is_active", sa.Boolean(), server_default="1"),
        sa.Column("version", sa.Integer(), server_default="1"),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("fitness_score", sa.Float(), server_default="0.5"),
        sa.Column("total_executions", sa.Integer(), server_default="0"),
        sa.Column("success_count", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_strategies_id", "strategies", ["id"])
    op.create_index("ix_strategies_strategy_type", "strategies", ["strategy_type"])
    op.create_index("ix_strategies_is_active", "strategies", ["is_active"])

    op.create_table(
        "strategy_evolutions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("strategy_id", sa.Integer(), nullable=False),
        sa.Column("old_version", sa.Integer(), nullable=False),
        sa.Column("new_version", sa.Integer(), nullable=False),
        sa.Column("change_type", sa.String(), nullable=False),
        sa.Column("change_description", sa.Text(), nullable=True),
        sa.Column("old_rules", sa.JSON(), nullable=True),
        sa.Column("new_rules", sa.JSON(), nullable=True),
        sa.Column("trigger_reason", sa.String(), nullable=True),
        sa.Column("fitness_before", sa.Float(), nullable=True),
        sa.Column("fitness_after", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_strategy_evolutions_id", "strategy_evolutions", ["id"])
    op.create_index("ix_strategy_evolutions_strategy_id", "strategy_evolutions", ["strategy_id"])

    op.create_table(
        "strategy_feedbacks",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("strategy_id", sa.Integer(), nullable=False),
        sa.Column("execution_id", sa.String(), nullable=True),
        sa.Column("outcome", sa.String(), nullable=False),
        sa.Column("context", sa.JSON(), nullable=True),
        sa.Column("reward", sa.Float(), server_default="0"),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_strategy_feedbacks_id", "strategy_feedbacks", ["id"])
    op.create_index("ix_strategy_feedbacks_strategy_id", "strategy_feedbacks", ["strategy_id"])
    op.create_index("ix_strategy_feedbacks_outcome", "strategy_feedbacks", ["outcome"])


def downgrade() -> None:
    op.drop_table("strategy_feedbacks")
    op.drop_table("strategy_evolutions")
    op.drop_table("strategies")
