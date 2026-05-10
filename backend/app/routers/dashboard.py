from datetime import datetime, timedelta

from fastapi import APIRouter

from app.services.alert_service import get_alert_stats
from app.mock.data import mock_alerts

router = APIRouter(prefix="/dashboard", tags=["仪表盘"])


@router.get("/stats")
def get_stats():
    alert_stats = get_alert_stats()
    from app.mock.data import mock_devices, mock_tickets

    online_devices = sum(1 for d in mock_devices if d["status"] == "在线")
    pending_tickets = sum(1 for t in mock_tickets if t["status"] == "待处理")

    return {
        "alert_stats": alert_stats,
        "device_stats": {
            "total": len(mock_devices),
            "online": online_devices,
            "offline": len(mock_devices) - online_devices,
        },
        "ticket_stats": {
            "total": len(mock_tickets),
            "pending": pending_tickets,
        },
        "overview": {
            "total_alerts_today": len(mock_alerts),
            "critical_alerts": alert_stats["by_risk_level"].get("严重", 0),
            "high_alerts": alert_stats["by_risk_level"].get("高", 0),
            "pending_alerts": alert_stats["by_status"].get("待处理", 0),
            "processing_alerts": alert_stats["by_status"].get("处理中", 0),
        },
    }


@router.get("/trends")
def get_trends():
    now = datetime.now()
    days = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        days.append(
            {
                "date": day.strftime("%m-%d"),
                "严重": 1 if i % 3 == 0 else 0,
                "高": 3 + (i % 2),
                "中": 5 + (i % 3),
                "低": 2 + (i % 4),
            }
        )

    hours = []
    for h in range(24):
        hours.append(
            {
                "hour": f"{h:02d}:00",
                "alerts": 2 + (h % 5) if 9 <= h <= 18 else (h % 3),
            }
        )

    return {
        "daily_trend": days,
        "hourly_trend": hours,
        "type_distribution": {
            "暴力破解": 35,
            "异常登录": 25,
            "数据泄露": 15,
            "恶意软件": 12,
            "钓鱼攻击": 8,
            "其他": 5,
        },
    }
