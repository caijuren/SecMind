from fastapi import Request, Depends
from typing import Optional

from app.services.tenant_context import TenantContext


async def get_current_tenant_id(request: Request) -> str:
    tenant_id = TenantContext.get()
    return str(tenant_id) if tenant_id is not None else "default"


async def get_client_ip(request: Request) -> Optional[str]:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


async def get_user_agent(request: Request) -> Optional[str]:
    return request.headers.get("User-Agent")