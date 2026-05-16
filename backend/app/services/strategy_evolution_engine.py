import copy
import math
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.strategy import Strategy, StrategyEvolution, StrategyFeedback, StrategyAdjustment


DISPOSAL_ACTIONS = [
    "block_ip",
    "isolate_device",
    "freeze_account",
    "reset_credentials",
    "kill_process",
    "quarantine_file",
    "block_traffic",
    "notify_team",
    "no_action",
]

ATTACK_PHASES = ["initial", "active", "containment", "recovery"]
CONFIDENCE_LEVELS = ["low", "medium", "high"]
ASSET_CRITICALITY_LEVELS = ["low", "medium", "high"]
SUCCESS_RATE_LEVELS = ["low", "medium", "high"]


def _discretize_confidence(confidence: float) -> str:
    if confidence < 0.4:
        return "low"
    elif confidence < 0.7:
        return "medium"
    return "high"


def _discretize_success_rate(rate: float) -> str:
    if rate < 0.4:
        return "low"
    elif rate < 0.7:
        return "medium"
    return "high"


def _state_key(
    attack_phase: str,
    confidence_level: str,
    asset_criticality: str,
    success_rate_level: str,
) -> str:
    return f"{attack_phase}|{confidence_level}|{asset_criticality}|{success_rate_level}"


def _calculate_reward(
    correct_disposal: bool,
    false_positive: bool,
    response_delay_minutes: float,
) -> float:
    reward = 0.0
    if correct_disposal:
        reward += 1.0
    if false_positive:
        reward -= 5.0
    reward -= 0.1 * response_delay_minutes
    return reward


