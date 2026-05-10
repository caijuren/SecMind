from fastapi import APIRouter

from app.mock.data import mock_email_logs

router = APIRouter(prefix="/email", tags=["邮件安全"])


@router.get("/logs")
def list_email_logs():
    return {"total": len(mock_email_logs), "items": mock_email_logs}


@router.get("/stats")
def get_email_stats():
    total = len(mock_email_logs)
    blocked = sum(1 for e in mock_email_logs if e["blocked"])
    outbound = sum(1 for e in mock_email_logs if e["direction"] == "外发")
    phishing = sum(1 for e in mock_email_logs if "钓鱼邮件" in e.get("tags", []))

    return {
        "total": total,
        "blocked": blocked,
        "outbound": outbound,
        "phishing_detected": phishing,
        "sensitive_sent": sum(1 for e in mock_email_logs if e["sensitivity"] == "高" and e["direction"] == "外发"),
    }


@router.get("/suspicious")
def get_suspicious_emails():
    suspicious = [e for e in mock_email_logs if e["blocked"] or e["sensitivity"] == "高"]
    return {"total": len(suspicious), "items": suspicious}
