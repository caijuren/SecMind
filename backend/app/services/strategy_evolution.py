import copy
import math
from uuid import uuid4
from datetime import datetime, timedelta, timezone
from typing import Optional


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_period(period: str) -> timedelta:
    unit = period[-1]
    value = int(period[:-1])
    if unit == "d":
        return timedelta(days=value)
    if unit == "h":
        return timedelta(hours=value)
    if unit == "m":
        return timedelta(minutes=value)
    return timedelta(days=30)


class StrategyEvolutionService:
    """处置策略自演化 - 基于历史执行效果自动优化策略"""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._execution_records = []
            cls._instance._strategy_adjustments = []
            cls._instance._current_params = copy.deepcopy(cls.DEFAULT_PARAMS)
        return cls._instance

    _execution_records: list = []
    _strategy_adjustments: list = []
    _current_params: dict = {}

    DEFAULT_PARAMS = {
        "ip_block": {"duration_hours": 1, "scope": "single_ip"},
        "device_isolation": {"scope": "full", "allow_essential": True},
        "account_freeze": {"duration_hours": 24, "notify_user": True},
        "password_reset": {"force_complexity": True, "notify_user": True},
        "process_kill": {"force": False, "collect_forensics": True},
        "file_quarantine": {"backup": True, "scan_similar": True},
    }

    VALID_ACTION_TYPES = list(DEFAULT_PARAMS.keys())

    MIN_RECORDS_FOR_ANALYSIS = 10
    MAX_ADJUSTMENT_RATIO = 0.30

    async def record_execution_result(
        self, action_type: str, target: str, params: dict, result: dict
    ) -> dict:
        record = {
            "id": f"rec-{uuid4().hex[:8]}",
            "action_type": action_type,
            "target": target,
            "params": params,
            "result": result,
            "success": result.get("status") == "success",
            "duration_ms": result.get("duration_ms", 0),
            "timestamp": _now_iso(),
        }
        self._execution_records.append(record)
        return record

    async def analyze_strategy_effectiveness(self, period: str = "30d") -> dict:
        cutoff = datetime.now(timezone.utc) - _parse_period(period)
        records = [
            r
            for r in self._execution_records
            if datetime.fromisoformat(r["timestamp"]) >= cutoff
        ]

        is_simulated = len(records) < self.MIN_RECORDS_FOR_ANALYSIS

        if is_simulated:
            return self._simulated_analysis(period)

        by_action: dict[str, list[dict]] = {}
        for r in records:
            by_action.setdefault(r["action_type"], []).append(r)

        action_stats = {}
        best_action = None
        worst_action = None
        best_rate = -1.0
        worst_rate = 2.0

        for action_type, recs in by_action.items():
            total = len(recs)
            successes = sum(1 for r in recs if r["success"])
            success_rate = successes / total if total > 0 else 0.0
            avg_duration = (
                sum(r["duration_ms"] for r in recs) / total if total > 0 else 0
            )
            action_stats[action_type] = {
                "total": total,
                "successes": successes,
                "failures": total - successes,
                "success_rate": round(success_rate, 4),
                "avg_duration_ms": round(avg_duration, 2),
            }
            if success_rate > best_rate:
                best_rate = success_rate
                best_action = action_type
            if success_rate < worst_rate:
                worst_rate = success_rate
                worst_action = action_type

        total_all = len(records)
        success_all = sum(1 for r in records if r["success"])
        avg_duration_all = (
            sum(r["duration_ms"] for r in records) / total_all if total_all > 0 else 0
        )

        suggestions = []
        for action_type, stats in action_stats.items():
            if stats["success_rate"] < 0.7:
                suggestions.append(
                    f"{action_type} 成功率仅 {stats['success_rate']:.0%}，建议优化参数或考虑替代策略"
                )
            if stats["avg_duration_ms"] > 5000:
                suggestions.append(
                    f"{action_type} 平均耗时 {stats['avg_duration_ms']:.0f}ms，建议优化执行效率"
                )

        return {
            "period": period,
            "is_simulated": False,
            "total_records": total_all,
            "overall_success_rate": round(success_all / total_all, 4) if total_all > 0 else 0.0,
            "overall_avg_duration_ms": round(avg_duration_all, 2),
            "action_stats": action_stats,
            "most_effective": best_action,
            "least_effective": worst_action,
            "optimization_suggestions": suggestions,
        }

    def _simulated_analysis(self, period: str) -> dict:
        simulated_stats = {}
        for action_type in self.VALID_ACTION_TYPES:
            base_rate = 0.75 + (hash(action_type) % 20) / 100
            simulated_stats[action_type] = {
                "total": 0,
                "successes": 0,
                "failures": 0,
                "success_rate": round(base_rate, 4),
                "avg_duration_ms": round(800 + (hash(action_type) % 2000), 2),
            }

        return {
            "period": period,
            "is_simulated": True,
            "message": f"历史执行记录不足 {self.MIN_RECORDS_FOR_ANALYSIS} 条，以下为模拟分析结果",
            "total_records": len(self._execution_records),
            "overall_success_rate": 0.82,
            "overall_avg_duration_ms": 1200.0,
            "action_stats": simulated_stats,
            "most_effective": "ip_block",
            "least_effective": "process_kill",
            "optimization_suggestions": [
                "数据不足，建议积累更多执行记录后进行分析",
                "当前分析基于模拟数据，仅供参考",
            ],
        }

    async def suggest_optimization(self, action_type: str) -> dict:
        if action_type not in self.VALID_ACTION_TYPES:
            return {
                "action_type": action_type,
                "error": f"未知的动作类型: {action_type}，有效类型: {self.VALID_ACTION_TYPES}",
            }

        records = [r for r in self._execution_records if r["action_type"] == action_type]

        is_simulated = len(records) < self.MIN_RECORDS_FOR_ANALYSIS

        if is_simulated:
            return self._simulated_suggestion(action_type, len(records))

        total = len(records)
        successes = sum(1 for r in records if r["success"])
        success_rate = successes / total if total > 0 else 0.0
        avg_duration = sum(r["duration_ms"] for r in records) / total if total > 0 else 0

        recent = records[-min(10, total):]
        recent_successes = sum(1 for r in recent if r["success"])
        recent_rate = recent_successes / len(recent) if recent else 0.0

        trend = "stable"
        if recent_rate > success_rate + 0.05:
            trend = "improving"
        elif recent_rate < success_rate - 0.05:
            trend = "declining"

        failure_records = [r for r in records if not r["success"]]
        common_failure_reasons = []
        if failure_records:
            reason_counts: dict[str, int] = {}
            for r in failure_records:
                reason = r["result"].get("error", r["result"].get("reason", "unknown"))
                reason_counts[reason] = reason_counts.get(reason, 0) + 1
            sorted_reasons = sorted(reason_counts.items(), key=lambda x: -x[1])
            common_failure_reasons = [
                {"reason": reason, "count": count}
                for reason, count in sorted_reasons[:5]
            ]

        param_suggestions = self._generate_param_suggestions(
            action_type, success_rate, records
        )

        alternative_suggestions = self._generate_alternative_suggestions(
            action_type, success_rate
        )

        return {
            "action_type": action_type,
            "is_simulated": False,
            "total_records": total,
            "success_rate": round(success_rate, 4),
            "recent_success_rate": round(recent_rate, 4),
            "trend": trend,
            "avg_duration_ms": round(avg_duration, 2),
            "common_failure_reasons": common_failure_reasons,
            "param_suggestions": param_suggestions,
            "alternative_suggestions": alternative_suggestions,
        }

    def _simulated_suggestion(self, action_type: str, record_count: int) -> dict:
        params = self._current_params.get(action_type, {})
        return {
            "action_type": action_type,
            "is_simulated": True,
            "message": f"历史执行记录不足 {self.MIN_RECORDS_FOR_ANALYSIS} 条（当前 {record_count} 条），以下为模拟建议",
            "total_records": record_count,
            "success_rate": 0.80,
            "recent_success_rate": 0.80,
            "trend": "stable",
            "avg_duration_ms": 1000.0,
            "common_failure_reasons": [],
            "param_suggestions": [
                {
                    "parameter": k,
                    "current_value": v,
                    "suggested_value": v,
                    "reason": "数据不足，维持当前参数",
                }
                for k, v in params.items()
            ],
            "alternative_suggestions": [
                "数据不足，建议积累更多执行记录后获取精准建议"
            ],
        }

    def _generate_param_suggestions(
        self, action_type: str, success_rate: float, records: list[dict]
    ) -> list[dict]:
        suggestions = []
        current = self._current_params.get(action_type, {})

        if action_type == "ip_block":
            recurrences = sum(
                1
                for r in records
                if not r["success"] and "recurrence" in r["result"].get("error", "")
            )
            recurrence_rate = recurrences / len(records) if records else 0
            if recurrence_rate > 0.3:
                new_duration = min(
                    current.get("duration_hours", 1) * 1.3,
                    current.get("duration_hours", 1) * (1 + self.MAX_ADJUSTMENT_RATIO),
                )
                suggestions.append(
                    {
                        "parameter": "duration_hours",
                        "current_value": current.get("duration_hours", 1),
                        "suggested_value": round(new_duration, 1),
                        "reason": f"复发率 {recurrence_rate:.0%} > 30%，建议延长封堵时长",
                    }
                )
            if success_rate < 0.7 and current.get("scope") == "single_ip":
                suggestions.append(
                    {
                        "parameter": "scope",
                        "current_value": "single_ip",
                        "suggested_value": "subnet",
                        "reason": f"成功率 {success_rate:.0%} 偏低，建议扩大封堵范围到子网级别",
                    }
                )

        elif action_type == "device_isolation":
            business_impact = sum(
                1
                for r in records
                if not r["success"]
                and "business" in r["result"].get("error", "").lower()
            )
            impact_rate = business_impact / len(records) if records else 0
            if impact_rate > 0.2 and current.get("scope") == "full":
                suggestions.append(
                    {
                        "parameter": "scope",
                        "current_value": "full",
                        "suggested_value": "partial",
                        "reason": f"业务影响率 {impact_rate:.0%} > 20%，建议缩小隔离范围",
                    }
                )

        elif action_type == "account_freeze":
            false_freeze = sum(
                1
                for r in records
                if r["success"] and r["result"].get("false_positive", False)
            )
            fp_rate = false_freeze / len(records) if records else 0
            if fp_rate > 0.2:
                new_duration = max(
                    current.get("duration_hours", 24) * 0.7,
                    current.get("duration_hours", 24) * (1 - self.MAX_ADJUSTMENT_RATIO),
                )
                suggestions.append(
                    {
                        "parameter": "duration_hours",
                        "current_value": current.get("duration_hours", 24),
                        "suggested_value": round(new_duration, 1),
                        "reason": f"误冻结率 {fp_rate:.0%} > 20%，建议缩短冻结时长",
                    }
                )

        elif action_type == "password_reset":
            if success_rate < 0.8:
                suggestions.append(
                    {
                        "parameter": "force_complexity",
                        "current_value": current.get("force_complexity", True),
                        "suggested_value": True,
                        "reason": f"成功率 {success_rate:.0%} 偏低，建议强制复杂度要求",
                    }
                )

        elif action_type == "process_kill":
            data_loss = sum(
                1
                for r in records
                if "data_loss" in r["result"].get("error", "")
            )
            if data_loss > 0 and not current.get("collect_forensics", True):
                suggestions.append(
                    {
                        "parameter": "collect_forensics",
                        "current_value": False,
                        "suggested_value": True,
                        "reason": f"检测到 {data_loss} 次数据丢失，建议启用取证收集",
                    }
                )

        elif action_type == "file_quarantine":
            missed = sum(
                1
                for r in records
                if not r["success"] and "similar" in r["result"].get("error", "").lower()
            )
            if missed > 0 and not current.get("scan_similar", True):
                suggestions.append(
                    {
                        "parameter": "scan_similar",
                        "current_value": False,
                        "suggested_value": True,
                        "reason": f"检测到 {missed} 次相似文件遗漏，建议启用相似文件扫描",
                    }
                )

        if not suggestions:
            suggestions.append(
                {
                    "parameter": "none",
                    "current_value": None,
                    "suggested_value": None,
                    "reason": "当前参数表现良好，无需调整",
                }
            )

        return suggestions

    def _generate_alternative_suggestions(
        self, action_type: str, success_rate: float
    ) -> list[str]:
        alternatives = []
        if success_rate < 0.6:
            mapping = {
                "ip_block": ["考虑使用流量清洗替代直接封堵", "结合威胁情报进行精准封堵"],
                "device_isolation": ["考虑使用网络微隔离替代完全隔离", "采用渐进式隔离策略"],
                "account_freeze": ["考虑使用会话失效替代账号冻结", "采用临时权限降级策略"],
                "password_reset": ["考虑强制MFA认证替代密码重置", "结合风险评估决定重置方式"],
                "process_kill": ["考虑使用进程挂起替代直接终止", "结合沙箱分析后决定处置方式"],
                "file_quarantine": ["考虑使用文件加密替代隔离", "结合云沙箱分析后决定处置方式"],
            }
            alternatives = mapping.get(action_type, ["建议评估替代处置方案"])
        elif success_rate < 0.8:
            alternatives = ["建议微调当前策略参数以提升效果"]
        else:
            alternatives = ["当前策略效果良好，建议维持"]
        return alternatives

    async def auto_adjust_strategy(self, action_type: str) -> dict:
        if action_type not in self.VALID_ACTION_TYPES:
            return {
                "action_type": action_type,
                "error": f"未知的动作类型: {action_type}，有效类型: {self.VALID_ACTION_TYPES}",
            }

        records = [r for r in self._execution_records if r["action_type"] == action_type]

        if len(records) < self.MIN_RECORDS_FOR_ANALYSIS:
            return {
                "action_type": action_type,
                "adjusted": False,
                "is_simulated": True,
                "message": f"历史执行记录不足 {self.MIN_RECORDS_FOR_ANALYSIS} 条（当前 {len(records)} 条），无法自动调整",
                "current_params": self._current_params.get(action_type, {}),
            }

        old_params = copy.deepcopy(self._current_params.get(action_type, {}))
        new_params = copy.deepcopy(old_params)
        adjustments = []

        total = len(records)
        successes = sum(1 for r in records if r["success"])
        success_rate = successes / total if total > 0 else 0.0

        if action_type == "ip_block":
            recurrences = sum(
                1
                for r in records
                if not r["success"] and "recurrence" in r["result"].get("error", "")
            )
            recurrence_rate = recurrences / total
            if recurrence_rate > 0.3:
                old_val = new_params.get("duration_hours", 1)
                new_val = round(old_val * (1 + min(recurrence_rate, self.MAX_ADJUSTMENT_RATIO)), 1)
                new_params["duration_hours"] = new_val
                adjustments.append(
                    {
                        "parameter": "duration_hours",
                        "old_value": old_val,
                        "new_value": new_val,
                        "adjustment_ratio": round((new_val - old_val) / old_val, 4) if old_val else 0,
                        "reason": f"复发率 {recurrence_rate:.0%} > 30%，延长封堵时长",
                    }
                )

        elif action_type == "device_isolation":
            business_impact = sum(
                1
                for r in records
                if not r["success"]
                and "business" in r["result"].get("error", "").lower()
            )
            impact_rate = business_impact / total
            if impact_rate > 0.2 and new_params.get("scope") == "full":
                new_params["scope"] = "partial"
                adjustments.append(
                    {
                        "parameter": "scope",
                        "old_value": "full",
                        "new_value": "partial",
                        "adjustment_ratio": None,
                        "reason": f"业务影响率 {impact_rate:.0%} > 20%，缩小隔离范围",
                    }
                )

        elif action_type == "account_freeze":
            false_freeze = sum(
                1
                for r in records
                if r["success"] and r["result"].get("false_positive", False)
            )
            fp_rate = false_freeze / total
            if fp_rate > 0.2:
                old_val = new_params.get("duration_hours", 24)
                ratio = min(fp_rate, self.MAX_ADJUSTMENT_RATIO)
                new_val = round(old_val * (1 - ratio), 1)
                new_params["duration_hours"] = new_val
                adjustments.append(
                    {
                        "parameter": "duration_hours",
                        "old_value": old_val,
                        "new_value": new_val,
                        "adjustment_ratio": round((old_val - new_val) / old_val, 4) if old_val else 0,
                        "reason": f"误冻结率 {fp_rate:.0%} > 20%，缩短冻结时长",
                    }
                )

        elif action_type == "password_reset":
            if success_rate < 0.8 and not new_params.get("force_complexity", True):
                new_params["force_complexity"] = True
                adjustments.append(
                    {
                        "parameter": "force_complexity",
                        "old_value": False,
                        "new_value": True,
                        "adjustment_ratio": None,
                        "reason": f"成功率 {success_rate:.0%} 偏低，启用强制复杂度",
                    }
                )

        elif action_type == "process_kill":
            data_loss = sum(
                1
                for r in records
                if "data_loss" in r["result"].get("error", "")
            )
            if data_loss > 0 and not new_params.get("collect_forensics", True):
                new_params["collect_forensics"] = True
                adjustments.append(
                    {
                        "parameter": "collect_forensics",
                        "old_value": False,
                        "new_value": True,
                        "adjustment_ratio": None,
                        "reason": f"检测到 {data_loss} 次数据丢失，启用取证收集",
                    }
                )

        elif action_type == "file_quarantine":
            missed = sum(
                1
                for r in records
                if not r["success"] and "similar" in r["result"].get("error", "").lower()
            )
            if missed > 0 and not new_params.get("scan_similar", True):
                new_params["scan_similar"] = True
                adjustments.append(
                    {
                        "parameter": "scan_similar",
                        "old_value": False,
                        "new_value": True,
                        "adjustment_ratio": None,
                        "reason": f"检测到 {missed} 次相似文件遗漏，启用相似文件扫描",
                    }
                )

        if not adjustments:
            return {
                "action_type": action_type,
                "adjusted": False,
                "is_simulated": False,
                "message": "当前策略参数表现良好，无需调整",
                "current_params": old_params,
            }

        self._current_params[action_type] = new_params

        adjustment_record = {
            "id": f"adj-{uuid4().hex[:8]}",
            "action_type": action_type,
            "old_params": old_params,
            "new_params": new_params,
            "adjustments": adjustments,
            "timestamp": _now_iso(),
            "is_rolled_back": False,
            "rolled_back_at": None,
        }
        self._strategy_adjustments.append(adjustment_record)

        return {
            "action_type": action_type,
            "adjusted": True,
            "is_simulated": False,
            "adjustment_id": adjustment_record["id"],
            "old_params": old_params,
            "new_params": new_params,
            "adjustments": adjustments,
        }

    async def rollback_adjustment(self, adjustment_id: str) -> dict:
        target = None
        for adj in self._strategy_adjustments:
            if adj["id"] == adjustment_id:
                target = adj
                break

        if not target:
            return {
                "rolled_back": False,
                "error": f"未找到调整记录: {adjustment_id}",
            }

        if target["is_rolled_back"]:
            return {
                "rolled_back": False,
                "error": "该调整已被回滚，不可重复操作",
            }

        action_type = target["action_type"]
        self._current_params[action_type] = copy.deepcopy(target["old_params"])

        target["is_rolled_back"] = True
        target["rolled_back_at"] = _now_iso()

        return {
            "rolled_back": True,
            "adjustment_id": adjustment_id,
            "action_type": action_type,
            "restored_params": target["old_params"],
            "rolled_back_at": target["rolled_back_at"],
        }

    async def get_evolution_history(self, limit: int = 20) -> list[dict]:
        history = sorted(
            self._strategy_adjustments, key=lambda x: x["timestamp"], reverse=True
        )
        return history[:limit]

    async def get_current_params(self) -> dict:
        return copy.deepcopy(self._current_params)


strategy_evolution_service = StrategyEvolutionService()
