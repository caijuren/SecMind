"""add auth security columns to users

Revision ID: 017
Revises: 016
Create Date: 2026-05-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "017"
down_revision: Union[str, None] = "016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("failed_login_attempts", sa.Integer(), server_default="0", nullable=False))
    op.add_column("users", sa.Column("locked_until", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("is_verified", sa.Boolean(), server_default="0", nullable=False))
    op.add_column("users", sa.Column("verification_token", sa.String(), nullable=True))
    op.add_column("users", sa.Column("refresh_token", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "refresh_token")
    op.drop_column("users", "verification_token")
    op.drop_column("users", "is_verified")
    op.drop_column("users", "locked_until")
    op.drop_column("users", "failed_login_attempts")