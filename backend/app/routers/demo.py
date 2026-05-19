from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.mock.data import (
    mock_users,
    mock_alerts,
    mock_devices,
    mock_tickets,
    mock_analyses,
    mock_vpn_sessions,
    mock_email_logs,
    mock_login_attempts,
)


router = APIRouter(prefix="/demo", tags=["演示"])


# ==================== 登录 ====================

class DemoLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_demo: bool = True
    user: dict


@router.post("/login")
def demo_login():
    return DemoLoginResponse(
        access_token="demo-jwt-token",
        token_type="bearer",
        is_demo=True,
        user={
            "id": "DEMO001",
            "name": "体验用户",
            "email": "demo@secmind.com",
            "role": "viewer",
            "is_demo": True,
            "is_new_user": True,
        },
    )


# ==================== 告警 ====================

class AlertListResponse(BaseModel):
    total: int
    items: list


@router.get("/alerts")
def list_alerts(
    type: Optional[str] = None,
    risk_level: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
):
    items = mock_alerts
    if type:
        items = [a for a in items if a.get("type") == type]
    if risk_level:
        items = [a for a in items if a.get("risk_level") == risk_level]
    if status:
        items = [a for a in items if a.get("status") == status]
    if search:
        q = search.lower()
        items = [
            a for a in items
            if q in a.get("title", "").lower()
            or q in a.get("description", "").lower()
        ]
    total = len(items)
    items = items[skip : skip + limit]
    return AlertListResponse(total=total, items=items)


@router.get("/alerts/{alert_id}")
def get_alert(alert_id: int):
    for alert in mock_alerts:
        if alert["id"] == alert_id:
            return alert
    raise HTTPException(status_code=404, detail="告警不存在")


# ==================== 仪表盘 ====================

@router.get("/dashboard/stats")
def get_dashboard_stats():
    total = len(mock_alerts)
    critical = len([a for a in mock_alerts if a.get("risk_level") == "严重"])
    high = len([a for a in mock_alerts if a.get("risk_level") == "高"])
    medium = len([a for a in mock_alerts if a.get("risk_level") == "中"])
    pending = len([a for a in mock_alerts if a.get("status") == "待处理"])
    processing = len([a for a in mock_alerts if a.get("status") == "处理中"])

    return {
        "overview": {
            "total_alerts_today": total,
            "critical_alerts": critical,
            "high_alerts": high,
            "medium_alerts": medium,
            "pending_alerts": pending,
            "processing_alerts": processing,
        },
        "alert_stats": {
            "total": total,
            "by_risk_level": {
                "严重": critical,
                "高": high,
                "中": medium,
                "低": len([a for a in mock_alerts if a.get("risk_level") == "低"]),
            },
            "by_status": {
                "待处理": pending,
                "处理中": processing,
                "已处理": len([a for a in mock_alerts if a.get("status") == "已处理"]),
            },
        },
        "device_stats": {
            "total": len(mock_devices),
            "online": len([d for d in mock_devices if d.get("status") == "在线"]),
        },
        "ticket_stats": {
            "total": len(mock_tickets),
            "pending": len([t for t in mock_tickets if t.get("status") == "待处理"]),
        },
    }


@router.get("/dashboard/trends")
def get_dashboard_trends():
    return {
        "daily_trend": [
            {"date": "05-10", "严重": 3, "高": 5, "中": 2, "低": 1},
            {"date": "05-11", "严重": 2, "高": 4, "中": 3, "低": 2},
            {"date": "05-12", "严重": 4, "高": 3, "中": 1, "低": 0},
            {"date": "05-13", "严重": 1, "高": 6, "中": 4, "低": 3},
            {"date": "05-14", "严重": 5, "高": 2, "中": 2, "低": 1},
            {"date": "05-15", "严重": 3, "高": 4, "中": 5, "低": 2},
            {"date": "05-16", "严重": 4, "高": 5, "中": 3, "低": 1},
        ],
        "type_distribution": {
            "暴力破解": 2,
            "异常登录": 1,
            "数据泄露": 1,
            "恶意软件": 1,
            "权限提升": 1,
            "网络扫描": 1,
            "钓鱼攻击": 1,
        },
    }


# ==================== 设备 ====================

@router.get("/devices")
def list_devices():
    return {"total": len(mock_devices), "items": mock_devices}


# ==================== 用户 ====================

@router.get("/users")
def list_users():
    return {"total": len(mock_users), "items": mock_users}


# ==================== 工单 ====================

@router.get("/itsm/tickets")
def list_tickets():
    return {"total": len(mock_tickets), "items": mock_tickets}


# ==================== AI分析 ====================

@router.get("/ai/analyses")
def list_analyses():
    return {"total": len(mock_analyses), "items": mock_analyses}


@router.get("/ai/analyses/{analysis_id}")
def get_analysis(analysis_id: int):
    for analysis in mock_analyses:
        if analysis["id"] == analysis_id:
            return analysis
    raise HTTPException(status_code=404, detail="分析不存在")


# ==================== VPN会话 ====================

@router.get("/vpn/sessions")
def list_vpn_sessions():
    return {"total": len(mock_vpn_sessions), "items": mock_vpn_sessions}


# ==================== 邮件日志 ====================

@router.get("/email/logs")
def list_email_logs():
    return {"total": len(mock_email_logs), "items": mock_email_logs}


# ==================== 登录尝试 ====================

@router.get("/brute-force")
def list_login_attempts():
    return {"total": len(mock_login_attempts), "items": mock_login_attempts}