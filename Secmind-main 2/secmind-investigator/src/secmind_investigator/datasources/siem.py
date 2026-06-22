"""DS-SIEM: Security Information & Event Management abstract data source."""
from __future__ import annotations

from abc import abstractmethod
from datetime import datetime
from typing import Any

from secmind_investigator.datasources.base import DataSource


class SiemDataSource(DataSource):
    id: str = "DS-SIEM"

    @abstractmethod
    async def search(
        self,
        query: str,
        since: datetime,
        until: datetime,
        limit: int = 1000,
    ) -> list[dict[str, Any]]:
        """Free-text or structured query across all collected logs in [since, until]."""
        ...

    @abstractmethod
    async def pivot(
        self,
        field: str,
        value: str,
        since: datetime,
        until: datetime,
        limit: int = 1000,
    ) -> list[dict[str, Any]]:
        """Find events where field == value in the time window."""
        ...
