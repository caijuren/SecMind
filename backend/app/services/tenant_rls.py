import logging
from typing import List, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger("secmind.tenant_rls")

TENANT_ISOLATED_TABLES = [
    "alerts",
    "devices",
    "response_actions",
    "hunting_hypotheses",
    "playbooks",
    "documents",
    "compliance_frameworks",
    "compliance_controls",
    "compliance_assessments",
    "compliance_results",
    "strategies",
    "strategy_evolutions",
    "strategy_feedbacks",
    "strategy_adjustments",
    "reports",
    "ai_analyses",
    "integration_apps",
    "webhooks",
    "integration_adapters",
    "webhook_inbound",
    "comments",
    "notifications",
]

RLS_POLICY_NAME = "tenant_isolation_policy"

POLICY_SQL_TEMPLATE = """
CREATE POLICY {policy_name} ON {table_name}
USING (
    current_setting('app.current_tenant_id', true) IS NULL
    OR tenant_id = current_setting('app.current_tenant_id')::int
)
"""

ENABLE_RLS_SQL = "ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY"

FORCE_RLS_SQL = "ALTER TABLE {table_name} FORCE ROW LEVEL SECURITY"

DROP_POLICY_SQL = "DROP POLICY IF EXISTS {policy_name} ON {table_name}"

DISABLE_RLS_SQL = "ALTER TABLE {table_name} DISABLE ROW LEVEL SECURITY"


def _table_has_column(db: Session, table_name: str, column_name: str) -> bool:
    result = db.execute(
        text(
            "SELECT EXISTS ("
            "  SELECT 1 FROM information_schema.columns "
            "  WHERE table_name = :table_name AND column_name = :column_name"
            ")"
        ),
        {"table_name": table_name, "column_name": column_name},
    )
    return result.scalar()


def _table_exists(db: Session, table_name: str) -> bool:
    result = db.execute(
        text(
            "SELECT EXISTS ("
            "  SELECT 1 FROM information_schema.tables "
            "  WHERE table_name = :table_name"
            ")"
        ),
        {"table_name": table_name},
    )
    return result.scalar()


def enable_rls_for_table(db: Session, table_name: str) -> bool:
    if not _table_exists(db, table_name):
        logger.warning("表 %s 不存在，跳过 RLS 启用", table_name)
        return False
    if not _table_has_column(db, table_name, "tenant_id"):
        logger.warning("表 %s 没有 tenant_id 列，跳过 RLS 启用", table_name)
        return False

    try:
        db.execute(text(DROP_POLICY_SQL.format(policy_name=RLS_POLICY_NAME, table_name=table_name)))
        db.execute(text(ENABLE_RLS_SQL.format(table_name=table_name)))
        db.execute(text(FORCE_RLS_SQL.format(table_name=table_name)))
        policy_sql = POLICY_SQL_TEMPLATE.format(policy_name=RLS_POLICY_NAME, table_name=table_name)
        db.execute(text(policy_sql))
        db.commit()
        logger.info("表 %s 的 RLS 策略已启用", table_name)
        return True
    except Exception:
        db.rollback()
        logger.error("启用表 %s 的 RLS 策略失败", table_name, exc_info=True)
        return False


def disable_rls_for_table(db: Session, table_name: str) -> bool:
    if not _table_exists(db, table_name):
        logger.warning("表 %s 不存在，跳过 RLS 禁用", table_name)
        return False

    try:
        db.execute(text(DROP_POLICY_SQL.format(policy_name=RLS_POLICY_NAME, table_name=table_name)))
        db.execute(text(DISABLE_RLS_SQL.format(table_name=table_name)))
        db.commit()
        logger.info("表 %s 的 RLS 策略已禁用", table_name)
        return True
    except Exception:
        db.rollback()
        logger.error("禁用表 %s 的 RLS 策略失败", table_name, exc_info=True)
        return False


def apply_rls_policies(db: Session) -> List[str]:
    applied: List[str] = []
    failed: List[str] = []

    for table_name in TENANT_ISOLATED_TABLES:
        if enable_rls_for_table(db, table_name):
            applied.append(table_name)
        else:
            failed.append(table_name)

    if failed:
        logger.warning("以下表 RLS 策略应用失败: %s", ", ".join(failed))

    return applied


def remove_all_rls_policies(db: Session) -> List[str]:
    removed: List[str] = []

    for table_name in TENANT_ISOLATED_TABLES:
        if disable_rls_for_table(db, table_name):
            removed.append(table_name)

    return removed


def get_rls_status(db: Session) -> dict:
    result = db.execute(
        text(
            "SELECT tablename FROM pg_tables "
            "WHERE schemaname = 'public' AND rowsecurity = true"
        )
    )
    rls_enabled_tables = [row[0] for row in result.fetchall()]

    status = {}
    for table_name in TENANT_ISOLATED_TABLES:
        status[table_name] = table_name in rls_enabled_tables

    return status