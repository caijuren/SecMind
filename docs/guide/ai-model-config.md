# AI 模型配置指南

本文档详细介绍 SecMind v3.0 的 AI 模型配置，包括 LLM API Key 设置、多模型路由策略和 Token 用量管理。

## 概述

### 为什么需要配置 AI 模型

SecMind 的告警分析、威胁狩猎、事件响应和报告生成等核心功能均依赖大语言模型（LLM）提供智能分析能力。正确配置 AI 模型是使用 SecMind 的前提条件，直接影响分析质量、响应速度和运营成本。

### 支持的供应商

SecMind v3.0 支持以下 LLM 供应商：

| 供应商 | 接入方式 | 推荐模型 |
|--------|---------|---------|
| OpenAI | OpenAI 兼容 API | gpt-4o / gpt-4o-mini |
| Anthropic | Anthropic API | claude-sonnet-4 / claude-haiku-3.5 |
| DeepSeek | OpenAI 兼容 API | deepseek-chat / deepseek-reasoner |
| 阿里云（通义千问） | OpenAI 兼容 API | qwen-max / qwen-plus |

所有供应商均通过统一的 API 接口管理，可同时配置多个供应商实现故障转移和负载均衡。

## 配置 LLM API Key

### 环境变量配置

在项目根目录的 `.env` 文件中配置 API Key：

```bash
# 通用 LLM 配置（默认供应商）
LLM_API_KEY=sk-your-key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o

# OpenAI（如与通用配置不同）
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# DeepSeek
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

# 阿里云（通义千问）
ALIYUN_API_KEY=sk-...
ALIYUN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
ALIYUN_MODEL=qwen-max
```

### 配置说明表

| 变量 | 必填 | 说明 | 默认值 |
|------|------|------|--------|
| `LLM_API_KEY` | 是 | 通用 API Key | - |
| `LLM_BASE_URL` | 否 | 通用 API 地址 | `https://api.openai.com/v1` |
| `LLM_MODEL` | 否 | 通用默认模型 | `gpt-4o` |
| `OPENAI_API_KEY` | 否 | OpenAI API Key | 复用 `LLM_API_KEY` |
| `OPENAI_BASE_URL` | 否 | OpenAI API 地址 | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | 否 | OpenAI 默认模型 | `gpt-4o` |
| `ANTHROPIC_API_KEY` | 否 | Anthropic API Key | - |
| `ANTHROPIC_BASE_URL` | 否 | Anthropic API 地址 | `https://api.anthropic.com/v1` |
| `ANTHROPIC_MODEL` | 否 | Anthropic 默认模型 | `claude-sonnet-4-20250514` |
| `DEEPSEEK_API_KEY` | 否 | DeepSeek API Key | - |
| `DEEPSEEK_BASE_URL` | 否 | DeepSeek API 地址 | `https://api.deepseek.com/v1` |
| `DEEPSEEK_MODEL` | 否 | DeepSeek 默认模型 | `deepseek-chat` |
| `ALIYUN_API_KEY` | 否 | 阿里云 API Key | - |
| `ALIYUN_BASE_URL` | 否 | 阿里云 API 地址 | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `ALIYUN_MODEL` | 否 | 阿里云默认模型 | `qwen-max` |

> 当未设置供应商专属变量时，系统将自动回退使用通用 `LLM_*` 配置。

### 通过管理界面配置

进入「系统设置 → AI 模型配置」，在可视化界面中添加和管理 API Key：

1. 点击「添加供应商」
2. 选择供应商类型（OpenAI / Anthropic / DeepSeek / 阿里云）
3. 填写 API Key 和自定义 API 地址（可选）
4. 选择默认模型
5. 点击「保存并测试连接」验证配置是否生效

## 多模型路由配置

SecMind v3.0 内置智能路由引擎，可根据任务类型、成本预算和性能要求自动选择最优模型。

### 模型注册

系统预置 5 个模型，覆盖不同场景需求：

| 模型名称 | 供应商 | 能力等级 | 成本 | 质量分 |
|---------|--------|---------|------|-------|
| `gpt-4o` | OpenAI | 高 | 中 | 95 |
| `gpt-4o-mini` | OpenAI | 中 | 低 | 80 |
| `claude-sonnet-4` | Anthropic | 高 | 高 | 97 |
| `deepseek-chat` | DeepSeek | 中 | 极低 | 75 |
| `qwen-max` | 阿里云 | 高 | 低 | 85 |

通过 API 动态管理模型注册：

```bash
# 注册新模型
POST /api/v1/models
{
  "name": "claude-haiku-3.5",
  "provider": "anthropic",
  "capability": "medium",
  "cost_per_1k_tokens": 0.0008,
  "quality_score": 82,
  "latency_ms": 800,
  "enabled": true
}

# 删除模型
DELETE /api/v1/models/claude-haiku-3.5

# 查看所有已注册模型
GET /api/v1/models
```

### 路由策略

系统支持四种路由策略，通过配置文件或 API 设定：

```bash
# .env 配置路由策略
LLM_ROUTING_STRATEGY=balanced  # quality | cost | speed | balanced
```

