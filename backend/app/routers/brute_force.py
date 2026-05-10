from fastapi import APIRouter

from app.mock.data import mock_login_attempts

router = APIRouter(prefix="/brute-force", tags=["暴力破解"])


@router.get("/attempts")
def list_login_attempts():
    return {"total": len(mock_login_attempts), "items": mock_login_attempts}


@router.get("/stats")
def get_brute_force_stats():
    total = len(mock_login_attempts)
    failed = sum(1 for a in mock_login_attempts if not a["success"])
    successful = total - failed
    brute_force = [a for a in mock_login_attempts if a["attempt_count"] >= 10]

    target_counts: dict = {}
    for a in mock_login_attempts:
        target_counts[a["target"]] = target_counts.get(a["target"], 0) + 1

    return {
        "total_attempts": total,
        "failed_attempts": failed,
        "successful_attempts": successful,
        "brute_force_detected": len(brute_force),
        "top_targets": sorted(target_counts.items(), key=lambda x: x[1], reverse=True)[:5],
    }


@router.get("/active")
def get_active_attacks():
    active = [a for a in mock_login_attempts if a["attempt_count"] >= 10]
    return {
        "total": len(active),
        "items": active,
        "summary": f"当前检测到{len(active)}个活跃的暴力破解攻击",
    }
