from typing import Optional, List, Dict, Any

from app.mock.data import mock_alerts


def get_alerts(
    alert_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> Dict[str, Any]:
    filtered = list(mock_alerts)

    if alert_type:
        filtered = [a for a in filtered if a["type"] == alert_type]
    if risk_level:
        filtered = [a for a in filtered if a["risk_level"] == risk_level]
    if status:
        filtered = [a for a in filtered if a["status"] == status]
    if search:
        search_lower = search.lower()
        filtered = [
            a
            for a in filtered
            if search_lower in a["title"].lower()
            or search_lower in a["description"].lower()
            or search_lower in (a.get("user_name") or "").lower()
        ]

    total = len(filtered)
    items = filtered[skip : skip + limit]
    return {"total": total, "items": items}


def get_alert_by_id(alert_id: int) -> Optional[Dict[str, Any]]:
    for alert in mock_alerts:
        if alert["id"] == alert_id:
            return alert
    return None


def update_alert_status(alert_id: int, status: str) -> Optional[Dict[str, Any]]:
    for alert in mock_alerts:
        if alert["id"] == alert_id:
            alert["status"] = status
            return alert
    return None


def get_alert_stats() -> Dict[str, Any]:
    total = len(mock_alerts)
    by_risk = {"严重": 0, "高": 0, "中": 0, "低": 0}
    by_status = {"待处理": 0, "处理中": 0, "已处理": 0, "已关闭": 0}
    by_type: Dict[str, int] = {}

    for alert in mock_alerts:
        rl = alert.get("risk_level", "低")
        if rl in by_risk:
            by_risk[rl] += 1
        st = alert.get("status", "待处理")
        if st in by_status:
            by_status[st] += 1
        at = alert.get("type", "其他")
        by_type[at] = by_type.get(at, 0) + 1

    return {
        "total": total,
        "by_risk_level": by_risk,
        "by_status": by_status,
        "by_type": by_type,
    }