| 策略 | 说明 | 适用场景 |
|------|------|---------|
| `quality` | 始终选择质量分最高的模型 | 威胁分析、深度研判 |
| `cost` | 选择成本最低的模型 | 批量告警预处理、开发测试 |
| `speed` | 选择延迟最低的模型 | 实时告警分类、自动化响应 |
| `balanced` | 加权评分（质量 50% + 成本 25% + 速度 25%） | 日常运营、默认推荐 |

通过 API 动态切换路由策略：

```bash
POST /api/v1/routing/strategy
{
  "strategy": "balanced",
  "weights": {
    "quality": 0.5,
    "cost": 0.25,
    "speed": 0.25
  }
}
```

### 任务类型映射

系统根据任务类型自动路由到最适合的模型：

```bash
# .env 配置任务映射
TASK_ROUTING_THREAT_ANALYSIS=gpt-4o,claude-sonnet-4
TASK_ROUTING_ALERT_TRIAGE=gpt-4o-mini,qwen-max
TASK_ROUTING_INCIDENT_SUMMARY=gpt-4o-mini
TASK_ROUTING_REPORT_GENERATION=claude-sonnet-4
TASK_ROUTING_CHAT_ASSISTANT=gpt-4o
```

通过 API 自定义任务映射：

```bash
POST /api/v1/routing/tasks
{
  "routes": [
    {
      "task_type": "threat_analysis",
      "models": ["gpt-4o", "claude-sonnet-4"],
      "fallback": "deepseek-chat",
      "temperature": 0.3,
      "max_tokens": 4096
    },
    {
      "task_type": "alert_triage",
      "models": ["gpt-4o-mini", "qwen-max"],
      "fallback": "deepseek-chat",
      "temperature": 0.1,
      "max_tokens": 1024
    },
    {
      "task_type": "incident_summary",
      "models": ["gpt-4o-mini"],
      "fallback": "deepseek-chat",
      "temperature": 0.3,
      "max_tokens": 2048
    },
    {
      "task_type": "report_generation",
      "models": ["claude-sonnet-4"],
      "fallback": "gpt-4o",
      "temperature": 0.5,
      "max_tokens": 8192
    },
    {
      "task_type": "chat_assistant",
      "models": ["gpt-4o"],
      "fallback": "qwen-max",
      "temperature": 0.7,
      "max_tokens": 4096
    }
  ]
}
```

## Token 用量管理

### 配额配置

系统按套餐自动分配 Token 配额，支持通过 API 动态调整：

```bash
# 查看当前套餐配额
GET /api/v1/tokens/quota

# 调整配额（管理员）
POST /api/v1/tokens/quota
{
  "daily_limit": 10000000,
  "monthly_limit": 300000000,
  "per_request_limit": 8192
}
```

配额超限时自动触发降级策略：

| 等级 | 触发条件 | 行为 |
|------|---------|------|
| 警告 | 日配额使用达 80% | 发送通知提醒 |
| 限制 | 日配额使用达 100% | 自动切换到低成本模型 |
| 阻断 | 月配额使用达 100% | 非关键任务暂停，仅保留 threat_analysis |

### 成本控制

通过以下机制有效控制 LLM 调用成本：

```bash
# .env 成本控制配置
COST_DAILY_LIMIT=50.00            # 日消费上限（美元）
COST_BUDGET_MODE=auto             # auto | conservative | unlimited
COST_CACHE_ENABLED=true           # 启用语义缓存
COST_CACHE_TTL=3600               # 缓存有效期（秒）
COST_LOW_BUDGET_FALLBACK=true     # 预算紧张时自动选择低成本模型
```

**语义缓存**：对重复或高度相似的查询命中缓存，减少 API 调用次数。缓存命中率通常在 20%-40%，可显著降低成本和延迟。

**预算模式说明**：

| 模式 | 行为 | 推荐场景 |
|------|------|---------|
| `auto` | 根据剩余预算动态调整模型选择 | 日常运营 |
| `conservative` | 优先选择低成本模型，仅关键任务使用高成本模型 | 成本敏感场景 |
| `unlimited` | 始终选择最优模型，不考虑成本 | 生产环境核心分析 |

## 最佳实践

### 供应商配置

- **至少配置 2 个供应商**用于故障转移（fallback），避免单点故障导致 AI 分析中断
- 推荐组合：OpenAI（主力）+ 阿里云（国内备选）或 Anthropic（主力）+ DeepSeek（低成本备选）
- 定期检查模型健康状态，确保 API Key 未过期、账户余额充足

### 生产环境建议

- 使用 `gpt-4o` 或 `claude-sonnet-4` 作为主力分析模型，确保分析质量
- 配置 `balanced` 路由策略，在质量、成本和速度之间取得平衡
- 启用语义缓存，设置合理的 `COST_DAILY_LIMIT` 防止预算超支
- 为 `alert_triage` 等高频低复杂度任务分配低成本模型

### 开发测试建议

- 使用 `deepseek-chat` 降低成本，其 API 价格约为 gpt-4o 的 1/30
- 将 `COST_BUDGET_MODE` 设为 `conservative`，避免开发过程中的意外费用
- 配置 `qwen-max` 作为国内低延迟备选，适合国内网络环境

### 监控与维护

- 定期查看「系统设置 → AI 模型配置 → 用量统计」了解各模型调用量和消费趋势
- 关注模型供应商的版本更新，及时升级到最新稳定版
- 每月审查路由策略配置，根据实际使用情况调整任务映射和权重分配