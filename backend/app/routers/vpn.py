from fastapi import APIRouter

from app.mock.data import mock_vpn_sessions

router = APIRouter(prefix="/vpn", tags=["VPN安全"])


@router.get("/sessions")
def list_vpn_sessions():
    return {"total": len(mock_vpn_sessions), "items": mock_vpn_sessions}


@router.get("/anomalies")
def get_vpn_anomalies():
    anomalies = [s for s in mock_vpn_sessions if s["user_name"] == "陈静"]
    return {
        "total": len(anomalies),
        "items": anomalies,
        "summary": "检测到用户陈静在短时间内从多个不同地理位置登录VPN，疑似账号被盗用",
    }


@router.get("/stats")
def get_vpn_stats():
    active = sum(1 for s in mock_vpn_sessions if s["status"] == "活跃")
    total = len(mock_vpn_sessions)

    user_sessions: dict = {}
    for s in mock_vpn_sessions:
        user_sessions[s["user_name"]] = user_sessions.get(s["user_name"], 0) + 1

    suspicious_users = [u for u, c in user_sessions.items() if c >= 2]

    return {
        "total_sessions": total,
        "active_sessions": active,
        "unique_users": len(user_sessions),
        "suspicious_users": suspicious_users,
    }