class StrategyEvolutionEngine:

    def __init__(self):
        self.q_table: Dict[str, Dict[str, float]] = {}
        self.alpha = 0.1
        self.gamma = 0.9
        self.fitness_window = 50

    def _get_q_value(self, state_key: str, action: str) -> float:
        if state_key not in self.q_table:
            self.q_table[state_key] = {}
        return self.q_table[state_key].get(action, 0.0)

    def _set_q_value(self, state_key: str, action: str, value: float):
        if state_key not in self.q_table:
            self.q_table[state_key] = {}
        self.q_table[state_key][action] = value

    def _max_q(self, state_key: str) -> float:
        if state_key not in self.q_table or not self.q_table[state_key]:
            return 0.0
        return max(self.q_table[state_key].values())

    def q_learning_update(
        self,
        attack_phase: str,
        confidence: float,
        asset_criticality: str,
        historical_success_rate: float,
        action: str,
        correct_disposal: bool,
        false_positive: bool,
        response_delay_minutes: float,
        next_attack_phase: str,
        next_confidence: float,
        next_asset_criticality: str,
        next_historical_success_rate: float,
    ):
        confidence_level = _discretize_confidence(confidence)
        success_rate_level = _discretize_success_rate(historical_success_rate)
        next_confidence_level = _discretize_confidence(next_confidence)
        next_success_rate_level = _discretize_success_rate(next_historical_success_rate)

        state = _state_key(attack_phase, confidence_level, asset_criticality, success_rate_level)
        next_state = _state_key(
            next_attack_phase, next_confidence_level, next_asset_criticality, next_success_rate_level
        )

        reward = _calculate_reward(correct_disposal, false_positive, response_delay_minutes)

        old_q = self._get_q_value(state, action)
        max_future_q = self._max_q(next_state)
        new_q = old_q + self.alpha * (reward + self.gamma * max_future_q - old_q)
        self._set_q_value(state, action, new_q)

    def select_best_action(
        self,
        attack_phase: str,
        confidence: float,
        asset_criticality: str,
        historical_success_rate: float,
    ) -> Tuple[str, float]:
        confidence_level = _discretize_confidence(confidence)
        success_rate_level = _discretize_success_rate(historical_success_rate)
        state = _state_key(attack_phase, confidence_level, asset_criticality, success_rate_level)

        best_action = "no_action"
        best_q = -float("inf")

        for action in DISPOSAL_ACTIONS:
            q_val = self._get_q_value(state, action)
            if q_val > best_q:
                best_q = q_val
                best_action = action

        if best_q == -float("inf"):
            best_q = 0.0

        return best_action, best_q

    def evaluate_strategy(
        self,
        strategy: Strategy,
        feedback_history: List[StrategyFeedback],
    ) -> Dict[str, Any]:
        if not feedback_history:
            return {
                "strategy_id": strategy.id,
                "strategy_name": strategy.name,
                "effectiveness": "unknown",
                "score": 0.5,
                "reason": "无反馈数据，无法评估",
                "metrics": {
                    "total_feedbacks": 0,
                    "success_rate": 0.0,
                    "avg_reward": 0.0,
                    "recent_trend": "unknown",
                },
            }

        total = len(feedback_history)
        successes = sum(1 for f in feedback_history if f.outcome == "success")
        success_rate = successes / total if total > 0 else 0.0
        avg_reward = sum(f.reward for f in feedback_history) / total if total > 0 else 0.0

        recent_window = min(20, total)
        recent = feedback_history[:recent_window]
        recent_successes = sum(1 for f in recent if f.outcome == "success")
        recent_success_rate = recent_successes / recent_window if recent_window > 0 else 0.0

        if recent_success_rate > success_rate + 0.05:
            trend = "improving"
        elif recent_success_rate < success_rate - 0.05:
            trend = "declining"
        else:
            trend = "stable"

        if success_rate >= 0.85:
            effectiveness = "excellent"
            score = 0.9 + (success_rate - 0.85) * 0.67
        elif success_rate >= 0.70:
            effectiveness = "good"
            score = 0.7 + (success_rate - 0.70) * 0.67
        elif success_rate >= 0.50:
            effectiveness = "moderate"
            score = 0.4 + (success_rate - 0.50) * 0.67
        else:
            effectiveness = "poor"
            score = max(0.1, success_rate * 0.8)

        score = round(min(1.0, score), 4)

        return {
            "strategy_id": strategy.id,
            "strategy_name": strategy.name,
            "effectiveness": effectiveness,
            "score": score,
            "reason": f"基于 {total} 条反馈评估，成功率 {success_rate:.1%}",
            "metrics": {
                "total_feedbacks": total,
                "success_rate": round(success_rate, 4),
                "avg_reward": round(avg_reward, 4),
                "recent_success_rate": round(recent_success_rate, 4),
                "recent_trend": trend,
            },
        }

    def calculate_fitness(
        self,
        strategy: Strategy,
        recent_outcomes: List[Dict[str, Any]],
    ) -> float:
        if not recent_outcomes:
            return strategy.fitness_score

        total = len(recent_outcomes)
        correct = sum(1 for o in recent_outcomes if o.get("outcome") == "success")
        false_positives = sum(1 for o in recent_outcomes if o.get("false_positive", False))
        total_delay = sum(o.get("response_delay_minutes", 0) for o in recent_outcomes)

        base_fitness = correct / total if total > 0 else 0.5

        fp_penalty = (false_positives / total) * 0.5 if total > 0 else 0.0

        avg_delay = total_delay / total if total > 0 else 0.0
        delay_penalty = min(0.1, avg_delay * 0.002)

        fitness = base_fitness - fp_penalty - delay_penalty
        fitness = max(0.0, min(1.0, fitness))

        return round(fitness, 4)

    def suggest_adjustments(
        self,
        strategy: Strategy,
        performance_metrics: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        suggestions = []

        success_rate = performance_metrics.get("success_rate", 0.0)
        avg_reward = performance_metrics.get("avg_reward", 0.0)
        trend = performance_metrics.get("recent_trend", "stable")
        total = performance_metrics.get("total_feedbacks", 0)

        if total < 5:
            suggestions.append({
                "type": "insufficient_data",
                "parameter": None,
                "current_value": None,
                "suggested_value": None,
                "priority": "low",
                "reason": f"反馈数据不足（仅 {total} 条），需要更多数据后才能给出精准建议",
            })
            return suggestions

        if success_rate < 0.60:
            new_threshold = max(0.45, strategy.confidence_threshold - 0.08)
            suggestions.append({
                "type": "confidence_threshold",
                "parameter": "confidence_threshold",
                "current_value": strategy.confidence_threshold,
                "suggested_value": round(new_threshold, 2),
                "priority": "high",
                "reason": f"成功率仅 {success_rate:.1%}，建议降低置信度阈值从 {strategy.confidence_threshold} 到 {new_threshold:.2f}，扩大自动处置范围",
            })

        if success_rate > 0.90 and avg_reward > 0.6:
            new_threshold = min(0.98, strategy.confidence_threshold + 0.05)
            suggestions.append({
                "type": "confidence_threshold",
                "parameter": "confidence_threshold",
                "current_value": strategy.confidence_threshold,
                "suggested_value": round(new_threshold, 2),
                "priority": "medium",
                "reason": f"成功率 {success_rate:.1%} 优秀，建议提高置信度阈值到 {new_threshold:.2f}，减少不必要的自动处置",
            })

        if trend == "declining":
            suggestions.append({
                "type": "rule_adjustment",
                "parameter": "rules",
                "current_value": strategy.rules,
                "suggested_value": None,
                "priority": "high",
                "reason": "策略效果持续下降，建议重新评估规则条件和动作优先级",
            })

            if strategy.priority > 0:
                new_priority = strategy.priority - 1
                suggestions.append({
                    "type": "priority",
                    "parameter": "priority",
                    "current_value": strategy.priority,
                    "suggested_value": new_priority,
                    "priority": "medium",
                    "reason": f"策略效果下降，建议降低优先级从 {strategy.priority} 到 {new_priority}",
                })

        if avg_reward < -0.5:
            suggestions.append({
                "type": "action_replacement",
                "parameter": "actions",
                "current_value": strategy.actions,
                "suggested_value": None,
                "priority": "high",
                "reason": f"平均奖励 {avg_reward:.2f} 严重偏低，建议审查处置动作是否适当，考虑替换高误判率的动作",
            })

        if not suggestions:
            suggestions.append({
                "type": "no_change",
                "parameter": None,
                "current_value": None,
                "suggested_value": None,
                "priority": "low",
                "reason": "当前策略表现稳定，无需调整",
            })

        return suggestions

    def apply_evolution(
        self,
        db: Session,
        strategy: Strategy,
        adjustment: Dict[str, Any],
    ) -> StrategyEvolution:
        old_version = strategy.version
        old_fitness = strategy.fitness_score
        old_rules = copy.deepcopy(strategy.rules)
        old_actions = copy.deepcopy(strategy.actions)

        adj_type = adjustment.get("type", "unknown")
        parameter = adjustment.get("parameter")
        suggested_value = adjustment.get("suggested_value")
        reason = adjustment.get("reason", "")

        if adj_type == "confidence_threshold" and parameter == "confidence_threshold":
            strategy.confidence_threshold = suggested_value
        elif adj_type == "priority" and parameter == "priority":
            strategy.priority = suggested_value
        elif adj_type == "rule_adjustment" and parameter == "rules":
            new_rules = copy.deepcopy(strategy.rules)
            for rule in new_rules:
                if rule.get("priority", 0) > 1:
                    rule["priority"] = rule["priority"] - 1
            strategy.rules = new_rules

        strategy.version += 1

        evolution = StrategyEvolution(
            strategy_id=strategy.id,
            old_version=old_version,
            new_version=strategy.version,
            change_type=adj_type,
            change_description=reason,
            old_rules=old_rules,
            new_rules=copy.deepcopy(strategy.rules),
            trigger_reason=f"adjustment_type={adj_type}, parameter={parameter}",
            fitness_before=old_fitness,
            fitness_after=strategy.fitness_score,
        )
        db.add(evolution)
        db.commit()
        db.refresh(strategy)

        return evolution

    def optimize_confidence_threshold(
        self,
        strategy: Strategy,
        history: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        if not history:
            return {
                "optimized": False,
                "current_threshold": strategy.confidence_threshold,
                "suggested_threshold": strategy.confidence_threshold,
                "reason": "无历史数据，维持当前阈值",
            }

        total = len(history)
        correct_disposals = sum(1 for h in history if h.get("outcome") == "success")
        false_positives = sum(1 for h in history if h.get("false_positive", False))
        missed = sum(1 for h in history if h.get("outcome") == "missed")

        success_rate = correct_disposals / total if total > 0 else 0.0
        fp_rate = false_positives / total if total > 0 else 0.0
        miss_rate = missed / total if total > 0 else 0.0

        current = strategy.confidence_threshold
        suggested = current

        if fp_rate > 0.15:
            suggested = min(0.98, current + 0.06)
            reason = f"误判率 {fp_rate:.1%} > 15%，建议提高阈值以减少误判"
        elif miss_rate > 0.15:
            suggested = max(0.40, current - 0.06)
            reason = f"漏报率 {miss_rate:.1%} > 15%，建议降低阈值以减少漏报"
        elif success_rate > 0.90 and fp_rate < 0.05:
            suggested = max(0.40, current - 0.03)
            reason = f"成功率 {success_rate:.1%} 优秀且误判率低，可适度降低阈值扩大覆盖"
        elif success_rate < 0.60:
            suggested = max(0.40, current - 0.08)
            reason = f"成功率 {success_rate:.1%} 偏低，建议降低阈值扩大自动处置范围"
        else:
            reason = "当前阈值表现合理，无需调整"

        return {
            "optimized": abs(suggested - current) > 0.01,
            "current_threshold": current,
            "suggested_threshold": round(suggested, 2),
            "metrics": {
                "success_rate": round(success_rate, 4),
                "false_positive_rate": round(fp_rate, 4),
                "miss_rate": round(miss_rate, 4),
                "total_samples": total,
            },
            "reason": reason,
        }

    def optimize_response_actions(
        self,
        strategy: Strategy,
        attack_types: List[str],
    ) -> Dict[str, List[str]]:
        action_mapping: Dict[str, List[str]] = {
            "credential_theft": ["freeze_account", "reset_credentials", "notify_team", "enhance_monitoring"],
            "account_takeover": ["freeze_account", "reset_credentials", "enable_mfa", "notify_team"],
            "c2_communication": ["block_ip", "isolate_device", "block_traffic", "notify_team"],
            "dns_tunnel": ["block_ip", "block_traffic", "enhance_monitoring", "preserve_forensics"],
            "brute_force": ["block_ip", "lock_account", "enable_mfa", "enhance_monitoring"],
            "password_spray": ["lock_account", "enable_mfa", "notify_team", "enhance_monitoring"],
            "data_exfiltration": ["block_traffic", "isolate_device", "preserve_forensics", "notify_team"],
            "data_leak": ["block_traffic", "quarantine_file", "preserve_forensics", "notify_team"],
            "malware_execution": ["kill_process", "quarantine_file", "isolate_device", "preserve_forensics"],
            "ransomware": ["isolate_device", "kill_process", "block_traffic", "preserve_forensics"],
            "phishing": ["reset_credentials", "freeze_account", "notify_team", "enhance_monitoring"],
            "privilege_escalation": ["freeze_account", "isolate_device", "preserve_forensics", "notify_team"],
        }

        result: Dict[str, List[str]] = {}
        for attack_type in attack_types:
            if attack_type in action_mapping:
                result[attack_type] = action_mapping[attack_type]
            else:
                result[attack_type] = ["enhance_monitoring", "notify_team", "preserve_forensics"]

        return result

    def detect_strategy_decay(
        self,
        strategy: Strategy,
        recent_performance: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        if len(recent_performance) < 10:
            return {
                "strategy_id": strategy.id,
                "strategy_name": strategy.name,
                "is_decaying": False,
                "confidence": 0.0,
                "reason": "性能数据不足，无法判断策略衰退",
                "metrics": {},
            }

        total = len(recent_performance)
        successes = sum(1 for p in recent_performance if p.get("outcome") == "success")
        success_rate = successes / total if total > 0 else 0.0
        avg_reward = sum(p.get("reward", 0) for p in recent_performance) / total if total > 0 else 0.0

        half = total // 2
        first_half = recent_performance[half:]
        second_half = recent_performance[:half]

        first_successes = sum(1 for p in first_half if p.get("outcome") == "success")
        second_successes = sum(1 for p in second_half if p.get("outcome") == "success")

        first_rate = first_successes / len(first_half) if first_half else 0.0
        second_rate = second_successes / len(second_half) if second_half else 0.0

        decay_rate = first_rate - second_rate

        first_avg_reward = sum(p.get("reward", 0) for p in first_half) / len(first_half) if first_half else 0.0
        second_avg_reward = sum(p.get("reward", 0) for p in second_half) / len(second_half) if second_half else 0.0

        is_decaying = False
        confidence = 0.0
        reason = ""

        if decay_rate > 0.15 and avg_reward < 0.0:
            is_decaying = True
            confidence = min(0.95, decay_rate * 3)
            reason = f"策略成功率从 {first_rate:.1%} 下降至 {second_rate:.1%}，且平均奖励为负，存在明显衰退"
        elif decay_rate > 0.10:
            is_decaying = True
            confidence = min(0.80, decay_rate * 4)
            reason = f"策略成功率从 {first_rate:.1%} 下降至 {second_rate:.1%}，呈下降趋势"
        elif decay_rate > 0.05 and avg_reward < -0.2:
            is_decaying = True
            confidence = 0.55
            reason = f"策略成功率轻微下降，且平均奖励偏低，可能存在衰退风险"
        elif decay_rate <= 0:
            reason = f"策略表现稳定或改善，成功率从 {first_rate:.1%} 到 {second_rate:.1%}"
        else:
            reason = f"策略成功率从 {first_rate:.1%} 到 {second_rate:.1%}，轻微下降但仍在可接受范围"

        return {
            "strategy_id": strategy.id,
            "strategy_name": strategy.name,
            "is_decaying": is_decaying,
            "confidence": round(confidence, 4),
            "reason": reason,
            "metrics": {
                "total_samples": total,
                "overall_success_rate": round(success_rate, 4),
                "overall_avg_reward": round(avg_reward, 4),
                "first_half_success_rate": round(first_rate, 4),
                "second_half_success_rate": round(second_rate, 4),
                "decay_rate": round(decay_rate, 4),
                "first_half_avg_reward": round(first_avg_reward, 4),
                "second_half_avg_reward": round(second_avg_reward, 4),
            },
        }

    def trigger_evolution(
        self,
        db: Session,
        strategy_id: int,
        feedback_window: int = 50,
    ) -> Dict[str, Any]:
        strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
        if not strategy:
            return {"evolved": False, "error": "策略不存在"}

        feedbacks = (
            db.query(StrategyFeedback)
            .filter(StrategyFeedback.strategy_id == strategy_id)
            .order_by(StrategyFeedback.id.desc())
            .limit(feedback_window)
            .all()
        )

        evaluation = self.evaluate_strategy(strategy, feedbacks)
        metrics = evaluation["metrics"]

        adjustments = self.suggest_adjustments(strategy, metrics)
        high_priority_adjustments = [a for a in adjustments if a.get("priority") == "high"]

        recent_outcomes = [
            {
                "outcome": f.outcome,
                "false_positive": (f.context or {}).get("false_positive", False),
                "response_delay_minutes": (f.context or {}).get("response_delay_minutes", 0),
                "reward": f.reward,
            }
            for f in feedbacks
        ]

        new_fitness = self.calculate_fitness(strategy, recent_outcomes)
        strategy.fitness_score = new_fitness

        decay_result = self.detect_strategy_decay(strategy, recent_outcomes)

        evolved = False
        evolution_record = None
        change_type = None
        change_description = None

        if high_priority_adjustments and decay_result.get("is_decaying", False):
            adjustment = high_priority_adjustments[0]
            evolution_record = self.apply_evolution(db, strategy, adjustment)
            evolved = True
            change_type = adjustment.get("type")
            change_description = adjustment.get("reason")
        elif decay_result.get("is_decaying", False) and decay_result.get("confidence", 0) > 0.6:
            change_type = "decay_response"
            change_description = f"检测到策略衰退（置信度 {decay_result['confidence']:.0%}），进行自动修复"

            old_version = strategy.version
            old_fitness = strategy.fitness_score
            old_rules = copy.deepcopy(strategy.rules)

            new_threshold = max(0.45, strategy.confidence_threshold - 0.05)
            strategy.confidence_threshold = new_threshold
            strategy.version += 1

            evolution_record = StrategyEvolution(
                strategy_id=strategy.id,
                old_version=old_version,
                new_version=strategy.version,
                change_type=change_type,
                change_description=change_description,
                old_rules=old_rules,
                new_rules=copy.deepcopy(strategy.rules),
                trigger_reason=f"decay_detected, confidence={decay_result['confidence']}",
                fitness_before=old_fitness,
                fitness_after=strategy.fitness_score,
            )
            db.add(evolution_record)
            db.commit()
            db.refresh(strategy)
            evolved = True

        return {
            "evolved": evolved,
            "strategy_id": strategy_id,
            "strategy_name": strategy.name,
            "old_version": strategy.version - 1 if evolved else strategy.version,
            "new_version": strategy.version,
            "change_type": change_type,
            "change_description": change_description,
            "fitness_before": evolution_record.fitness_before if evolution_record else strategy.fitness_score,
            "fitness_after": strategy.fitness_score,
            "evaluation": evaluation,
            "decay_analysis": decay_result,
            "suggestions": adjustments,
        }

    def get_fitness_metrics(
        self,
        db: Session,
        strategy_id: int,
    ) -> Dict[str, Any]:
        strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
        if not strategy:
            return {"error": "策略不存在"}

        feedbacks = (
            db.query(StrategyFeedback)
            .filter(StrategyFeedback.strategy_id == strategy_id)
            .order_by(StrategyFeedback.id.desc())
            .limit(self.fitness_window)
            .all()
        )

        recent_outcomes = [
            {
                "outcome": f.outcome,
                "false_positive": (f.context or {}).get("false_positive", False),
                "response_delay_minutes": (f.context or {}).get("response_delay_minutes", 0),
                "reward": f.reward,
            }
            for f in feedbacks
        ]

        current_fitness = self.calculate_fitness(strategy, recent_outcomes)
        stored_fitness = strategy.fitness_score

        evaluation = self.evaluate_strategy(strategy, feedbacks)
        decay_result = self.detect_strategy_decay(strategy, recent_outcomes)

        total_feedbacks = len(feedbacks)
        successes = sum(1 for f in feedbacks if f.outcome == "success")
        false_positives = sum(1 for f in feedbacks if (f.context or {}).get("false_positive", False))

        return {
            "strategy_id": strategy.id,
            "strategy_name": strategy.name,
            "current_fitness": current_fitness,
            "stored_fitness": stored_fitness,
            "total_executions": strategy.total_executions,
            "success_count": strategy.success_count,
            "metrics": {
                "recent_total": total_feedbacks,
                "recent_successes": successes,
                "recent_success_rate": round(successes / total_feedbacks, 4) if total_feedbacks > 0 else 0.0,
                "recent_false_positives": false_positives,
                "false_positive_rate": round(false_positives / total_feedbacks, 4) if total_feedbacks > 0 else 0.0,
            },
            "evaluation": evaluation,
            "decay_analysis": decay_result,
        }

    def record_feedback_and_check(
        self,
        db: Session,
        data: Dict[str, Any],
    ) -> Dict[str, Any]:
        strategy_id = data["strategy_id"]
        feedback = StrategyFeedback(**data)
        db.add(feedback)

        strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
        if strategy:
            strategy.total_executions += 1
            if data.get("outcome") == "success":
                strategy.success_count += 1
            if strategy.total_executions > 0:
                strategy.fitness_score = strategy.success_count / strategy.total_executions

        db.commit()
        db.refresh(feedback)

        feedbacks = (
            db.query(StrategyFeedback)
            .filter(StrategyFeedback.strategy_id == strategy_id)
            .order_by(StrategyFeedback.id.desc())
            .limit(self.fitness_window)
            .all()
        )

        recent_outcomes = [
            {
                "outcome": f.outcome,
                "false_positive": (f.context or {}).get("false_positive", False),
                "response_delay_minutes": (f.context or {}).get("response_delay_minutes", 0),
                "reward": f.reward,
            }
            for f in feedbacks
        ]

        evolution_triggered = False
        evolution_result = None

        if len(feedbacks) >= 5:
            decay_result = self.detect_strategy_decay(strategy, recent_outcomes)
            if decay_result.get("is_decaying") and decay_result.get("confidence", 0) > 0.7:
                evolution_triggered = True
                evolution_result = self.trigger_evolution(db, strategy_id)

        return {
            "feedback_id": feedback.id,
            "strategy_id": strategy_id,
            "outcome": feedback.outcome,
            "reward": feedback.reward,
            "fitness_updated": strategy.fitness_score if strategy else None,
            "evolution_triggered": evolution_triggered,
            "evolution_result": evolution_result,
        }


strategy_evolution_engine = StrategyEvolutionEngine()