"""In-memory base for test mocks; specific MockXxxDataSource classes added per adapter task."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from secmind_investigator.datasources.base import DataSource
from secmind_investigator.datasources.cmdb import CmdbDataSource
from secmind_investigator.datasources.edr import EdrDataSource
from secmind_investigator.datasources.email import EmailDataSource
from secmind_investigator.datasources.fw import FwDataSource
from secmind_investigator.datasources.hr import HrDataSource
from secmind_investigator.datasources.idp import IdpDataSource
from secmind_investigator.datasources.kb import KbDataSource
from secmind_investigator.datasources.siem import SiemDataSource
from secmind_investigator.datasources.ti import TiDataSource


class InMemoryDataSource(DataSource):
    """Test-only base. Seed `data` dict and override query methods in subclasses."""

    def __init__(self, id: str, data: dict[str, Any] | None = None) -> None:
        self.id = id
        self.data = data or {}

    async def healthcheck(self) -> bool:
        return True

    async def close(self) -> None:
        return None


class MockIdpDataSource(IdpDataSource):
    """Test mock for DS-IDP. Seed accounts/logins/groups/oauth maps and answer from memory."""

    def __init__(
        self,
        accounts: dict[str, dict[str, Any]] | None = None,
        logins: dict[str, list[dict[str, Any]]] | None = None,
        groups: dict[str, list[str]] | None = None,
        oauth: dict[str, list[dict[str, Any]]] | None = None,
    ) -> None:
        self.accounts = accounts if accounts is not None else {}
        self.logins = logins if logins is not None else {}
        self.groups = groups if groups is not None else {}
        self.oauth = oauth if oauth is not None else {}

    async def healthcheck(self) -> bool:
        return True

    async def close(self) -> None:
        return None

    async def get_account(self, principal: str) -> dict[str, Any] | None:
        return self.accounts.get(principal)

    async def list_logins(
        self, principal: str, since: datetime, until: datetime
    ) -> list[dict[str, Any]]:
        return [e for e in self.logins.get(principal, []) if since <= e["ts"] <= until]

    async def list_groups(self, principal: str) -> list[str]:
        return self.groups.get(principal, [])

    async def list_oauth_grants(self, principal: str) -> list[dict[str, Any]]:
        return self.oauth.get(principal, [])


class MockHrDataSource(HrDataSource):
    """Test mock for DS-HR. Seed employees map and answer from memory."""

    def __init__(self, employees: dict[str, dict[str, Any]] | None = None) -> None:
        self.employees = employees if employees is not None else {}

    async def healthcheck(self) -> bool:
        return True

    async def close(self) -> None:
        return None

    async def get_employee(self, principal: str) -> dict[str, Any] | None:
        return self.employees.get(principal)

    async def get_org_path(self, principal: str) -> list[str]:
        return self.employees[principal].get("org_path", []) if principal in self.employees else []

    async def get_status(self, principal: str) -> str | None:
        emp = self.employees.get(principal)
        return emp.get("status") if emp is not None else None

    async def get_leaving_date(self, principal: str) -> datetime | None:
        emp = self.employees.get(principal)
        return emp.get("leaving_date") if emp is not None else None


class MockCmdbDataSource(CmdbDataSource):
    """Test mock for DS-CMDB."""

    def __init__(
        self,
        assets: dict[str, dict[str, Any]] | None = None,
        ownership: dict[str, list[dict[str, Any]]] | None = None,
        business_context: dict[str, dict[str, Any]] | None = None,
    ) -> None:
        self.assets = assets if assets is not None else {}
        self.ownership = ownership if ownership is not None else {}
        self.business_context = business_context if business_context is not None else {}

    async def healthcheck(self) -> bool:
        return True

    async def close(self) -> None:
        return None

    async def get_asset(self, identifier: str) -> dict[str, Any] | None:
        return self.assets.get(identifier)

    async def assets_owned_by(self, principal: str) -> list[dict[str, Any]]:
        return self.ownership.get(principal, [])

    async def get_business_context(self, asset_id: str) -> dict[str, Any] | None:
        return self.business_context.get(asset_id)


class MockEdrDataSource(EdrDataSource):
    def __init__(
        self,
        hosts: dict[str, dict[str, Any]] | None = None,
        processes: dict[str, list[dict[str, Any]]] | None = None,
        process_trees: dict[str, dict[str, Any]] | None = None,
        net_conns: dict[str, list[dict[str, Any]]] | None = None,
        file_ops: dict[str, list[dict[str, Any]]] | None = None,
        hash_index: dict[str, list[dict[str, Any]]] | None = None,
    ) -> None:
        self.hosts = hosts or {}
        self.processes = processes or {}
        self.process_trees = process_trees or {}
        self.net_conns = net_conns or {}
        self.file_ops = file_ops or {}
        self.hash_index = hash_index or {}

    async def healthcheck(self) -> bool:
        return True

    async def close(self) -> None:
        return None

    async def get_host(self, host_id: str) -> dict[str, Any] | None:
        return self.hosts.get(host_id)

    async def list_processes(
        self, host: str, since: datetime, until: datetime
    ) -> list[dict[str, Any]]:
        return [
            p for p in self.processes.get(host, []) if since <= p["ts"] <= until
        ]

    async def get_process_tree(self, process_guid: str) -> dict[str, Any] | None:
        return self.process_trees.get(process_guid)

    async def list_network_conns(
        self, host: str, since: datetime, until: datetime
    ) -> list[dict[str, Any]]:
        return [
            c for c in self.net_conns.get(host, []) if since <= c["ts"] <= until
        ]

    async def list_file_ops(
        self, host: str, since: datetime, until: datetime
    ) -> list[dict[str, Any]]:
        return [
            f for f in self.file_ops.get(host, []) if since <= f["ts"] <= until
        ]

    async def search_hash(self, hash_value: str) -> list[dict[str, Any]]:
        return self.hash_index.get(hash_value, [])


class MockSiemDataSource(SiemDataSource):
    def __init__(self, events: list[dict[str, Any]] | None = None) -> None:
        self.events = events or []

    async def healthcheck(self) -> bool:
        return True

    async def close(self) -> None:
        return None

    async def search(
        self, query: str, since: datetime, until: datetime, limit: int = 1000
    ) -> list[dict[str, Any]]:
        # Naive substring match on str(event)
        results: list[dict[str, Any]] = []
        for e in self.events:
            if since <= e["ts"] <= until and query in str(e):
                results.append(e)
                if len(results) >= limit:
                    break
        return results

    async def pivot(
        self,
        field: str,
        value: str,
        since: datetime,
        until: datetime,
        limit: int = 1000,
    ) -> list[dict[str, Any]]:
        results: list[dict[str, Any]] = []
        for e in self.events:
            if since <= e["ts"] <= until and str(e.get(field)) == value:
                results.append(e)
                if len(results) >= limit:
                    break
        return results


class MockEmailDataSource(EmailDataSource):
    """Test mock for DS-EMAIL. Seed messages/mailboxes/sent/received/forwarding_rules maps."""

    def __init__(
        self,
        messages: dict[str, dict[str, Any]] | None = None,
        mailboxes: dict[str, dict[str, Any]] | None = None,
        sent: dict[str, list[dict[str, Any]]] | None = None,
        received: dict[str, list[dict[str, Any]]] | None = None,
        forwarding_rules: dict[str, list[dict[str, Any]]] | None = None,
    ) -> None:
        self.messages = messages if messages is not None else {}
        self.mailboxes = mailboxes if mailboxes is not None else {}
        self.sent = sent if sent is not None else {}
        self.received = received if received is not None else {}
        self.forwarding_rules = forwarding_rules if forwarding_rules is not None else {}

    async def healthcheck(self) -> bool:
        return True

    async def close(self) -> None:
        return None

    async def get_message(self, message_id: str) -> dict[str, Any] | None:
        return self.messages.get(message_id)

    async def get_mailbox(self, mailbox: str) -> dict[str, Any] | None:
        return self.mailboxes.get(mailbox)

    async def list_sent(
        self, mailbox: str, since: datetime, until: datetime
    ) -> list[dict[str, Any]]:
        return [m for m in self.sent.get(mailbox, []) if since <= m["ts"] <= until]

    async def list_received(
        self, mailbox: str, since: datetime, until: datetime
    ) -> list[dict[str, Any]]:
        return [m for m in self.received.get(mailbox, []) if since <= m["ts"] <= until]

    async def get_forwarding_rules(self, mailbox: str) -> list[dict[str, Any]]:
        return self.forwarding_rules.get(mailbox, [])


class MockFwDataSource(FwDataSource):
    """Test mock for DS-FW. Seed flows list; list_flows filters by all keys in filter dict."""

    def __init__(self, flows: list[dict[str, Any]] | None = None) -> None:
        self.flows = flows if flows is not None else []

    async def healthcheck(self) -> bool:
        return True

    async def close(self) -> None:
        return None

    async def list_flows(
        self,
        filter: dict[str, Any],
        since: datetime,
        until: datetime,
        limit: int = 1000,
    ) -> list[dict[str, Any]]:
        results: list[dict[str, Any]] = []
        for flow in self.flows:
            if not (since <= flow["ts"] <= until):
                continue
            if all(flow.get(k) == v for k, v in filter.items()):
                results.append(flow)
                if len(results) >= limit:
                    break
        return results


class MockTiDataSource(TiDataSource):
    """Test mock for DS-TI. Seed lookup dicts keyed by indicator value."""

    def __init__(
        self,
        ip_lookups: dict[str, dict[str, Any]] | None = None,
        domain_lookups: dict[str, dict[str, Any]] | None = None,
        url_lookups: dict[str, dict[str, Any]] | None = None,
        hash_lookups: dict[str, dict[str, Any]] | None = None,
    ) -> None:
        self.ip_lookups = ip_lookups if ip_lookups is not None else {}
        self.domain_lookups = domain_lookups if domain_lookups is not None else {}
        self.url_lookups = url_lookups if url_lookups is not None else {}
        self.hash_lookups = hash_lookups if hash_lookups is not None else {}

    async def healthcheck(self) -> bool:
        return True

    async def close(self) -> None:
        return None

    async def lookup_ip(self, ip: str) -> dict[str, Any] | None:
        return self.ip_lookups.get(ip)

    async def lookup_domain(self, domain: str) -> dict[str, Any] | None:
        return self.domain_lookups.get(domain)

    async def lookup_url(self, url: str) -> dict[str, Any] | None:
        return self.url_lookups.get(url)

    async def lookup_hash(self, hash_value: str) -> dict[str, Any] | None:
        return self.hash_lookups.get(hash_value)


class MockKbDataSource(KbDataSource):
    """Test mock for DS-KB. Seed alerts dict, entity_priors, and similar_alerts list."""

    def __init__(
        self,
        alerts: dict[str, dict[str, Any]] | None = None,
        entity_priors: dict[tuple[str, str], int] | None = None,
        similar_alerts: list[dict[str, Any]] | None = None,
    ) -> None:
        self.alerts = alerts if alerts is not None else {}
        self.entity_priors = entity_priors if entity_priors is not None else {}
        self.similar_alerts = similar_alerts if similar_alerts is not None else []

    async def healthcheck(self) -> bool:
        return True

    async def close(self) -> None:
        return None

    async def get_alert(self, alert_id: str) -> dict[str, Any] | None:
        return self.alerts.get(alert_id)

    async def count_prior(
        self, entity_kind: str, entity_id: str, window: timedelta
    ) -> int:
        return self.entity_priors.get((entity_kind, entity_id), 0)

    async def search_similar_alerts(
        self, fingerprint: dict[str, Any], k: int = 5
    ) -> list[dict[str, Any]]:
        return self.similar_alerts[:k]
