import copy
import random
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.strategy import Strategy, StrategyEvolution, StrategyFeedback

SEED_STRATEGIES = [
    {
        "name": "account_compromise_response",
        "strategy_type": "incident_response",
        "description": "账号失陷自动响应策略：基于置信度自动执行冻结→重置→隔离",
        "rules": [
            {"condition": "confidence >= 0.85", "action": "freeze_account", "priority": 1},
            {"condition": "confidence >= 0.85", "action": "reset_credentials", "priority": 2},
            {"condition": "confidence >= 0.90", "action": "isolate_device", "priority": 3},
            {"condition": "confidence < 0.85", "action": "notify_team", "priority": 1},
            {"condition": "confidence < 0.85", "action": "enhance_monitoring", "priority": 2},
        ],
        "conditions": [{"field": "attack_type", "operator": "in", "value": ["credential_theft", "account_takeover"]}],
        "actions": ["freeze_account", "reset_credentials", "isolate_device", "notify_team", "enhance_monitoring"],
        "confidence_threshold": 0.85,
        "priority": 1,
    },
    {
        "name": "c2_communication_response",
        "strategy_type": "incident_response",
        "description": "C2通信检测响应策略：高置信度自动封禁IP和隔离设备",
        "rules": [
            {"condition": "confidence >= 0.90", "action": "block_ip", "priority": 1},
            {"condition": "confidence >= 0.90", "action": "isolate_device", "priority": 2},
            {"condition": "confidence >= 0.90", "action": "notify_team", "priority": 3},
            {"condition": "confidence < 0.90", "action": "enhance_monitoring", "priority": 1},
            {"condition": "confidence < 0.90", "action": "preserve_forensics", "priority": 2},
        ],
        "conditions": [{"field": "attack_type", "operator": "in", "value": ["c2_communication", "dns_tunnel"]}],
        "actions": ["block_ip", "isolate_device", "notify_team", "enhance_monitoring", "preserve_forensics"],
        "confidence_threshold": 0.90,
        "priority": 2,
    },
    {
        "name": "brute_force_response",
        "strategy_type": "incident_response",
        "description": "暴力破解响应策略：基于失败次数阈值自动封禁IP",
        "rules": [
            {"condition": "failed_attempts >= 50", "action": "block_ip", "priority": 1},
            {"condition": "failed_attempts >= 50", "action": "lock_account", "priority": 2},
            {"condition": "failed_attempts >= 100", "action": "enable_mfa", "priority": 3},
            {"condition": "failed_attempts < 50", "action": "enhance_monitoring", "priority": 1},
        ],
        "conditions": [{"field": "attack_type", "operator": "in", "value": ["brute_force", "password_spray"]}],
        "actions": ["block_ip", "lock_account", "enable_mfa", "enhance_monitoring"],
        "confidence_threshold": 0.80,
        "priority": 3,
    },
    {
        "name": "data_exfiltration_response",
        "strategy_type": "incident_response",
        "description": "数据外泄响应策略：基于外传数据量阈值自动阻断",
        "rules": [
            {"condition": "data_volume_mb >= 100", "action": "block_traffic", "priority": 1},
            {"condition": "data_volume_mb >= 100", "action": "preserve_forensics", "priority": 2},
            {"condition": "data_volume_mb >= 100", "action": "notify_team", "priority": 3},
            {"condition": "data_volume_mb < 100", "action": "enhance_monitoring", "priority": 1},
        ],
        "conditions": [{"field": "attack_type", "operator": "in", "value": ["data_exfiltration", "data_leak"]}],
        "actions": ["block_traffic", "preserve_forensics", "notify_team", "enhance_monitoring"],
        "confidence_threshold": 0.85,
        "priority": 4,
    },
]


def seed_strategies(db: Session) -> int:
    count = 0
    for s_data in SEED_STRATEGIES:
        existing = db.query(Strategy).filter(Strategy.name == s_data["name"]).first()
        if not existing:
            strategy = Strategy(**s_data)
            db.add(strategy)
            count += 1
    db.commit()
    return count


def get_strategies(db: Session, strategy_type: Optional[str] = None, active_only: bool = False) -> List[Strategy]:
    query = db.query(Strategy)
    if strategy_type:
        query = query.filter(Strategy.strategy_type == strategy_type)
    if active_only:
        query = query.filter(Strategy.is_active == True)
    return query.order_by(Strategy.priority).all()


def get_strategy(db: Session, strategy_id: int) -> Optional[Strategy]:
    return db.query(Strategy).filter(Strategy.id == strategy_id).first()


def create_strategy(db: Session, data: dict) -> Strategy:
    strategy = Strategy(**data)
    db.add(strategy)
    db.commit()
    db.refresh(strategy)
    return strategy


def update_strategy(db: Session, strategy_id: int, data: dict) -> Optional[Strategy]:
    strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
    if not strategy:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(strategy, key, value)
    db.commit()
    db.refresh(strategy)
    return strategy


