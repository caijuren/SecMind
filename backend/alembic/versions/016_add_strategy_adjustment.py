"""add strategy_adjustments table

Revision ID: 016
Revises: 015
Create Date: 2026-05-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "016"
down_revision: Union[str, None] = "015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "strategy_adjustments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("strategy_id", sa.Integer(), nullable=False),
        sa.Column("action_type", sa.String(), nullable=False),
        sa.Column("parameter_name", sa.String(), nullable=False),
        sa.Column("old_value", sa.JSON(), nullable=True),
        sa.Column("new_value", sa.JSON(), nullable=True),
        sa.Column("adjustment_ratio", sa.Float(), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("is_rolled_back", sa.Boolean(), server_default="0"),
        sa.Column("rolled_back_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_strategy_adjustments_id", "strategy_adjustments", ["id"])
    op.create_index("ix_strategy_adjustments_strategy_id", "strategy_adjustments", ["strategy_id"])
    op.create_index("ix_strategy_adjustments_action_type", "strategy_adjustments", ["action_type"])
    op.create_index("ix_strategy_adjustments_is_rolled_back", "strategy_adjustments", ["is_rolled_back"])


def downgrade() -> None:
    op.drop_table("strategy_adjustments")
