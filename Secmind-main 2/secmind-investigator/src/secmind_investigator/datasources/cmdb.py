"""DS-CMDB: Configuration Management Database abstract data source."""
from __future__ import annotations

from abc import abstractmethod
from typing import Any

from secmind_investigator.datasources.base import DataSource


class CmdbDataSource(DataSource):
    id: str = "DS-CMDB"

    @abstractmethod
    async def get_asset(self, identifier: str) -> dict[str, Any] | None:
        """Look up an asset by hostname, asset_id, MAC, IP, or any indexed identifier."""
        ...

    @abstractmethod
    async def assets_owned_by(self, principal: str) -> list[dict[str, Any]]:
        """Return assets where principal is Owner/Admin/Primary user."""
        ...

    @abstractmethod
    async def get_business_context(self, asset_id: str) -> dict[str, Any] | None:
        """Business metadata: business_unit, criticality, sla, dependencies, in_maintenance."""
        ...
