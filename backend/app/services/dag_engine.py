import uuid
import asyncio
import logging
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.playbook import Playbook
from app.services.execution_engine import engine as action_engine

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _generate_exec_id() -> str:
    return f"dag-{uuid.uuid4().hex[:12]}"


class DAGExecutionLog:
    _instance = None
    _logs: list[dict] = []

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def append(self, entry: dict):
        self._logs.append(entry)

    def get_by_id(self, execution_id: str) -> Optional[dict]:
        for e in self._logs:
            if e["execution_id"] == execution_id:
                return e
        return None

    def query(
        self,
        execution_id: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict]:
        if execution_id:
            return [e for e in self._logs if e["execution_id"] == execution_id]
        return self._logs[::-1][offset : offset + limit]

    @property
    def total(self) -> int:
        return len(self._logs)


class DAGExecutionEngine:
    def __init__(self):
        self._log = DAGExecutionLog()

    def validate_dag(self, nodes: list[dict], edges: list[dict]) -> dict:
        if not nodes:
            return {"valid": False, "errors": ["节点列表为空"]}

        node_ids = {n.get("id") for n in nodes}
        errors: list[str] = []

        for n in nodes:
            if not n.get("id"):
                errors.append("存在缺少 id 的节点")

        duplicate_ids = [nid for nid in node_ids if list(node_ids).count(nid) > 1]
        if duplicate_ids:
            errors.append(f"存在重复节点 id: {set(duplicate_ids)}")

        orphan_source = set()
        orphan_target = set()
        for e in edges:
            src = e.get("source") or e.get("from")
            tgt = e.get("target") or e.get("to")
            if src not in node_ids:
                orphan_source.add(src)
            if tgt not in node_ids:
                orphan_target.add(tgt)
        if orphan_source:
            errors.append(f"边的源节点不存在: {orphan_source}")
        if orphan_target:
            errors.append(f"边的目标节点不存在: {orphan_target}")

        valid_edges = []
        for e in edges:
            src = e.get("source") or e.get("from")
            tgt = e.get("target") or e.get("to")
            if src in node_ids and tgt in node_ids:
                valid_edges.append((src, tgt))

        adj = defaultdict(list)
        in_degree: dict[str, int] = {nid: 0 for nid in node_ids}
        for src, tgt in valid_edges:
            adj[src].append(tgt)
            in_degree[tgt] += 1

        visited = set()
        queue = deque(nid for nid, deg in in_degree.items() if deg == 0)
        while queue:
            nid = queue.popleft()
            visited.add(nid)
            for neighbor in adj[nid]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(visited) < len(node_ids):
            cycle_nodes = node_ids - visited
            errors.append(f"检测到环，涉及节点: {cycle_nodes}")

        connected = set(node_ids)
        if valid_edges:
            edge_nodes = set()
            for src, tgt in valid_edges:
                edge_nodes.add(src)
                edge_nodes.add(tgt)
            isolated = node_ids - edge_nodes
            if isolated and len(isolated) < len(node_ids):
                errors.append(f"存在孤立节点（无任何边连接）: {isolated}")

        if errors:
            return {"valid": False, "errors": errors}

        return {
            "valid": True,
            "errors": [],
            "node_count": len(nodes),
            "edge_count": len(valid_edges),
        }

    def topological_sort(self, nodes: list[dict], edges: list[dict]) -> list[list[str]]:
        if not nodes:
            return []

        node_ids = {n.get("id") for n in nodes if n.get("id")}

        adj = defaultdict(list)
        in_degree: dict[str, int] = {nid: 0 for nid in node_ids}
        for e in edges:
            src = e.get("source") or e.get("from")
            tgt = e.get("target") or e.get("to")
            if src in node_ids and tgt in node_ids:
                adj[src].append(tgt)
                in_degree[tgt] += 1

        layers: list[list[str]] = []
        remaining = set(node_ids)
        current_in = dict(in_degree)

        while remaining:
            layer = [nid for nid in remaining if current_in[nid] == 0]
            if not layer:
                break
            layers.append(sorted(layer))
            for nid in layer:
                remaining.discard(nid)
                for neighbor in adj[nid]:
                    if neighbor in remaining:
                        current_in[neighbor] -= 1

        return layers

    async def execute_dag(self, playbook_id: int, db: Session) -> dict:
        playbook = db.query(Playbook).filter(Playbook.id == playbook_id).first()
        if not playbook:
            return {"execution_id": None, "status": "failed", "error": "剧本不存在"}

        nodes = playbook.nodes or []
        edges = playbook.edges or []

        validation = self.validate_dag(nodes, edges)
        if not validation["valid"]:
            return {
                "execution_id": None,
                "status": "failed",
                "error": "DAG验证失败",
                "details": validation["errors"],
            }

        layers = self.topological_sort(nodes, edges)
        if not layers:
            return {"execution_id": None, "status": "failed", "error": "拓扑排序结果为空"}

        execution_id = _generate_exec_id()
        node_map = {n["id"]: n for n in nodes if n.get("id")}

        context: dict = {
            "playbook_id": playbook_id,
            "playbook_name": playbook.name,
            "trigger": playbook.trigger,
            "node_outputs": {},
        }

        node_results: dict[str, dict] = {}
        overall_status = "success"
        failed_nodes: list[str] = []

        exec_record = {
            "execution_id": execution_id,
            "playbook_id": playbook_id,
            "playbook_name": playbook.name,
            "status": "running",
            "started_at": _now_iso(),
            "finished_at": None,
            "layers": [],
            "node_results": {},
            "error": None,
        }
        self._log.append(exec_record)

        for layer_idx, layer in enumerate(layers):
            layer_tasks = []
            for node_id in layer:
                node = node_map[node_id]
                upstream_outputs = self._collect_upstream_outputs(
                    node_id, edges, node_results
                )
                node_context = {**context, "upstream_outputs": upstream_outputs}
                layer_tasks.append(self.execute_node(node, node_context))

            layer_results = await asyncio.gather(*layer_tasks, return_exceptions=True)

            layer_record = {
                "layer": layer_idx,
                "node_ids": layer,
                "results": {},
            }

            for node_id, result in zip(layer, layer_results):
                if isinstance(result, Exception):
                    result = {
                        "node_id": node_id,
                        "status": "failed",
                        "error": str(result),
                        "output": None,
                    }
                    logger.error("DAG节点执行异常 %s: %s", node_id, result)

                node_results[node_id] = result
                context["node_outputs"][node_id] = result.get("output")
                layer_record["results"][node_id] = result

                if result.get("status") == "failed":
                    failed_nodes.append(node_id)
                    node_data = node_map[node_id]
                    on_failure = node_data.get("data", {}).get("on_failure", "stop")
                    if on_failure == "stop":
                        overall_status = "failed"
                        exec_record["status"] = "failed"
                        exec_record["error"] = f"节点 {node_id} 执行失败，已停止"
                        exec_record["layers"].append(layer_record)
                        exec_record["node_results"].update(node_results)
                        exec_record["finished_at"] = _now_iso()
                        self._update_playbook_stats(db, playbook)
                        return exec_record

            exec_record["layers"].append(layer_record)

        if failed_nodes:
            overall_status = "partial_success"

        exec_record["status"] = overall_status
        exec_record["node_results"] = node_results
        exec_record["finished_at"] = _now_iso()

        self._update_playbook_stats(db, playbook)

        logger.info(
            "DAG执行完成 %s: playbook=%s status=%s",
            execution_id,
            playbook_id,
            overall_status,
        )
        return exec_record

    async def execute_node(self, node: dict, context: dict) -> dict:
        node_id = node.get("id", "unknown")
        node_type = node.get("type", "unknown")
        node_data = node.get("data", {})
        label = node_data.get("label", node.get("label", node_id))
        started_at = _now_iso()

        try:
            if node_type == "trigger":
                output = await self._execute_trigger(node, context)
            elif node_type == "action":
                output = await self._execute_action(node, context)
            elif node_type == "condition":
                output = await self._execute_condition(node, context)
            elif node_type == "delay":
                output = await self._execute_delay(node, context)
            elif node_type == "notify":
                output = await self._execute_notify(node, context)
            elif node_type == "approval":
                output = await self._execute_approval(node, context)
            else:
                output = {
                    "simulated": True,
                    "message": f"未知节点类型: {node_type}，已跳过",
                }

            return {
                "node_id": node_id,
                "node_type": node_type,
                "label": label,
                "status": "success",
                "started_at": started_at,
                "finished_at": _now_iso(),
                "output": output,
            }

        except Exception as exc:
            logger.error("DAG节点执行失败 %s (%s): %s", node_id, node_type, exc)
            return {
                "node_id": node_id,
                "node_type": node_type,
                "label": label,
                "status": "failed",
                "started_at": started_at,
                "finished_at": _now_iso(),
                "output": None,
                "error": str(exc),
            }

    async def _execute_trigger(self, node: dict, context: dict) -> dict:
        node_data = node.get("data", {})
        trigger_type = node_data.get("trigger_type", node_data.get("template_id", "manual"))
        condition = node_data.get("condition", {})

        return {
            "trigger_type": trigger_type,
            "condition": condition,
            "context_snapshot": {
                "playbook_name": context.get("playbook_name"),
                "trigger": context.get("trigger"),
            },
            "message": f"触发器 {trigger_type} 已激活",
        }

    async def _execute_action(self, node: dict, context: dict) -> dict:
        node_data = node.get("data", {})
        action_type = node_data.get("action_type", node_data.get("template_id", ""))
        target = node_data.get("target", "")
        params = node_data.get("params", {})

        upstream = context.get("upstream_outputs", {})
        if not target and upstream:
            for up_output in upstream.values():
                if isinstance(up_output, dict) and up_output.get("target"):
                    target = up_output["target"]
                    break

        action_map = {
            "act-block-ip": "ip_block",
            "act-isolate": "device_isolation",
            "act-freeze": "account_freeze",
            "act-reset-pwd": "password_reset",
            "act-forensic": "process_kill",
        }
        mapped_type = action_map.get(action_type, action_type)

        result = await action_engine.execute(
            action_type=mapped_type,
            target=target,
            params=params,
        )

        return {
            "action_type": mapped_type,
            "target": target,
            "execution_result": result,
            "target": target,
        }

    async def _execute_condition(self, node: dict, context: dict) -> dict:
        node_data = node.get("data", {})
        condition_type = node_data.get("condition_type", node_data.get("template_id", ""))
        operator = node_data.get("operator", "==")
        field = node_data.get("field", "severity")
        value = node_data.get("value", "")

        upstream = context.get("upstream_outputs", {})
        actual_value = None
        for up_output in upstream.values():
            if isinstance(up_output, dict):
                actual_value = up_output.get(field)
                if actual_value is not None:
                    break

        if actual_value is None:
            actual_value = context.get(field)

        result = self._evaluate_condition(actual_value, operator, value)

        return {
            "condition_type": condition_type,
            "field": field,
            "operator": operator,
            "expected_value": value,
            "actual_value": actual_value,
            "result": result,
        }

    async def _execute_delay(self, node: dict, context: dict) -> dict:
        node_data = node.get("data", {})
        seconds = node_data.get("seconds", node_data.get("duration", 0))
        if isinstance(seconds, str):
            try:
                seconds = int(seconds)
            except ValueError:
                seconds = 0

        seconds = min(max(seconds, 0), 300)

        if seconds > 0:
            await asyncio.sleep(seconds)

        return {
            "delay_seconds": seconds,
            "message": f"已等待 {seconds} 秒",
        }

    async def _execute_notify(self, node: dict, context: dict) -> dict:
        node_data = node.get("data", {})
        notify_type = node_data.get("notify_type", node_data.get("template_id", "notify-email"))
        recipients = node_data.get("recipients", [])
        message = node_data.get("message", "")

        return {
            "notify_type": notify_type,
            "recipients": recipients,
            "message": message,
            "simulated": True,
            "status": "sent",
            "detail": f"模拟发送{notify_type}通知至 {recipients}",
        }

    async def _execute_approval(self, node: dict, context: dict) -> dict:
        node_data = node.get("data", {})
        approver = node_data.get("approver", node_data.get("template_id", "approve-soc"))
        auto_approve = node_data.get("auto_approve", True)

        if auto_approve:
            return {
                "approver": approver,
                "status": "approved",
                "simulated": True,
                "message": f"模拟自动审批通过 ({approver})",
            }

        return {
            "approver": approver,
            "status": "pending",
            "message": f"等待 {approver} 审批",
        }

    def _evaluate_condition(
        self, actual, operator: str, expected
    ) -> bool:
        if actual is None:
            return False
        try:
            if operator == "==":
                return str(actual) == str(expected)
            elif operator == "!=":
                return str(actual) != str(expected)
            elif operator == ">":
                return float(actual) > float(expected)
            elif operator == ">=":
                return float(actual) >= float(expected)
            elif operator == "<":
                return float(actual) < float(expected)
            elif operator == "<=":
                return float(actual) <= float(expected)
            elif operator == "in":
                return str(actual) in str(expected)
            elif operator == "contains":
                return str(expected) in str(actual)
            else:
                return str(actual) == str(expected)
        except (ValueError, TypeError):
            return False

    def _collect_upstream_outputs(
        self, node_id: str, edges: list[dict], node_results: dict[str, dict]
    ) -> dict[str, dict]:
        upstream = {}
        for e in edges:
            src = e.get("source") or e.get("from")
            tgt = e.get("target") or e.get("to")
            if tgt == node_id and src in node_results:
                upstream[src] = node_results[src].get("output", {})
        return upstream

    def _update_playbook_stats(self, db: Session, playbook: Playbook):
        try:
            playbook.executions = (playbook.executions or 0) + 1
            playbook.last_execution = datetime.now(timezone.utc)
            db.commit()
        except Exception as exc:
            logger.error("更新剧本统计失败: %s", exc)
            db.rollback()

    def get_status(self, execution_id: str) -> dict:
        entry = self._log.get_by_id(execution_id)
        if entry is None:
            return {"execution_id": execution_id, "status": "not_found", "error": "执行记录不存在"}
        return entry

    def get_history(self, limit: int = 20, offset: int = 0) -> dict:
        items = self._log.query(limit=limit, offset=offset)
        return {"total": self._log.total, "items": items}


dag_engine = DAGExecutionEngine()
