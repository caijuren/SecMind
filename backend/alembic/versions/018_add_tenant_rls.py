"""add tenant_id to remaining tables and enable RLS

Revision ID: 018
Revises: 017
Create Date: 2026-05-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "018"
down_revision: Union[str, None] = "017"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TENANT_TABLES = [
    ("strategies", "ix_strategies_tenant_id"),
    ("strategy_evolutions", "ix_strategy_evolutions_tenant_id"),
    ("strategy_feedbacks", "ix_strategy_feedbacks_tenant_id"),
    ("strategy_adjustments", "ix_strategy_adjustments_tenant_id"),
    ("reports", "ix_reports_tenant_id"),
    ("ai_analyses", "ix_ai_analyses_tenant_id"),
    ("integration_apps", "ix_integration_apps_tenant_id"),
    ("webhooks", "ix_webhooks_tenant_id"),
    ("integration_adapters", "ix_integration_adapters_tenant_id"),
    ("webhook_inbound", "ix_webhook_inbound_tenant_id"),
    ("comments", "ix_comments_tenant_id"),
    ("notifications", "ix_notifications_tenant_id"),
]


def upgrade() -> None:
    for table_name, index_name in TENANT_TABLES:
        op.add_column(
            table_name,
            sa.Column("tenant_id", sa.Integer(), nullable=False, server_default="1"),
        )
        op.create_index(index_name, table_name, ["tenant_id"])
        op.create_foreign_key(
            f"fk_{table_name}_tenant_id",
            table_name,
            "tenants",
            ["tenant_id"],
            ["id"],
        )


def downgrade() -> None:
    for table_name, index_name in reversed(TENANT_TABLES):
        op.drop_constraint(f"fk_{table_name}_tenant_id", table_name, type_="foreignkey")
        op.drop_index(index_name, table_name=table_name)
        op.drop_column(table_name, "tenant_id")