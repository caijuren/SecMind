"""add tenant_id to business tables

Revision ID: 015
Revises: 014
Create Date: 2026-05-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "015"
down_revision: Union[str, None] = "014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TENANT_TABLES = [
    ("alerts", "ix_alerts_tenant_id"),
    ("devices", "ix_devices_tenant_id"),
    ("response_actions", "ix_response_actions_tenant_id"),
    ("hunting_hypotheses", "ix_hunting_hypotheses_tenant_id"),
    ("playbooks", "ix_playbooks_tenant_id"),
    ("documents", "ix_documents_tenant_id"),
    ("compliance_frameworks", "ix_compliance_frameworks_tenant_id"),
    ("compliance_controls", "ix_compliance_controls_tenant_id"),
    ("compliance_assessments", "ix_compliance_assessments_tenant_id"),
    ("compliance_results", "ix_compliance_results_tenant_id"),
]


def upgrade() -> None:
    for table_name, index_name in TENANT_TABLES:
        op.add_column(
            table_name,
            sa.Column("tenant_id", sa.Integer(), nullable=True),
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
