import hashlib

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.services.auth_service import decode_access_token


class CacheControlMiddleware(BaseHTTPMiddleware):
    _static_paths = {
        "/api/v1/docs": 3600,
        "/api/v1/docs/categories": 3600,
        "/api/v1/i18n/locales": 3600,
        "/health": 30,
    }

    _short_ttl_paths = {
        "/api/v1/dashboard": 30,
        "/api/v1/alerts": 30,
        "/api/v1/situation": 30,
        "/api/v1/system-monitor": 30,
        "/api/v1/system": 30,
    }

    _medium_ttl_paths = {
        "/api/v1/rbac": 300,
        "/api/v1/devices": 300,
        "/api/v1/playbooks": 300,
        "/api/v1/integrations": 300,
    }

    WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method in self.WRITE_METHODS and self._is_authenticated(request):
            response = await call_next(request)
            response.headers["Cache-Control"] = "no-store"
            return response

        if request.method == "GET" and self._is_conditional(request):
            response = await call_next(request)
            etag = self._generate_etag(response)
            response.headers["ETag"] = etag

            if_none_match = request.headers.get("If-None-Match")
            if if_none_match and if_none_match == etag:
                response.status_code = 304
                response.body = b""
                response.headers["Content-Length"] = "0"
            return response

        response = await call_next(request)

        if request.method == "GET":
            cache_ttl = self._get_cache_ttl(request.url.path)
            if cache_ttl is not None:
                response.headers["Cache-Control"] = f"public, max-age={cache_ttl}"
            else:
                response.headers["Cache-Control"] = "no-cache"

            etag = self._generate_etag(response)
            response.headers["ETag"] = etag

        return response

    def _get_cache_ttl(self, path: str) -> int | None:
        for prefix, ttl in self._static_paths.items():
            if path.startswith(prefix):
                return ttl
        for prefix, ttl in self._short_ttl_paths.items():
            if path.startswith(prefix):
                return ttl
        for prefix, ttl in self._medium_ttl_paths.items():
            if path.startswith(prefix):
                return ttl
        return None

    def _generate_etag(self, response: Response) -> str:
        body = getattr(response, "body", b"")
        if isinstance(body, memoryview):
            body = bytes(body)
        return hashlib.md5(body).hexdigest()

    def _is_conditional(self, request: Request) -> bool:
        return "If-None-Match" in request.headers

    def _is_authenticated(self, request: Request) -> bool:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return False
        try:
            token = auth_header.split(" ", 1)[1]
            payload = decode_access_token(token)
            return payload is not None
        except Exception:
            return False