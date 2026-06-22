"""DS-HR: Human Resources abstract data source.

Concrete vendor adapters (Workday, BambooHR, SAP SuccessFactors) implement this interface.
"""
from __future__ import annotations

from abc import abstractmethod
from datetime import datetime
from typing import Any

from secmind_investigator.datasources.base import DataSource


class HrDataSource(DataSource):
    """Abstract HR data source.

    Employee dict returned by ``get_employee`` MUST include at minimum:
    ``display_name``, ``employee_id``, ``department``, ``manager``,
    ``hire_date``, ``status``, ``leaving_date``, ``role_class``
    (full_time | contractor | intern | vendor), and ``vip`` (bool).
    """

    id: str = "DS-HR"

    @abstractmethod
    async def get_employee(self, principal: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def get_org_path(self, principal: str) -> list[str]: ...

    @abstractmethod
    async def get_status(self, principal: str) -> str | None: ...

    @abstractmethod
    async def get_leaving_date(self, principal: str) -> datetime | None: ...
