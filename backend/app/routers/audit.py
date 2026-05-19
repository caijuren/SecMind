from typing import Optional
from io import StringIO
import csv
import json

from fastapi import APIRouter, Query, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_tenant_id
from app.services.audit_service import get_audit_logs, export_audit_logs, get_audit_stats

router = APIRouter(prefix="/audit", tags=["审计日志"])


@router.get("")
def list_audit_logs(
    action: Optional[str] = Query(None, description="操作类型筛选"),
    resource_type: Optional[str] = Query(None, description="资源类型筛选"),
    user_id: Optional[int] = Query(None, description="用户ID筛选"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
):
    return get_audit_logs(
        db=db,
        tenant_id=tenant_id,
        action=action,
        resource_type=resource_type,
        user_id=user_id,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.get("/stats")
def audit_stats(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
):
    return get_audit_stats(db, tenant_id)


@router.get("/export")
def export_audit(
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    format: str = Query("csv", description="导出格式: csv 或 json"),
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
):
    logs = export_audit_logs(
        db=db,
        tenant_id=tenant_id,
        action=action,
        resource_type=resource_type,
        user_id=user_id,
        search=search,
        format=format,
    )

    if format == "json":
        json_str = json.dumps(logs, ensure_ascii=False, indent=2)
        return StreamingResponse(
            iter([json_str]),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=audit_logs.json"},
        )

    output = StringIO()
    if logs:
        writer = csv.DictWriter(output, fieldnames=logs[0].keys())
        writer.writeheader()
        writer.writerows(logs)

    csv_content = output.getvalue()
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_logs.csv"},
    )