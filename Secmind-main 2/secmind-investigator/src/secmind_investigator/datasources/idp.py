"""DS-IDP: Identity Provider abstract data source.

Concrete vendor adapters (AD, Okta, Azure AD, Ping) implement this interface.
"""
from __future__ import annotations

from abc import abstractmethod
from datetime import datetime
from typing import Any

from secmind_investigator.datasources.base import DataSource


class IdpDataSource(DataSource):
    """Abstract identity provider data source."""

    id: str = "DS-IDP"

    @abstractmethod
    async def get_account(self, principal: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def list_logins(
        self, principal: str, since: datetime, until: datetime
    ) -> list[dict[str, Any]]: ...

    @abstractmethod
    async def list_groups(self, principal: str) -> list[str]: ...

    @abstractmethod
    async def list_oauth_grants(self, principal: str) -> list[dict[str, Any]]: ...
