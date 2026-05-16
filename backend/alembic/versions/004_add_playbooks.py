"""add playbooks table

Revision ID: 004
Revises: 003
Create Date: 2026-05-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "playbooks",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("trigger", sa.String(), nullable=True),
        sa.Column("steps", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("executions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_execution", sa.DateTime(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="enabled"),
        sa.Column("nodes", sa.JSON(), nullable=True),
        sa.Column("edges", sa.JSON(), nullable=True),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_playbooks_id", "playbooks", ["id"])
    op.create_index("ix_playbooks_status", "playbooks", ["status"])


def downgrade() -> None:
    op.drop_index("ix_playbooks_status", table_name="playbooks")
    op.drop_index("ix_playbooks_id", table_name="playbooks")
    op.drop_table("playbooks")
