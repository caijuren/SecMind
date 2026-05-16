import logging
from typing import Callable, Optional

from fastapi import Request, Response
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware

from app.services.auth_service import decode_access_token
from app.services.tenant_context import TenantContext
from app.database import SessionLocal

logger = logging.getLogger("secmind.tenant")


class TenantIsolationMiddleware(BaseHTTPMiddleware):

    SKIP_ROUTES = {
        "/", "/health", "/docs", "/openapi.json", "/redoc",
        "/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/contacts",
    }
    SKIP_PREFIXES = ("/docs", "/redoc", "/openapi.json")

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        TenantContext.clear()

        if request.method == "OPTIONS":
            return await call_next(request)

        if self._should_skip(request.url.path):
            return await call_next(request)

        if "websocket" in request.headers.get("upgrade", "").lower():
            return await call_next(request)

        tenant_id = self._extract_tenant_id(request)
        if tenant_id is not None:
            TenantContext.set(tenant_id)
            self._set_pg_tenant_var(tenant_id)

        return await call_next(request)

    @staticmethod
    def _set_pg_tenant_var(tenant_id: int) -> None:
        db = SessionLocal()
        try:
            db.execute(text(f"SET app.current_tenant_id = '{tenant_id}'"))
            db.commit()
        except Exception:
            logger.debug("设置 PostgreSQL 租户变量失败", exc_info=True)
        finally:
            db.close()

    @classmethod
    def _should_skip(cls, path: str) -> bool:
        if path in cls.SKIP_ROUTES:
            return True
        for prefix in cls.SKIP_PREFIXES:
            if path.startswith(prefix):
                return True
        return False

    @staticmethod
    def _extract_tenant_id(request: Request) -> Optional[int]:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        token = auth_header[7:]
        payload = decode_access_token(token)
        if payload is None:
            return None
        tenant_id = payload.get("tenant_id")
        if tenant_id is not None:
            try:
                return int(tenant_id)
            except (ValueError, TypeError):
                return None

        user_id = payload.get("sub")
        if user_id is None:
            return None
        try:
            uid = int(user_id)
        except (ValueError, TypeError):
            return None

        db = SessionLocal()
        try:
            from app.models.tenant import TenantMember
            member = (
                db.query(TenantMember)
                .filter(TenantMember.user_id == uid)
                .first()
            )
            if member:
                return member.tenant_id
        except Exception:
            logger.debug("无法从数据库获取用户租户信息", exc_info=True)
        finally:
            db.close()

        return None


class TenantIsolation:

    @staticmethod
    def apply_tenant_filter(query, model_class, tenant_id: int):
        if hasattr(model_class, "tenant_id") and tenant_id is not None:
            return query.filter(model_class.tenant_id == tenant_id)
        return query

    @staticmethod
    def set_tenant_id(instance, tenant_id: int) -> None:
        if hasattr(instance, "tenant_id") and not instance.tenant_id:
            instance.tenant_id = tenant_id

    @staticmethod
    def is_admin(user) -> bool:
        if user is None:
            return False
        role = getattr(user, "role", None)
        if role == "admin":
            return True
        return False
