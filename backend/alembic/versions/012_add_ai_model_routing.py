"""add ai model routing tables

Revision ID: 012
Revises: 011
Create Date: 2026-05-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ai_models",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(), unique=True, nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("model_id", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("capabilities", sa.JSON(), nullable=True),
        sa.Column("max_tokens", sa.Integer(), server_default="4096"),
        sa.Column("cost_per_1k_input", sa.Float(), server_default="0"),
        sa.Column("cost_per_1k_output", sa.Float(), server_default="0"),
        sa.Column("latency_ms", sa.Integer(), server_default="0"),
        sa.Column("accuracy_score", sa.Float(), server_default="0"),
        sa.Column("is_active", sa.Boolean(), server_default="1"),
        sa.Column("priority", sa.Integer(), server_default="0"),
        sa.Column("config", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ai_models_id", "ai_models", ["id"])
    op.create_index("ix_ai_models_provider", "ai_models", ["provider"])
    op.create_index("ix_ai_models_is_active", "ai_models", ["is_active"])

    op.create_table(
        "model_routings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("task_type", sa.String(), unique=True, nullable=False),
        sa.Column("model_id", sa.Integer(), nullable=False),
        sa.Column("routing_strategy", sa.String(), server_default="priority"),
        sa.Column("fallback_model_id", sa.Integer(), nullable=True),
        sa.Column("config", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_model_routings_id", "model_routings", ["id"])
    op.create_index("ix_model_routings_task_type", "model_routings", ["task_type"])
    op.create_index("ix_model_routings_model_id", "model_routings", ["model_id"])

    op.create_table(
        "model_call_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("model_id", sa.Integer(), nullable=False),
        sa.Column("task_type", sa.String(), nullable=False),
        sa.Column("input_tokens", sa.Integer(), server_default="0"),
        sa.Column("output_tokens", sa.Integer(), server_default="0"),
        sa.Column("latency_ms", sa.Integer(), server_default="0"),
        sa.Column("cost", sa.Float(), server_default="0"),
        sa.Column("status", sa.String(), server_default="success"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_model_call_logs_id", "model_call_logs", ["id"])
    op.create_index("ix_model_call_logs_model_id", "model_call_logs", ["model_id"])
    op.create_index("ix_model_call_logs_task_type", "model_call_logs", ["task_type"])
    op.create_index("ix_model_call_logs_status", "model_call_logs", ["status"])


def downgrade() -> None:
    op.drop_table("model_call_logs")
    op.drop_table("model_routings")
    op.drop_table("ai_models")
