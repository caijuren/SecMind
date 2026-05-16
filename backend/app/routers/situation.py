from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import random

from app.database import get_db
from app.models.alert import Alert
from app.models.device import Device

router = APIRouter(prefix="/situation", tags=["态势大屏"])


@router.get("/overview")
def situation_overview(db: Session = Depends(get_db)):
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_alerts_today = db.query(func.count(Alert.id)).filter(Alert.timestamp >= today_start).scalar() or 0
    total_devices = db.query(func.count(Device.id)).scalar() or 0
    online_devices = db.query(func.count(Device.id)).filter(Device.status == "online").scalar() or 0

    severity_dist = {}
    for sev in ["critical", "high", "medium", "low", "info"]:
        count = db.query(func.count(Alert.id)).filter(Alert.risk_level == sev, Alert.timestamp >= today_start).scalar() or 0
        severity_dist[sev] = count

    hourly_alerts = []
    for h in range(24):
        hour_start = today_start + timedelta(hours=h)
        hour_end = hour_start + timedelta(hours=1)
        if hour_start > now:
            break
        count = db.query(func.count(Alert.id)).filter(Alert.timestamp >= hour_start, Alert.timestamp < hour_end).scalar() or 0
        hourly_alerts.append({"hour": h, "count": count})

    source_dist = {}
    for src in ["EDR", "VPN", "Firewall", "Email", "DNS", "AD"]:
        count = db.query(func.count(Alert.id)).filter(Alert.source == src, Alert.timestamp >= today_start).scalar() or 0
        source_dist[src] = count

    attack_types = [
        {"type": "凭证盗用", "count": random.randint(5, 30), "trend": "up"},
        {"type": "C2通信", "count": random.randint(2, 15), "trend": "down"},
        {"type": "暴力破解", "count": random.randint(10, 50), "trend": "stable"},
        {"type": "钓鱼攻击", "count": random.randint(3, 20), "trend": "up"},
        {"type": "横向移动", "count": random.randint(1, 10), "trend": "down"},
        {"type": "数据外泄", "count": random.randint(0, 8), "trend": "stable"},
    ]

    mttd = round(random.uniform(2.0, 8.0), 1)
    mttr = round(random.uniform(3.0, 12.0), 1)
    ai_accuracy = round(random.uniform(0.85, 0.97), 3)
    auto_response_rate = round(random.uniform(0.70, 0.92), 3)

    recent_alerts = []
    alerts = db.query(Alert).order_by(Alert.id.desc()).limit(10).all()
    for a in alerts:
        recent_alerts.append({
            "id": a.id,
            "title": a.title,
            "severity": a.risk_level,
            "source": a.source,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
        })

    return {
        "timestamp": now.isoformat(),
        "summary": {
            "total_alerts_today": total_alerts_today,
            "total_devices": total_devices,
            "online_devices": online_devices,
            "device_online_rate": round(online_devices / max(total_devices, 1), 3),
            "mttd_minutes": mttd,
            "mttr_minutes": mttr,
            "ai_accuracy": ai_accuracy,
            "auto_response_rate": auto_response_rate,
        },
        "severity_distribution": severity_dist,
        "hourly_alerts": hourly_alerts,
        "source_distribution": source_dist,
        "attack_types": attack_types,
        "recent_alerts": recent_alerts,
    }


@router.get("/threat-map")
def threat_map():
    regions = [
        {"region": "华北", "attacks": random.randint(20, 80), "top_type": "暴力破解"},
        {"region": "华东", "attacks": random.randint(30, 100), "top_type": "钓鱼攻击"},
        {"region": "华南", "attacks": random.randint(15, 60), "top_type": "凭证盗用"},
        {"region": "西南", "attacks": random.randint(5, 30), "top_type": "C2通信"},
        {"region": "华中", "attacks": random.randint(10, 50), "top_type": "暴力破解"},
        {"region": "东北", "attacks": random.randint(5, 25), "top_type": "横向移动"},
        {"region": "西北", "attacks": random.randint(3, 15), "top_type": "数据外泄"},
    ]
    external_ips = [
        {"ip": f"103.{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}", "country": random.choice(["US", "RU", "KR", "JP", "DE"]), "attacks": random.randint(5, 50), "type": random.choice(["C2", "扫描", "暴力破解"])},
        {"ip": f"45.{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}", "country": random.choice(["US", "RU", "KR", "JP", "DE"]), "attacks": random.randint(3, 30), "type": random.choice(["C2", "扫描", "暴力破解"])},
        {"ip": f"185.{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}", "country": random.choice(["US", "RU", "KR", "JP", "DE"]), "attacks": random.randint(2, 20), "type": random.choice(["C2", "扫描", "暴力破解"])},
    ]
    return {"regions": regions, "external_threats": external_ips}


@router.get("/realtime-feed")
def realtime_feed():
    events = []
    types = ["alert_new", "alert_triaged", "response_executed", "ai_analysis", "device_alert"]
    severities = ["critical", "high", "medium", "low"]
    sources = ["EDR", "VPN", "Firewall", "Email", "DNS"]
    for i in range(20):
        events.append({
            "id": i + 1,
            "type": random.choice(types),
            "severity": random.choice(severities),
            "source": random.choice(sources),
            "message": random.choice([
                "检测到异常VPN登录行为",
                "AI完成告警研判，置信度92%",
                "自动执行IP封禁操作",
                "发现可疑C2通信",
                "暴力破解攻击已阻断",
                "设备异常行为告警",
                "钓鱼邮件检测",
                "AI模型权重更新完成",
            ]),
            "timestamp": (datetime.now() - timedelta(seconds=random.randint(0, 300))).isoformat(),
        })
    return {"events": events}
