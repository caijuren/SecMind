"""remove user role field (migrated to RBAC)

Revision ID: 020
Revises: 019
Create Date: 2026-05-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text


revision: str = "020"
down_revision: Union[str, None] = "019"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


ROLE_MAP = {
    "admin": "admin",
    "analyst": "analyst",
    "user": "analyst",
    "viewer": "viewer",
}


def upgrade() -> None:
    connection = op.get_bind()

    # 获取角色ID映射
    role_rows = connection.execute(
        text("SELECT id, name FROM roles WHERE name IN ('admin', 'analyst', 'viewer')")
    ).fetchall()
    role_ids = {name: rid for rid, name in role_rows}

    # 读取现有用户的 role 值并插入 user_roles 表
    users_with_role = connection.execute(
        text("SELECT id, role FROM users WHERE role IS NOT NULL")
    ).fetchall()

    for user_id, role_name in users_with_role:
        target_role = ROLE_MAP.get(role_name, "viewer")
        role_id = role_ids.get(target_role)
        if role_id:
            existing = connection.execute(
                text("SELECT 1 FROM user_roles WHERE user_id = :uid AND role_id = :rid"),
                {"uid": user_id, "rid": role_id},
            ).fetchone()
            if not existing:
                connection.execute(
                    text("INSERT INTO user_roles (user_id, role_id) VALUES (:uid, :rid)"),
                    {"uid": user_id, "rid": role_id},
                )

    op.drop_column("users", "role")


def downgrade() -> None:
    op.add_column("users", sa.Column("role", sa.String(), nullable=True))

    connection = op.get_bind()

    role_rows = connection.execute(
        text("SELECT id, name FROM roles WHERE name IN ('admin', 'analyst', 'viewer')")
    ).fetchall()
    role_name_by_id = {rid: name for rid, name in role_rows}

    user_role_rows = connection.execute(
        text("SELECT user_id, role_id FROM user_roles")
    ).fetchall()

    for user_id, role_id in user_role_rows:
        role_name = role_name_by_id.get(role_id)
        if role_name:
            reverse_map = {"admin": "admin", "analyst": "user", "viewer": "user"}
            old_role = reverse_map.get(role_name, "user")
            connection.execute(
                text("UPDATE users SET role = :role WHERE id = :uid AND role IS NULL"),
                {"role": old_role, "uid": user_id},
            )