"""DS-KB: Knowledge base of historical alerts and investigations."""
from __future__ import annotations

from abc import abstractmethod
from datetime import timedelta
from typing import Any

from secmind_investigator.datasources.base import DataSource


class KbDataSource(DataSource):
    id: str = "DS-KB"

    @abstractmethod
    async def search_similar_alerts(
        self, fingerprint: dict[str, Any], k: int = 5
    ) -> list[dict[str, Any]]:
        """Return up to k historical alerts most similar to fingerprint, with similarity score."""
        ...

    @abstractmethod
    async def get_alert(self, alert_id: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def count_prior(
        self, entity_kind: str, entity_id: str, window: timedelta
    ) -> int:
        """Count prior alerts touching this entity within the window."""
        ...
