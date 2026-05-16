import logging
from typing import Callable, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.services.auth_service import decode_access_token
from app.services.rbac_service import check_permission
from app.database import SessionLocal

logger = logging.getLogger("secmind.rbac")


class RBACMiddleware(BaseHTTPMiddleware):
    """RBAC权限校验中间件"""

    PUBLIC_ROUTES = {
        "/", "/health", "/docs", "/openapi.json", "/redoc",
        "/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/contacts",
    }

    PUBLIC_PREFIXES = ("/docs", "/redoc", "/openapi.json")

    ROUTE_PERMISSIONS = {
        "GET:/api/v1/alerts": "alerts:read",
        "PUT:/api/v1/alerts": "alerts:write",
        "DELETE:/api/v1/alerts": "alerts:write",
        "GET:/api/v1/response": "response:read",
        "POST:/api/v1/response": "response:execute",
        "PUT:/api/v1/response": "response:write",
        "GET:/api/v1/hunting": "hunting:read",
        "POST:/api/v1/hunting": "hunting:write",
        "PUT:/api/v1/hunting": "hunting:write",
        "DELETE:/api/v1/hunting": "hunting:write",
        "GET:/api/v1/playbooks": "playbooks:read",
        "POST:/api/v1/playbooks": "playbooks:write",
        "PUT:/api/v1/playbooks": "playbooks:write",
        "DELETE:/api/v1/playbooks": "playbooks:write",
        "GET:/api/v1/rbac": "rbac:read",
        "POST:/api/v1/rbac": "rbac:write",
        "PUT:/api/v1/rbac": "rbac:write",
        "DELETE:/api/v1/rbac": "rbac:write",
        "GET:/api/v1/tenants": "tenants:read",
        "POST:/api/v1/tenants": "tenants:write",
        "PUT:/api/v1/tenants": "tenants:write",
        "DELETE:/api/v1/tenants": "tenants:write",
        "GET:/api/v1/billing": "billing:read",
        "POST:/api/v1/billing": "billing:write",
        "PUT:/api/v1/billing": "billing:write",
        "GET:/api/v1/system-settings": "settings:read",
        "PUT:/api/v1/system-settings": "settings:write",
        "GET:/api/v1/dashboard": "dashboard:read",
        "GET:/api/v1/devices": "devices:read",
        "POST:/api/v1/devices": "devices:write",
        "PUT:/api/v1/devices": "devices:write",
        "DELETE:/api/v1/devices": "devices:write",
        "GET:/api/v1/users": "users:read",
        "POST:/api/v1/users": "users:write",
        "PUT:/api/v1/users": "users:write",
        "DELETE:/api/v1/users": "users:write",
        "GET:/api/v1/itsm": "tickets:read",
        "POST:/api/v1/itsm": "tickets:write",
        "PUT:/api/v1/itsm": "tickets:write",
        "GET:/api/v1/ai": "ai:read",
        "POST:/api/v1/ai": "ai:write",
        "GET:/api/v1/ai-analysis": "ai:read",
        "POST:/api/v1/ai-analysis": "ai:write",
        "DELETE:/api/v1/ai-analysis": "ai:write",
        "GET:/api/v1/ai-chat": "ai:read",
        "POST:/api/v1/ai-chat": "ai:write",
        "PUT:/api/v1/ai-chat": "ai:write",
        "DELETE:/api/v1/ai-chat": "ai:write",
        "GET:/api/v1/ai-models": "ai:read",
        "POST:/api/v1/ai-models": "ai:write",
        "PUT:/api/v1/ai-models": "ai:write",
        "GET:/api/v1/email": "email:read",
        "GET:/api/v1/vpn": "vpn:read",
        "GET:/api/v1/brute-force": "brute_force:read",
        "GET:/api/v1/integrations": "integrations:read",
        "POST:/api/v1/integrations": "integrations:write",
        "PUT:/api/v1/integrations": "integrations:write",
        "GET:/api/v1/integration-adapters": "integrations:read",
        "GET:/api/v1/documents": "documents:read",
        "POST:/api/v1/documents": "documents:write",
        "PUT:/api/v1/documents": "documents:write",
        "DELETE:/api/v1/documents": "documents:write",
        "GET:/api/v1/ioc": "ioc:read",
        "POST:/api/v1/ioc": "ioc:write",
        "POST:/api/v1/execution": "response:execute",
        "GET:/api/v1/execution": "response:read",
        "POST:/api/v1/dag": "playbooks:write",
        "GET:/api/v1/dag": "playbooks:read",
        "GET:/api/v1/reports": "reports:read",
        "POST:/api/v1/reports": "reports:write",
        "GET:/api/v1/funnel": "dashboard:read",
        "POST:/api/v1/funnel": "dashboard:write",
        "GET:/api/v1/situation": "dashboard:read",
        "GET:/api/v1/compliance": "compliance:read",
        "POST:/api/v1/compliance": "compliance:write",
        "PUT:/api/v1/compliance": "compliance:write",
        "GET:/api/v1/strategies": "strategies:read",
        "POST:/api/v1/strategies": "strategies:write",
        "PUT:/api/v1/strategies": "strategies:write",
        "GET:/api/v1/strategy-evolution": "strategies:read",
        "POST:/api/v1/strategy-evolution": "strategies:write",
        "PUT:/api/v1/strategy-evolution": "strategies:write",
        "DELETE:/api/v1/strategy-evolution": "strategies:write",
        "GET:/api/v1/playbook-editor": "playbooks:read",
        "POST:/api/v1/playbook-editor": "playbooks:write",
        "GET:/api/v1/collaboration": "collaboration:read",
        "POST:/api/v1/collaboration": "collaboration:write",
        "PUT:/api/v1/collaboration": "collaboration:write",
        "DELETE:/api/v1/collaboration": "collaboration:write",
        "GET:/api/v1/system-monitor": "settings:read",
        "GET:/api/v1/i18n": "settings:read",
        "GET:/api/v1/model-router": "ai:read",
        "POST:/api/v1/model-router": "ai:write",
    }

    ROLE_PERMISSIONS = {
        "admin": ["*"],
        "analyst": [
            "dashboard:read", "devices:read", "users:read",
            "tickets:read", "tickets:write",
            "ai:read", "ai:write",
            "email:read", "vpn:read", "brute_force:read",
            "integrations:read", "documents:read",
            "ioc:read", "ioc:write",
            "response:read", "response:execute",
            "playbooks:read", "playbooks:write",
            "reports:read", "reports:write",
            "compliance:read",
            "strategies:read", "strategies:write",
            "collaboration:read", "collaboration:write",
            "settings:read",
            "alerts:read", "alerts:write",
            "hunting:read", "hunting:write",
            "rbac:read", "tenants:read", "billing:read",
        ],
        "viewer": [
            "dashboard:read", "devices:read", "users:read",
            "tickets:read", "ai:read", "email:read", "vpn:read",
            "brute_force:read", "integrations:read", "documents:read",
            "ioc:read", "response:read", "playbooks:read",
            "reports:read", "compliance:read", "strategies:read",
            "collaboration:read", "settings:read",
            "alerts:read", "hunting:read",
            "rbac:read", "tenants:read", "billing:read",
        ],
        "soc_manager": [
            "dashboard:read", "devices:read", "users:read",
            "tickets:read", "ai:read", "email:read", "vpn:read",
            "brute_force:read", "integrations:read", "documents:read",
            "ioc:read", "response:read", "response:execute",
            "playbooks:read", "playbooks:write",
            "reports:read", "compliance:read",
            "strategies:read", "strategies:write",
            "collaboration:read", "settings:read",
            "alerts:read", "alerts:write",
            "hunting:read", "hunting:write",
            "rbac:read", "tenants:read", "billing:read",
        ],
    }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        method = request.method

        if method == "OPTIONS":
            return await call_next(request)

        if self._is_public_route(path):
            return await call_next(request)

        if "websocket" in request.headers.get("upgrade", "").lower():
            return await call_next(request)

        required_permission = self._match_permission(method, path)
        if required_permission is None:
            return await call_next(request)

        user_id = self._extract_user_id(request)
        if user_id is None:
            return JSONResponse(
                status_code=401,
                content={"detail": "未提供认证凭证"},
            )

        try:
            has_permission = self._check_permission(user_id, required_permission)
        except Exception:
            logger.exception("RBAC权限检查异常，优雅降级放行")
            return await call_next(request)

        if not has_permission:
            resource, action = required_permission.split(":", 1)
            return JSONResponse(
                status_code=403,
                content={"detail": f"权限不足：需要 {resource}:{action}"},
            )

        return await call_next(request)

    @classmethod
    def _is_public_route(cls, path: str) -> bool:
        if path in cls.PUBLIC_ROUTES:
            return True
        for prefix in cls.PUBLIC_PREFIXES:
            if path.startswith(prefix):
                return True
        return False

    @classmethod
    def _match_permission(cls, method: str, path: str) -> Optional[str]:
        key = f"{method}:{path}"
        if key in cls.ROUTE_PERMISSIONS:
            return cls.ROUTE_PERMISSIONS[key]

        path_parts = path.rstrip("/").split("/")
        for i in range(len(path_parts) - 1, 0, -1):
            prefix = "/".join(path_parts[:i])
            key = f"{method}:{prefix}"
            if key in cls.ROUTE_PERMISSIONS:
                return cls.ROUTE_PERMISSIONS[key]

        return None

    @staticmethod
    def _extract_user_id(request: Request) -> Optional[int]:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        token = auth_header[7:]
        payload = decode_access_token(token)
        if payload is None:
            return None
        user_id = payload.get("sub")
        if user_id is None:
            return None
        try:
            return int(user_id)
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _check_permission(user_id: int, required_permission: str) -> bool:
        resource, action = required_permission.split(":", 1)
        db = SessionLocal()
        try:
            return check_permission(db, user_id, resource, action)
        finally:
            db.close()
