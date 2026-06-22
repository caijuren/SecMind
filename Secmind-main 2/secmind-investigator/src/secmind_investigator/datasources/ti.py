"""DS-TI: Threat intelligence abstract data source."""
from __future__ import annotations

from abc import abstractmethod
from typing import Any

from secmind_investigator.datasources.base import DataSource


class TiDataSource(DataSource):
    id: str = "DS-TI"

    @abstractmethod
    async def lookup_ip(self, ip: str) -> dict[str, Any] | None:
        """Return reputation dict or None if unknown.

        Shape: {"verdict": "clean|suspicious|malicious|unknown", "score": int|float,
                "tags": list[str], "sources": list[dict]}
        """
        ...

    @abstractmethod
    async def lookup_domain(self, domain: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def lookup_url(self, url: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def lookup_hash(self, hash_value: str) -> dict[str, Any] | None: ...
