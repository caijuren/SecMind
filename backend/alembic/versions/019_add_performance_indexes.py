"""add performance indexes

Revision ID: 019
Revises: 018
Create Date: 2026-05-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "019"
down_revision: Union[str, None] = "018"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_alerts_tenant_id_timestamp",
        "alerts",
        ["tenant_id", "timestamp"],
    )
    op.create_index(
        "ix_alerts_risk_level_status",
        "alerts",
        ["risk_level", "status"],
    )
    op.create_index(
        "ix_alerts_pending",
        "alerts",
        ["tenant_id", "timestamp"],
        postgresql_where=sa.text("status = '待处理'"),
        sqlite_where=sa.text("status = '待处理'"),
    )

    op.create_index(
        "ix_response_actions_tenant_id_status",
        "response_actions",
        ["tenant_id", "status"],
    )
    op.create_index(
        "ix_response_actions_hypothesis_id",
        "response_actions",
        ["hypothesis_id"],
    )
    op.create_index(
        "ix_response_actions_pending",
        "response_actions",
        ["tenant_id", "created_at"],
        postgresql_where=sa.text("status = 'pending'"),
        sqlite_where=sa.text("status = 'pending'"),
    )

    op.create_index(
        "ix_playbooks_tenant_id_status",
        "playbooks",
        ["tenant_id", "status"],
    )

    op.create_index(
        "ix_devices_tenant_id_type",
        "devices",
        ["tenant_id", "type"],
    )
    op.create_index(
        "ix_devices_online",
        "devices",
        ["tenant_id", "last_sync"],
        postgresql_where=sa.text("status = 'online'"),
        sqlite_where=sa.text("status = 'online'"),
    )


def downgrade() -> None:
    op.drop_index("ix_devices_online", table_name="devices")
    op.drop_index("ix_devices_tenant_id_type", table_name="devices")

    op.drop_index("ix_playbooks_tenant_id_status", table_name="playbooks")

    op.drop_index("ix_response_actions_pending", table_name="response_actions")
    op.drop_index("ix_response_actions_hypothesis_id", table_name="response_actions")
    op.drop_index("ix_response_actions_tenant_id_status", table_name="response_actions")

    op.drop_index("ix_alerts_pending", table_name="alerts")
    op.drop_index("ix_alerts_risk_level_status", table_name="alerts")
    op.drop_index("ix_alerts_tenant_id_timestamp", table_name="alerts")