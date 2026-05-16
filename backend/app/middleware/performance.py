import time
import logging
import threading
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("secmind.perf")

SLOW_THRESHOLD_MS = 500
VERY_SLOW_THRESHOLD_MS = 2000

_perf_lock = threading.Lock()
_perf_stats = {
    "total_requests": 0,
    "total_time_ms": 0.0,
    "slow_requests": 0,
    "very_slow_requests": 0,
    "endpoint_stats": {},
    "recent_slow": [],
}


class PerformanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000

        path = request.url.path
        method = request.method
        key = f"{method} {path}"

        with _perf_lock:
            _perf_stats["total_requests"] += 1
            _perf_stats["total_time_ms"] += elapsed_ms

            if key not in _perf_stats["endpoint_stats"]:
                _perf_stats["endpoint_stats"][key] = {
                    "count": 0,
                    "total_ms": 0.0,
                    "max_ms": 0.0,
                    "slow_count": 0,
                }
            stat = _perf_stats["endpoint_stats"][key]
            stat["count"] += 1
            stat["total_ms"] += elapsed_ms
            stat["max_ms"] = max(stat["max_ms"], elapsed_ms)

            if elapsed_ms > SLOW_THRESHOLD_MS:
                stat["slow_count"] += 1
                _perf_stats["slow_requests"] += 1

                slow_entry = {
                    "endpoint": key,
                    "duration_ms": round(elapsed_ms, 1),
                }
                _perf_stats["recent_slow"].append(slow_entry)
                if len(_perf_stats["recent_slow"]) > 100:
                    _perf_stats["recent_slow"] = _perf_stats["recent_slow"][-100:]

            if elapsed_ms > VERY_SLOW_THRESHOLD_MS:
                _perf_stats["very_slow_requests"] += 1
                logger.warning(
                    f"Very slow request: {key} took {elapsed_ms:.1f}ms"
                )
            elif elapsed_ms > SLOW_THRESHOLD_MS:
                logger.info(
                    f"Slow request: {key} took {elapsed_ms:.1f}ms"
                )

        response.headers["X-Response-Time"] = f"{elapsed_ms:.1f}ms"
        return response


def get_perf_stats() -> dict:
    with _perf_lock:
        total = _perf_stats["total_requests"]
        avg_ms = _perf_stats["total_time_ms"] / total if total > 0 else 0
        top_endpoints = sorted(
            _perf_stats["endpoint_stats"].items(),
            key=lambda x: x[1]["total_ms"],
            reverse=True,
        )[:10]
        slowest_endpoints = sorted(
            _perf_stats["endpoint_stats"].items(),
            key=lambda x: x[1]["max_ms"],
            reverse=True,
        )[:10]
        return {
            "total_requests": total,
            "avg_response_ms": round(avg_ms, 1),
            "slow_requests": _perf_stats["slow_requests"],
            "very_slow_requests": _perf_stats["very_slow_requests"],
            "slow_threshold_ms": SLOW_THRESHOLD_MS,
            "very_slow_threshold_ms": VERY_SLOW_THRESHOLD_MS,
            "top_endpoints_by_total_time": [
                {
                    "endpoint": k,
                    "count": v["count"],
                    "avg_ms": round(v["total_ms"] / v["count"], 1),
                    "max_ms": round(v["max_ms"], 1),
                    "slow_count": v["slow_count"],
                }
                for k, v in top_endpoints
            ],
            "slowest_endpoints_by_max_time": [
                {
                    "endpoint": k,
                    "count": v["count"],
                    "avg_ms": round(v["total_ms"] / v["count"], 1),
                    "max_ms": round(v["max_ms"], 1),
                    "slow_count": v["slow_count"],
                }
                for k, v in slowest_endpoints
            ],
            "recent_slow_requests": _perf_stats["recent_slow"][-20:],
        }
