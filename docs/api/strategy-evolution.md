# 策略演化 API

策略演化 API 提供安全策略的自动演化能力，基于适应度指标和反馈数据持续优化策略效果，实现安全运营的闭环改进。

## 概述

策略演化系统是 SecMind v3.0 的核心能力之一，通过持续监控策略的执行效果（适应度），并结合分析师反馈，自动调整和优化安全策略。系统采用遗传算法和强化学习相结合的方法，在保证安全覆盖的前提下，不断提升策略的精准度和有效性。

### 演化流程

1. 策略部署后，系统持续收集执行数据并计算适应度指标
2. 分析师可通过反馈接口提交对策略结果的评价
3. 当适应度低于阈值或收到负面反馈时，系统触发演化
4. 演化产生新的策略变体，经过评估后替换原有策略

## 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/strategy/evolution/evolve/{strategy_id}` | 触发策略演化 |
| GET | `/api/v1/strategy/evolution/fitness/{strategy_id}` | 获取适应度指标 |
| POST | `/api/v1/strategy/evolution/feedback` | 提交反馈并触发演化检查 |

## 触发策略演化

```bash
POST /api/v1/strategy/evolution/evolve/{strategy_id}
```

手动触发指定策略的演化流程。系统将基于当前适应度指标和历史反馈数据，生成新的策略变体。

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `strategy_id` | string | 是 | 策略 ID |

### 请求体

```json
{
  "evolution_mode": "auto",
  "constraints": {
    "max_mutation_rate": 0.3,
    "preserve_rules": ["rule_001", "rule_003"],
    "risk_tolerance": "medium"
  },
  "objectives": {
    "optimize_for": "precision",
    "min_fitness_threshold": 0.6
  }
}
```

### 请求参数字段

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `evolution_mode` | string | 否 | `auto` | 演化模式：`auto` 自动模式、`manual` 手动引导模式、`explore` 探索模式 |
| `constraints.max_mutation_rate` | number | 否 | `0.2` | 最大变异率，范围 0.0 ~ 0.5 |
| `constraints.preserve_rules` | array[string] | 否 | `[]` | 需要保留的规则 ID 列表 |
| `constraints.risk_tolerance` | string | 否 | `medium` | 风险容忍度：`low`、`medium`、`high` |
| `objectives.optimize_for` | string | 否 | `balanced` | 优化目标：`precision` 精确率、`recall` 召回率、`balanced` 均衡、`efficiency` 效率 |
| `objectives.min_fitness_threshold` | number | 否 | `0.5` | 最小适应度阈值，低于此值强制演化 |

### 响应示例

```json
{
  "data": {
    "evolution_id": "evo_20240516_001",
    "strategy_id": "strategy_alert_015",
    "status": "completed",
    "mode": "auto",
    "parent_fitness": {
      "overall": 0.42,
      "precision": 0.38,
      "recall": 0.55,
      "f1_score": 0.45
    },
    "variants_generated": 5,
    "selected_variant": {
      "id": "var_003",
      "fitness_score": 0.71,
      "improvement": "+0.29",
      "changes": [
        {
          "type": "threshold_adjustment",
          "rule_id": "rule_007",
          "from": 0.75,
          "to": 0.82,
          "reason": "降低误报率"
        },
        {
          "type": "rule_added",
          "rule_id": "rule_012",
          "description": "新增关联分析规则：跨源登录异常检测"
        },
        {
          "type": "weight_update",
          "rule_id": "rule_004",
          "from": 0.6,
          "to": 0.4,
          "reason": "历史反馈显示该规则权重过高"
        }
      ]
    },
    "evaluation_metrics": {
      "false_positive_reduction": 0.23,
      "detection_latency_ms": 1250,
      "coverage_increase": 0.08
    },
    "completed_at": "2024-05-16T10:30:00Z",
    "estimated_deployment": "2024-05-16T12:00:00Z"
  },
  "meta": {
    "request_id": "req_evo_abc123",
    "timestamp": "2024-05-16T10:30:00Z"
  }
}
```

## 获取适应度指标

```bash
GET /api/v1/strategy/evolution/fitness/{strategy_id}
```

获取指定策略的当前适应度指标，包括综合评分及各维度细分指标。

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `strategy_id` | string | 是 | 策略 ID |

### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `time_range` | string | 否 | `7d` | 时间范围：`24h`、`7d`、`30d`、`90d` |
| `include_history` | boolean | 否 | `false` | 是否返回历史趋势数据 |

### 响应示例

```json
{
  "data": {
    "strategy_id": "strategy_alert_015",
    "strategy_name": "异常登录检测策略 v3",
    "fitness": {
      "overall": 0.42,
      "precision": 0.38,
      "recall": 0.55,
      "f1_score": 0.45,
      "efficiency": 0.72,
      "stability": 0.68
    },
    "status": "degraded",
    "thresholds": {
      "excellent": 0.85,
      "good": 0.70,
      "fair": 0.55,
      "degraded": 0.40,
      "poor": 0.0
    },
    "execution_stats": {
      "total_executions": 15230,
      "true_positives": 312,
      "false_positives": 509,
      "true_negatives": 14108,
      "false_negatives": 301,
      "avg_response_time_ms": 234
    },
    "trend": {
      "direction": "declining",
      "change_rate": -0.05,
      "period": "7d"
    },
    "history": [
      {
        "date": "2024-05-09",
        "overall": 0.55,
        "precision": 0.52,
        "recall": 0.61
      },
      {
        "date": "2024-05-10",
        "overall": 0.53,
        "precision": 0.49,
        "recall": 0.60
      },
      {
        "date": "2024-05-11",
        "overall": 0.50,
        "precision": 0.45,
        "recall": 0.58
      },
      {
        "date": "2024-05-12",
        "overall": 0.48,
        "precision": 0.42,
        "recall": 0.57
      },
      {
        "date": "2024-05-13",
        "overall": 0.46,
        "precision": 0.40,
        "recall": 0.56
      },
      {
        "date": "2024-05-14",
        "overall": 0.44,
        "precision": 0.39,
        "recall": 0.55
      },
      {
        "date": "2024-05-15",
        "overall": 0.42,
        "precision": 0.38,
        "recall": 0.55
      }
    ],
    "last_evolution": {
      "evolution_id": "evo_20240509_001",
      "triggered_at": "2024-05-09T08:00:00Z",
      "improvement": "+0.12"
    },
    "evaluated_at": "2024-05-16T10:00:00Z"
  },
  "meta": {
    "request_id": "req_fit_def456",
    "timestamp": "2024-05-16T10:00:00Z"
  }
}
```

