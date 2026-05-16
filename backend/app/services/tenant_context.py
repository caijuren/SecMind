import contextvars
from typing import Optional

current_tenant_id: contextvars.ContextVar[Optional[int]] = contextvars.ContextVar(
    "current_tenant_id", default=None
)


class TenantContext:

    @staticmethod
    def set(tenant_id: int) -> None:
        current_tenant_id.set(tenant_id)

    @staticmethod
    def get() -> Optional[int]:
        return current_tenant_id.get()

    @staticmethod
    def clear() -> None:
        current_tenant_id.set(None)
