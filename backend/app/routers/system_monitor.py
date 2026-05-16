from fastapi import APIRouter

from app.middleware.performance import get_perf_stats

router = APIRouter(prefix="/system", tags=["系统监控"])

monitor_router = APIRouter(prefix="/system-monitor", tags=["系统监控"])


@router.get("/perf")
def performance_stats():
    return get_perf_stats()


@monitor_router.get("/performance")
def monitor_performance_stats():
    return get_perf_stats()
