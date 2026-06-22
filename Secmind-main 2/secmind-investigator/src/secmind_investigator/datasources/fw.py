"""DS-FW: Firewall flow logs abstract data source."""
from __future__ import annotations

from abc import abstractmethod
from datetime import datetime
from typing import Any

from secmind_investigator.datasources.base import DataSource


class FwDataSource(DataSource):
    id: str = "DS-FW"

    @abstractmethod
    async def list_flows(
        self,
        filter: dict[str, Any],
        since: datetime,
        until: datetime,
        limit: int = 1000,
    ) -> list[dict[str, Any]]:
        """List flows matching filter (keys: src_ip, dst_ip, dst_port, proto, action)."""
        ...
