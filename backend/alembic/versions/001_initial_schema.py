"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-05-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("department", sa.String(), nullable=True),
        sa.Column("position", sa.String(), nullable=True),
        sa.Column("level", sa.String(), nullable=True),
        sa.Column("manager", sa.String(), nullable=True),
        sa.Column("is_sensitive", sa.Boolean(), default=False),
        sa.Column("office", sa.String(), nullable=True),
        sa.Column("recent_login_location", sa.String(), nullable=True),
        sa.Column("is_on_leave", sa.Boolean(), default=False),
        sa.Column("is_resigned", sa.Boolean(), default=False),
        sa.Column("email", sa.String(), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("role", sa.String(), default="user"),
        sa.Column("status", sa.String(), default="active"),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("last_login", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_name", "users", ["name"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "alerts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("type", sa.String(), nullable=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("risk_level", sa.String(), nullable=True),
        sa.Column("status", sa.String(), default="待处理"),
        sa.Column("source", sa.String(), nullable=True),
        sa.Column("source_ip", sa.String(), nullable=True),
        sa.Column("destination_ip", sa.String(), nullable=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("user_name", sa.String(), nullable=True),
        sa.Column("timestamp", sa.DateTime(), nullable=True),
        sa.Column("raw_log", sa.Text(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("ai_score", sa.Float(), nullable=True),
        sa.Column("ai_summary", sa.Text(), nullable=True),
        sa.Column("ai_recommendation", sa.Text(), nullable=True),
    )
    op.create_index("ix_alerts_id", "alerts", ["id"])
    op.create_index("ix_alerts_type", "alerts", ["type"])
    op.create_index("ix_alerts_risk_level", "alerts", ["risk_level"])
    op.create_index("ix_alerts_status", "alerts", ["status"])

    op.create_table(
        "devices",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("type", sa.String(), nullable=True),
        sa.Column("brand", sa.String(), nullable=True),
        sa.Column("model", sa.String(), nullable=True),
        sa.Column("ip", sa.String(), nullable=True),
        sa.Column("port", sa.Integer(), nullable=True),
        sa.Column("protocol", sa.String(), nullable=True),
        sa.Column("status", sa.String(), default="online"),
        sa.Column("last_sync", sa.DateTime(), nullable=True),
        sa.Column("log_format", sa.String(), nullable=True),
        sa.Column("vendor", sa.String(), nullable=True),
        sa.Column("log_level", sa.String(), nullable=True),
        sa.Column("direction", sa.String(), nullable=True),
        sa.Column("daily_volume", sa.Integer(), default=0),
        sa.Column("health", sa.Integer(), default=0),
        sa.Column("protocol_config", sa.JSON(), nullable=True),
    )
    op.create_index("ix_devices_id", "devices", ["id"])


def downgrade() -> None:
    op.drop_table("alerts")
    op.drop_table("devices")
    op.drop_table("users")
