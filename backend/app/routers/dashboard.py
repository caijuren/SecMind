from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.services.alert_service import get_alert_stats
from app.models.device import Device
from app.models.itsm import ITSMTicket
from app.models.alert import Alert
from app.database import get_db

router = APIRouter(prefix="/dashboard", tags=["仪表盘"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    alert_stats = get_alert_stats(db)

    total_devices = db.query(func.count(Device.id)).scalar() or 0
    online_devices = db.query(func.count(Device.id)).filter(Device.status == "online").scalar() or 0
    total_tickets = db.query(func.count(ITSMTicket.id)).scalar() or 0
    pending_tickets = db.query(func.count(ITSMTicket.id)).filter(ITSMTicket.status == "待处理").scalar() or 0

    return {
        "alert_stats": alert_stats,
        "device_stats": {
            "total": total_devices,
            "online": online_devices,
            "offline": total_devices - online_devices,
        },
        "ticket_stats": {
            "total": total_tickets,
            "pending": pending_tickets,
        },
        "overview": {
            "total_alerts_today": alert_stats["total"],
            "critical_alerts": alert_stats["by_risk_level"].get("严重", 0),
            "high_alerts": alert_stats["by_risk_level"].get("高", 0),
            "pending_alerts": alert_stats["by_status"].get("待处理", 0),
            "processing_alerts": alert_stats["by_status"].get("处理中", 0),
        },
    }


@router.get("/trends")
def get_trends(db: Session = Depends(get_db)):
    now = datetime.now()
    days = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        critical = db.query(func.count(Alert.id)).filter(
            Alert.timestamp >= day_start, Alert.timestamp < day_end, Alert.risk_level == "严重"
        ).scalar() or 0
        high = db.query(func.count(Alert.id)).filter(
            Alert.timestamp >= day_start, Alert.timestamp < day_end, Alert.risk_level == "高"
        ).scalar() or 0
        medium = db.query(func.count(Alert.id)).filter(
            Alert.timestamp >= day_start, Alert.timestamp < day_end, Alert.risk_level == "中"
        ).scalar() or 0
        low = db.query(func.count(Alert.id)).filter(
            Alert.timestamp >= day_start, Alert.timestamp < day_end, Alert.risk_level == "低"
        ).scalar() or 0

        days.append({
            "date": day.strftime("%m-%d"),
            "严重": critical,
            "高": high,
            "中": medium,
            "低": low,
        })

    hours = []
    for h in range(24):
        hours.append({
            "hour": f"{h:02d}:00",
            "alerts": db.query(func.count(Alert.id)).filter(
                func.strftime("%H", Alert.timestamp) == f"{h:02d}"
            ).scalar() or 0,
        })

    type_dist = {}
    for row in db.query(Alert.type, func.count(Alert.id)).group_by(Alert.type).all():
        if row[0]:
            type_dist[row[0]] = row[1]

    return {
        "daily_trend": days,
        "hourly_trend": hours,
        "type_distribution": type_dist,
    }
