"""DS-EMAIL: Email gateway / mailbox abstract data source."""
from __future__ import annotations

from abc import abstractmethod
from datetime import datetime
from typing import Any

from secmind_investigator.datasources.base import DataSource


class EmailDataSource(DataSource):
    id: str = "DS-EMAIL"

    @abstractmethod
    async def get_message(self, message_id: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def get_mailbox(self, mailbox: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def list_sent(
        self, mailbox: str, since: datetime, until: datetime
    ) -> list[dict[str, Any]]: ...

    @abstractmethod
    async def list_received(
        self, mailbox: str, since: datetime, until: datetime
    ) -> list[dict[str, Any]]: ...

    @abstractmethod
    async def get_forwarding_rules(self, mailbox: str) -> list[dict[str, Any]]: ...