## 提交反馈并触发演化检查

```bash
POST /api/v1/strategy/evolution/feedback
```

提交对策略执行结果的反馈。系统会根据反馈内容更新策略的适应度评分，并在评分低于阈值时自动触发演化流程。

### 请求体

```json
{
  "strategy_id": "strategy_alert_015",
  "alert_id": "alt_20240516_1024",
  "feedback_type": "false_positive",
  "severity": "medium",
  "description": "该告警为正常业务操作，非恶意行为",
  "analyst_id": "usr_007",
  "tags": ["业务误报", "白名单"],
  "suggested_action": "将源 IP 加入白名单并降低规则敏感度"
}
```

### 请求参数字段

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `strategy_id` | string | 是 | 策略 ID |
| `alert_id` | string | 是 | 关联告警 ID |
| `feedback_type` | string | 是 | 反馈类型：`true_positive` 正确告警、`false_positive` 误报、`false_negative` 漏报、`noise` 噪音、`actionable` 可处置 |
| `severity` | string | 否 | 严重程度：`low`、`medium`、`high`、`critical` |
| `description` | string | 是 | 反馈描述 |
| `analyst_id` | string | 是 | 分析师 ID |
| `tags` | array[string] | 否 | 自定义标签列表 |
| `suggested_action` | string | 否 | 建议的处置或优化措施 |

### 响应示例

```json
{
  "data": {
    "feedback_id": "fb_20240516_001",
    "strategy_id": "strategy_alert_015",
    "alert_id": "alt_20240516_1024",
    "feedback_type": "false_positive",
    "status": "processed",
    "fitness_impact": {
      "previous_overall": 0.44,
      "new_overall": 0.42,
      "delta": -0.02,
      "affected_dimensions": ["precision"]
    },
    "evolution_triggered": true,
    "evolution": {
      "evolution_id": "evo_20240516_001",
      "status": "pending",
      "estimated_start": "2024-05-16T10:05:00Z",
      "reason": "适应度评分低于阈值 (0.42 < 0.45)"
    },
    "created_at": "2024-05-16T10:01:00Z"
  },
  "meta": {
    "request_id": "req_fb_ghi789",
    "timestamp": "2024-05-16T10:01:00Z"
  }
}
```

## 适应度评分解读

适应度评分是衡量策略效果的核心指标，范围 0.0 ~ 1.0。

### 评分等级

| 等级 | 评分范围 | 说明 | 建议措施 |
|------|----------|------|----------|
| Excellent | 0.85 ~ 1.0 | 策略表现优异，误报率和漏报率极低 | 维持现状，定期监控 |
| Good | 0.70 ~ 0.85 | 策略效果良好，偶有误报 | 可考虑微调优化 |
| Fair | 0.55 ~ 0.70 | 策略效果一般，存在一定误报或漏报 | 建议安排定期评审 |
| Degraded | 0.40 ~ 0.55 | 策略效果下降，需要关注 | 触发演化检查，准备优化 |
| Poor | 0.0 ~ 0.40 | 策略效果差，急需优化 | 立即触发演化或手动调整 |

### 维度说明

| 维度 | 说明 | 计算方式 |
|------|------|----------|
| `overall` | 综合适应度评分 | 各维度加权平均 |
| `precision` | 精确率 | TP / (TP + FP) |
| `recall` | 召回率 | TP / (TP + FN) |
| `f1_score` | F1 值 | 2 * (precision * recall) / (precision + recall) |
| `efficiency` | 执行效率 | 基于响应时间和资源消耗的归一化评分 |
| `stability` | 稳定性 | 评分在时间窗口内的方差倒数 |

## 反馈类型说明

| 反馈类型 | 含义 | 对适应度的影响 |
|----------|------|---------------|
| `true_positive` | 正确告警，确认有效 | 正向提升 precision 和 recall |
| `false_positive` | 误报，非真实威胁 | 降低 precision |
| `false_negative` | 漏报，未检测到的威胁 | 降低 recall |
| `noise` | 噪音，低价值告警 | 轻微降低 precision |
| `actionable` | 可处置，具有明确响应价值 | 正向提升 overall |

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `RESOURCE_NOT_FOUND` | 404 | 策略不存在 |
| `VALIDATION_ERROR` | 400 | 参数验证失败 |
| `PERMISSION_DENIED` | 403 | 无权操作该策略 |
| `EVOLUTION_IN_PROGRESS` | 409 | 该策略正在演化中，请稍后重试 |
| `FITNESS_DATA_INSUFFICIENT` | 422 | 适应度数据不足，无法触发演化 |
| `EVOLUTION_FAILED` | 500 | 策略演化执行失败 |
| `FEEDBACK_ALREADY_EXISTS` | 409 | 该告警的反馈已存在 |
| `STRATEGY_LOCKED` | 423 | 策略已被锁定，无法演化 |