def submit_feedback(db: Session, data: dict) -> StrategyFeedback:
    feedback = StrategyFeedback(**data)
    db.add(feedback)

    strategy = db.query(Strategy).filter(Strategy.id == data["strategy_id"]).first()
    if strategy:
        strategy.total_executions += 1
        if data.get("outcome") == "success":
            strategy.success_count += 1
        if strategy.total_executions > 0:
            strategy.fitness_score = strategy.success_count / strategy.total_executions

    db.commit()
    db.refresh(feedback)
    return feedback


def evolve_strategy(db: Session, strategy_id: int, feedback_window: int = 50) -> Dict[str, Any]:
    strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
    if not strategy:
        return {"evolved": False, "error": "策略不存在"}

    old_version = strategy.version
    old_fitness = strategy.fitness_score
    old_rules = copy.deepcopy(strategy.rules)

    feedbacks = db.query(StrategyFeedback).filter(
        StrategyFeedback.strategy_id == strategy_id
    ).order_by(StrategyFeedback.id.desc()).limit(feedback_window).all()

    if len(feedbacks) < 5:
        return {
            "evolved": False,
            "strategy_id": strategy_id,
            "old_version": old_version,
            "new_version": old_version,
            "fitness_before": old_fitness,
            "fitness_after": old_fitness,
        }

    success_rate = sum(1 for f in feedbacks if f.outcome == "success") / len(feedbacks)
    avg_reward = sum(f.reward for f in feedbacks) / len(feedbacks) if feedbacks else 0

    change_type = None
    change_description = None
    new_rules = copy.deepcopy(strategy.rules)

    if success_rate < 0.6:
        change_type = "threshold_lowering"
        change_description = f"成功率仅{success_rate:.0%}，降低置信度阈值以扩大自动处置范围"
        strategy.confidence_threshold = max(0.5, strategy.confidence_threshold - 0.05)
        for rule in new_rules:
            if "confidence >=" in rule.get("condition", ""):
                rule["condition"] = rule["condition"].replace(
                    f"confidence >= {strategy.confidence_threshold + 0.05:.2f}",
                    f"confidence >= {strategy.confidence_threshold:.2f}",
                )
    elif success_rate > 0.9 and avg_reward > 0.5:
        change_type = "threshold_raising"
        change_description = f"成功率{success_rate:.0%}，提高置信度阈值以减少误判"
        strategy.confidence_threshold = min(0.98, strategy.confidence_threshold + 0.03)
        for rule in new_rules:
            if "confidence >=" in rule.get("condition", ""):
                rule["condition"] = rule["condition"].replace(
                    f"confidence >= {strategy.confidence_threshold - 0.03:.2f}",
                    f"confidence >= {strategy.confidence_threshold:.2f}",
                )
    elif avg_reward < -0.3:
        change_type = "rule_adjustment"
        change_description = f"平均奖励{avg_reward:.2f}偏低，调整规则优先级"
        for rule in new_rules:
            if rule.get("priority", 0) > 1:
                rule["priority"] = rule["priority"] - 1
    else:
        change_type = "minor_tuning"
        change_description = f"成功率{success_rate:.0%}，微调策略参数"
        strategy.priority = max(0, strategy.priority + random.choice([-1, 0, 0, 1]))

    strategy.version += 1
    strategy.rules = new_rules

    evolution = StrategyEvolution(
        strategy_id=strategy_id,
        old_version=old_version,
        new_version=strategy.version,
        change_type=change_type,
        change_description=change_description,
        old_rules=old_rules,
        new_rules=new_rules,
        trigger_reason=f"success_rate={success_rate:.2f}, avg_reward={avg_reward:.2f}",
        fitness_before=old_fitness,
        fitness_after=strategy.fitness_score,
    )
    db.add(evolution)
    db.commit()
    db.refresh(strategy)

    return {
        "evolved": True,
        "strategy_id": strategy_id,
        "old_version": old_version,
        "new_version": strategy.version,
        "change_type": change_type,
        "change_description": change_description,
        "fitness_before": old_fitness,
        "fitness_after": strategy.fitness_score,
    }


def get_evolutions(db: Session, strategy_id: Optional[int] = None, limit: int = 50) -> List[StrategyEvolution]:
    query = db.query(StrategyEvolution)
    if strategy_id:
        query = query.filter(StrategyEvolution.strategy_id == strategy_id)
    return query.order_by(StrategyEvolution.id.desc()).limit(limit).all()


def get_feedbacks(db: Session, strategy_id: Optional[int] = None, limit: int = 50) -> List[StrategyFeedback]:
    query = db.query(StrategyFeedback)
    if strategy_id:
        query = query.filter(StrategyFeedback.strategy_id == strategy_id)
    return query.order_by(StrategyFeedback.id.desc()).limit(limit).all()
