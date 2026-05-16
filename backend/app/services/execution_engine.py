import uuid
import time
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class ExecutionLog:
    _instance = None
    _logs: list[dict] = []

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def append(self, entry: dict):
        self._logs.append(entry)

    def query(
        self,
        execution_id: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict]:
        if execution_id:
            return [e for e in self._logs if e["execution_id"] == execution_id]
        return self._logs[::-1][offset : offset + limit]

    def get_by_id(self, execution_id: str) -> Optional[dict]:
        for e in self._logs:
            if e["execution_id"] == execution_id:
                return e
        return None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _generate_id() -> str:
    return f"exec-{uuid.uuid4().hex[:12]}"


class FirewallAdapter:
    def __init__(self):
        self.api_url = settings.FIREWALL_API_URL
        self.api_key = settings.FIREWALL_API_KEY
        self.is_configured = bool(self.api_url and self.api_key)

    async def block_ip(self, ip: str, duration: str = "1h") -> dict:
        if not self.is_configured:
            return self._simulate("block_ip", ip=ip, duration=duration)
        return await self._call(
            "POST",
            "/rules/block-ip",
            {"ip": ip, "duration": duration},
        )

    async def unblock_ip(self, ip: str) -> dict:
        if not self.is_configured:
            return self._simulate("unblock_ip", ip=ip)
        return await self._call("DELETE", "/rules/block-ip", {"ip": ip})

    async def block_port(self, port: int, protocol: str = "tcp") -> dict:
        if not self.is_configured:
            return self._simulate("block_port", port=port, protocol=protocol)
        return await self._call(
            "POST",
            "/rules/block-port",
            {"port": port, "protocol": protocol},
        )

    async def _call(self, method: str, path: str, payload: dict) -> dict:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.request(
                    method,
                    f"{self.api_url.rstrip('/')}{path}",
                    json=payload,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                resp.raise_for_status()
                return {"success": True, "data": resp.json()}
        except Exception as exc:
            logger.error("FirewallAdapter call failed: %s", exc)
            return {"success": False, "error": str(exc)}

    def _simulate(self, action: str, **kwargs) -> dict:
        return {
            "success": True,
            "simulated": True,
            "action": action,
            "params": kwargs,
            "message": f"模拟执行: firewall.{action}",
        }


class EDRAdapter:
    def __init__(self):
        self.api_url = settings.EDR_API_URL
        self.api_key = settings.EDR_API_KEY
        self.is_configured = bool(self.api_url and self.api_key)

    async def isolate_host(self, host_id: str) -> dict:
        if not self.is_configured:
            return self._simulate("isolate_host", host_id=host_id)
        return await self._call("POST", "/hosts/isolate", {"host_id": host_id})

    async def unisolate_host(self, host_id: str) -> dict:
        if not self.is_configured:
            return self._simulate("unisolate_host", host_id=host_id)
        return await self._call("POST", "/hosts/unisolate", {"host_id": host_id})

    async def kill_process(self, host_id: str, process_name: str) -> dict:
        if not self.is_configured:
            return self._simulate(
                "kill_process", host_id=host_id, process_name=process_name
            )
        return await self._call(
            "POST",
            "/hosts/kill-process",
            {"host_id": host_id, "process_name": process_name},
        )

    async def quarantine_file(self, host_id: str, file_path: str) -> dict:
        if not self.is_configured:
            return self._simulate(
                "quarantine_file", host_id=host_id, file_path=file_path
            )
        return await self._call(
            "POST",
            "/hosts/quarantine-file",
            {"host_id": host_id, "file_path": file_path},
        )

    async def _call(self, method: str, path: str, payload: dict) -> dict:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.request(
                    method,
                    f"{self.api_url.rstrip('/')}{path}",
                    json=payload,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                resp.raise_for_status()
                return {"success": True, "data": resp.json()}
        except Exception as exc:
            logger.error("EDRAdapter call failed: %s", exc)
            return {"success": False, "error": str(exc)}

    def _simulate(self, action: str, **kwargs) -> dict:
        return {
            "success": True,
            "simulated": True,
            "action": action,
            "params": kwargs,
            "message": f"模拟执行: edr.{action}",
        }


class SIEMAdapter:
    def __init__(self):
        self.api_url = settings.SIEM_API_URL
        self.api_key = settings.SIEM_API_KEY
        self.is_configured = bool(self.api_url and self.api_key)

    async def create_rule(self, rule: dict) -> dict:
        if not self.is_configured:
            return self._simulate("create_rule", rule=rule)
        return await self._call("POST", "/rules", rule)

    async def search_events(self, query: str, time_range: str = "1h") -> dict:
        if not self.is_configured:
            return self._simulate(
                "search_events", query=query, time_range=time_range
            )
        return await self._call(
            "POST",
            "/events/search",
            {"query": query, "time_range": time_range},
        )

    async def _call(self, method: str, path: str, payload: dict) -> dict:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.request(
                    method,
                    f"{self.api_url.rstrip('/')}{path}",
                    json=payload,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                resp.raise_for_status()
                return {"success": True, "data": resp.json()}
        except Exception as exc:
            logger.error("SIEMAdapter call failed: %s", exc)
            return {"success": False, "error": str(exc)}

    def _simulate(self, action: str, **kwargs) -> dict:
        return {
            "success": True,
            "simulated": True,
            "action": action,
            "params": kwargs,
            "message": f"模拟执行: siem.{action}",
        }


class ADAdapter:
    def __init__(self):
        self.api_url = settings.AD_API_URL
        self.api_key = settings.AD_API_KEY
        self.domain = settings.AD_DOMAIN
        self.is_configured = bool(self.api_url and self.api_key)

    async def disable_account(self, username: str) -> dict:
        if not self.is_configured:
            return {
                "success": False,
                "error": "AD 未配置，无法冻结账户。请在环境变量中设置 AD_API_URL 和 AD_API_KEY。",
                "configured": False,
            }
        return await self._call(
            "POST",
            "/accounts/disable",
            {"username": username, "domain": self.domain},
        )

    async def enable_account(self, username: str) -> dict:
        if not self.is_configured:
            return {
                "success": False,
                "error": "AD 未配置，无法解冻账户。请在环境变量中设置 AD_API_URL 和 AD_API_KEY。",
                "configured": False,
            }
        return await self._call(
            "POST",
            "/accounts/enable",
            {"username": username, "domain": self.domain},
        )

    async def reset_password(self, username: str, new_password: str) -> dict:
        if not self.is_configured:
            return {
                "success": False,
                "error": "AD 未配置，无法重置密码。请在环境变量中设置 AD_API_URL 和 AD_API_KEY。",
                "configured": False,
            }
        return await self._call(
            "POST",
            "/accounts/reset-password",
            {"username": username, "new_password": new_password, "domain": self.domain, "must_change": True},
        )

    async def _call(self, method: str, path: str, payload: dict) -> dict:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.request(
                    method,
                    f"{self.api_url.rstrip('/')}{path}",
                    json=payload,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                resp.raise_for_status()
                return {"success": True, "data": resp.json()}
        except Exception as exc:
            logger.error("ADAdapter call failed: %s", exc)
            return {"success": False, "error": str(exc)}


ACTION_MAP = {
    "ip_block": {"adapter": "firewall", "method": "block_ip", "rollback": "unblock_ip"},
    "ip_unblock": {"adapter": "firewall", "method": "unblock_ip", "rollback": None},
    "port_block": {"adapter": "firewall", "method": "block_port", "rollback": None},
    "device_isolation": {
        "adapter": "edr",
        "method": "isolate_host",
        "rollback": "unisolate_host",
    },
    "device_unisolation": {
        "adapter": "edr",
        "method": "unisolate_host",
        "rollback": None,
    },
    "process_kill": {"adapter": "edr", "method": "kill_process", "rollback": None},
    "file_quarantine": {
        "adapter": "edr",
        "method": "quarantine_file",
        "rollback": None,
    },
    "siem_rule": {"adapter": "siem", "method": "create_rule", "rollback": None},
    "siem_search": {"adapter": "siem", "method": "search_events", "rollback": None},
    "account_freeze": {"adapter": "ad", "method": "disable_account", "rollback": "enable_account"},
    "password_reset": {"adapter": "ad", "method": "reset_password", "rollback": None},
}


class ExecutionEngine:
    ADAPTERS = {
        "firewall": FirewallAdapter,
        "edr": EDRAdapter,
        "siem": SIEMAdapter,
        "ad": ADAdapter,
    }

    def __init__(self):
        self._adapter_instances: dict[str, object] = {}
        self._log = ExecutionLog()

    def _get_adapter(self, name: str):
        if name not in self._adapter_instances:
            cls = self.ADAPTERS[name]
            self._adapter_instances[name] = cls()
        return self._adapter_instances[name]

    async def execute(
        self, action_type: str, target: str, params: dict = None
    ) -> dict:
        params = params or {}
        execution_id = _generate_id()
        started_at = time.monotonic()
        executed_at = _now_iso()

        mapping = ACTION_MAP.get(action_type)
        if mapping is None:
            result = self._build_result(
                execution_id=execution_id,
                action_type=action_type,
                target=target,
                status="failed",
                adapter="unknown",
                is_simulated=False,
                result={"error": f"未知的动作类型: {action_type}"},
                rollback_available=False,
                executed_at=executed_at,
                duration_ms=0,
            )
            self._log.append(result)
            return result

        adapter_name = mapping["adapter"]
        method_name = mapping["method"]
        rollback_method = mapping["rollback"]

        adapter = self._get_adapter(adapter_name)
        method = getattr(adapter, method_name, None)
        if method is None:
            duration_ms = int((time.monotonic() - started_at) * 1000)
            result = self._build_result(
                execution_id=execution_id,
                action_type=action_type,
                target=target,
                status="failed",
                adapter=adapter_name,
                is_simulated=False,
                result={"error": f"适配器 {adapter_name} 不支持方法 {method_name}"},
                rollback_available=False,
                executed_at=executed_at,
                duration_ms=duration_ms,
            )
            self._log.append(result)
            return result

        call_params = self._build_call_params(action_type, target, params)
        adapter_result = await method(**call_params)

        is_simulated = adapter_result.get("simulated", False)
        success = adapter_result.get("success", False)
        duration_ms = int((time.monotonic() - started_at) * 1000)

        result = self._build_result(
            execution_id=execution_id,
            action_type=action_type,
            target=target,
            status="success" if success else "failed",
            adapter=adapter_name,
            is_simulated=is_simulated,
            result=adapter_result,
            rollback_available=bool(rollback_method),
            executed_at=executed_at,
            duration_ms=duration_ms,
        )
        self._log.append(result)
        logger.info(
            "Execution %s: %s target=%s status=%s simulated=%s duration=%dms",
            execution_id,
            action_type,
            target,
            result["status"],
            is_simulated,
            duration_ms,
        )
        return result

    async def rollback(self, execution_id: str) -> dict:
        entry = self._log.get_by_id(execution_id)
        if entry is None:
            return {
                "execution_id": execution_id,
                "status": "failed",
                "error": "执行记录不存在",
            }

        if entry["status"] != "success":
            return {
                "execution_id": execution_id,
                "status": "failed",
                "error": f"当前状态 {entry['status']} 不允许回滚",
            }

        if not entry.get("rollback_available"):
            return {
                "execution_id": execution_id,
                "status": "failed",
                "error": "该动作不支持回滚",
            }

        mapping = ACTION_MAP.get(entry["action_type"])
        if not mapping or not mapping.get("rollback"):
            return {
                "execution_id": execution_id,
                "status": "failed",
                "error": "未找到回滚方法",
            }

        adapter_name = mapping["adapter"]
        rollback_method_name = mapping["rollback"]
        adapter = self._get_adapter(adapter_name)
        method = getattr(adapter, rollback_method_name, None)
        if method is None:
            return {
                "execution_id": execution_id,
                "status": "failed",
                "error": f"适配器 {adapter_name} 不支持回滚方法 {rollback_method_name}",
            }

        rollback_params = self._build_rollback_params(
            entry["action_type"], entry["target"], entry.get("result", {})
        )
        rollback_result = await method(**rollback_params)

        entry["status"] = "rolled_back"
        entry["rollback_result"] = rollback_result
        entry["rolled_back_at"] = _now_iso()

        return {
            "execution_id": execution_id,
            "status": "rolled_back",
            "rollback_result": rollback_result,
        }

    async def check_status(self, execution_id: str) -> dict:
        entry = self._log.get_by_id(execution_id)
        if entry is None:
            return {
                "execution_id": execution_id,
                "status": "not_found",
                "error": "执行记录不存在",
            }
        return entry

    def list_capabilities(self) -> list[dict]:
        capabilities = []
        for action_type, mapping in ACTION_MAP.items():
            adapter_name = mapping["adapter"]
            if adapter_name and adapter_name in self.ADAPTERS:
                adapter = self._get_adapter(adapter_name)
                available = True
                is_simulated_only = not adapter.is_configured
            else:
                available = False
                is_simulated_only = True
            capabilities.append(
                {
                    "action_type": action_type,
                    "adapter": adapter_name or "simulated",
                    "method": mapping["method"] or "simulated",
                    "rollback_available": bool(mapping.get("rollback")),
                    "available": available,
                    "is_simulated_only": is_simulated_only,
                }
            )
        return capabilities

    def execution_history(self, limit: int = 20, offset: int = 0) -> dict:
        entries = self._log.query(limit=limit, offset=offset)
        total = len(self._log._logs)
        return {"total": total, "items": entries}

    @staticmethod
    def _build_result(
        *,
        execution_id: str,
        action_type: str,
        target: str,
        status: str,
        adapter: str,
        is_simulated: bool,
        result: dict,
        rollback_available: bool,
        executed_at: str,
        duration_ms: int,
    ) -> dict:
        return {
            "execution_id": execution_id,
            "action_type": action_type,
            "target": target,
            "status": status,
            "adapter": adapter,
            "is_simulated": is_simulated,
            "result": result,
            "rollback_available": rollback_available,
            "executed_at": executed_at,
            "duration_ms": duration_ms,
        }

    @staticmethod
    def _build_call_params(
        action_type: str, target: str, params: dict
    ) -> dict:
        mapping = {
            "ip_block": lambda: {"ip": target, "duration": params.get("duration", "1h")},
            "ip_unblock": lambda: {"ip": target},
            "port_block": lambda: {
                "port": params.get("port", int(target)),
                "protocol": params.get("protocol", "tcp"),
            },
            "device_isolation": lambda: {"host_id": target},
            "device_unisolation": lambda: {"host_id": target},
            "process_kill": lambda: {
                "host_id": target,
                "process_name": params.get("process_name", ""),
            },
            "file_quarantine": lambda: {
                "host_id": target,
                "file_path": params.get("file_path", ""),
            },
            "siem_rule": lambda: {"rule": params.get("rule", {"name": "auto-rule", "query": target})},
            "siem_search": lambda: {
                "query": target,
                "time_range": params.get("time_range", "1h"),
            },
            "account_freeze": lambda: {"username": target},
            "password_reset": lambda: {
                "username": target,
                "new_password": params.get("new_password", "SecMindReset123!"),
            },
        }
        builder = mapping.get(action_type)
        if builder:
            return builder()
        return {"target": target, **params}

    @staticmethod
    def _build_rollback_params(
        action_type: str, target: str, result: dict
    ) -> dict:
        if action_type == "ip_block":
            return {"ip": target}
        if action_type == "device_isolation":
            return {"host_id": target}
        if action_type == "account_freeze":
            return {"username": target}
        return {"target": target}


engine = ExecutionEngine()
