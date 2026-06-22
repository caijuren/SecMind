"""DS-EDR: Endpoint Detection & Response abstract data source."""
from __future__ import annotations

from abc import abstractmethod
from datetime import datetime
from typing import Any

from secmind_investigator.datasources.base import DataSource


class EdrDataSource(DataSource):
    id: str = "DS-EDR"

    @abstractmethod
    async def get_host(self, host_id: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def list_processes(
        self, host: str, since: datetime, until: datetime
    ) -> list[dict[str, Any]]: ...

    @abstractmethod
    async def get_process_tree(self, process_guid: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def list_network_conns(
        self, host: str, since: datetime, until: datetime
    ) -> list[dict[str, Any]]: ...

    @abstractmethod
    async def list_file_ops(
        self, host: str, since: datetime, until: datetime
    ) -> list[dict[str, Any]]: ...

    @abstractmethod
    async def search_hash(self, hash_value: str) -> list[dict[str, Any]]:
        """Return hosts/events where this hash was seen."""
        ...
