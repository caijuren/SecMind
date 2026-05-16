# AI 模型路由 API

SecMind v3.0 引入**双轨制 AI 模型路由系统**，提供两套互补的模型管理与路由机制：

| 路由系统 | 前缀 | 存储方式 | 适用场景 |
|----------|------|----------|----------|
| **内存路由** | `/api/v1/ai/models` | 内存字典 | 轻量级、无状态、快速路由决策 |
| **数据库路由** | `/api/v1/ai-models` | 数据库持久化 | 生产环境、模型全生命周期管理 |

**核心能力：**
- 根据任务类型智能选择最优 LLM 模型
- 支持四种路由策略：质量优先、成本优先、速度优先、均衡模式
- 自动故障转移（fallback），主模型不可用时自动切换备用模型
- 调用统计与成本追踪
- 模型健康状态监控

---

## 模型能力矩阵

| 模型 | 提供商 | 能力标签 | 质量评分 | 延迟(ms) | 成本($/1K tokens) | 最大上下文 |
|------|--------|----------|----------|----------|-------------------|-----------|
| GPT-4o | OpenAI | reasoning, analysis, writing | 0.95 | 2000 | 0.030 | 128K |
| GPT-4o-mini | OpenAI | classification, extraction, summarization | 0.85 | 800 | 0.005 | 128K |
| Claude Sonnet 4 | Anthropic | reasoning, analysis, writing, coding | 0.93 | 1500 | 0.015 | 200K |
| DeepSeek Chat | DeepSeek | reasoning, analysis, coding | 0.88 | 1200 | 0.002 | 64K |
| Qwen-Max | Alibaba Cloud | reasoning, analysis, chinese | 0.87 | 1000 | 0.008 | 32K |

## 任务类型

| 任务类型 | 说明 | 首选模型 | 备选模型 |
|----------|------|----------|----------|
| `threat_analysis` | 威胁分析与攻击链推理 | GPT-4o | Claude Sonnet, DeepSeek |
| `alert_triage` | 告警研判与分类 | GPT-4o-mini | Qwen-Max, DeepSeek |
| `incident_summary` | 安全事件总结 | GPT-4o-mini | Qwen-Max |
| `playbook_generation` | 处置预案生成 | GPT-4o | Claude Sonnet |
| `ioc_enrichment` | IOC 情报富化 | GPT-4o-mini | DeepSeek |
| `report_generation` | 安全报告生成 | GPT-4o | Claude Sonnet, Qwen-Max |
| `code_analysis` | 代码安全分析 | DeepSeek | Claude Sonnet |

## 路由策略

| 策略 | 优先级参数 | 说明 | 选择逻辑 |
|------|-----------|------|----------|
| **质量优先** | `quality` | 优先选择质量评分最高的模型 | `max(quality_score)` |
| **成本优先** | `cost` | 优先选择成本最低的模型 | `min(cost_per_1k_tokens)` |
| **速度优先** | `speed` | 优先选择延迟最低的模型 | `min(latency_ms)` |
| **均衡模式** | `balanced` | 综合质量、成本、速度加权评分 | `0.5×Q + 0.25×C + 0.25×S` |

---

## 内存路由 API

前缀：`/api/v1/ai/models`

### 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/ai/models/available` | 获取所有可用模型及状态 |
| GET | `/api/v1/ai/models/stats` | 获取调用统计 |
| POST | `/api/v1/ai/models/route` | 路由请求到最优模型并调用 |
| POST | `/api/v1/ai/models/select` | 仅选择模型，不发起调用 |

---

### 获取可用模型

```bash
GET /api/v1/ai/models/available
```

返回所有注册模型及其当前可用状态（基于 API Key 配置情况）。

#### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/ai/models/available" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": [
    {
      "name": "gpt-4o",
      "provider": "openai",
      "capabilities": ["reasoning", "analysis", "writing"],
      "cost_per_1k_tokens": 0.03,
      "max_tokens": 128000,
      "latency_ms": 2000,
      "quality_score": 0.95,
      "available": true
    },
    {
      "name": "claude-sonnet-4-20250514",
      "provider": "anthropic",
      "capabilities": ["reasoning", "analysis", "writing", "coding"],
      "cost_per_1k_tokens": 0.015,
      "max_tokens": 200000,
      "latency_ms": 1500,
      "quality_score": 0.93,
      "available": true
    },
    {
      "name": "deepseek-chat",
      "provider": "deepseek",
      "capabilities": ["reasoning", "analysis", "coding"],
      "cost_per_1k_tokens": 0.002,
      "max_tokens": 64000,
      "latency_ms": 1200,
      "quality_score": 0.88,
      "available": false
    }
  ]
}
```

---

### 获取调用统计

```bash
GET /api/v1/ai/models/stats
```

返回内存路由器的调用统计，包括各模型的调用次数、成功率、延迟和成本。

#### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/ai/models/stats" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": {
    "models": {
      "gpt-4o": {
        "calls": 156,
        "successes": 152,
        "failures": 4,
        "success_rate": 0.9744,
        "avg_latency_ms": 2150.5,
        "total_cost": 12.45,
        "total_input_tokens": 285000,
        "total_output_tokens": 130000
      },
      "gpt-4o-mini": {
        "calls": 423,
        "successes": 420,
        "failures": 3,
        "success_rate": 0.9929,
        "avg_latency_ms": 780.3,
        "total_cost": 3.21,
        "total_input_tokens": 420000,
        "total_output_tokens": 220000
      }
    },
    "summary": {
      "total_calls": 579,
      "total_successes": 572,
      "total_failures": 7,
      "overall_success_rate": 0.9879,
      "total_cost": 15.66,
      "avg_latency_ms": 1250.4
    }
  }
}
```

---

### 路由请求

```bash
POST /api/v1/ai/models/route
```

根据任务类型和优先级策略选择最优模型，并直接发起 LLM 调用。主模型失败时自动 fallback 到候选模型。

#### 请求体

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `task_type` | string | 是 | - | 任务类型，见任务类型表 |
| `prompt` | string | 是 | - | 提示词内容 |
| `priority` | string | 否 | `balanced` | 路由策略：quality / cost / speed / balanced |
| `temperature` | float | 否 | 0.7 | 模型温度参数 |
| `max_tokens` | integer | 否 | 4096 | 最大输出 Token 数 |

#### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/ai/models/route" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "threat_analysis",
    "prompt": "分析以下告警：检测到主机 192.168.1.105 与已知 C2 服务器 45.33.32.156 通信",
    "priority": "quality",
    "temperature": 0.3,
    "max_tokens": 4096
  }'
```

#### 响应示例

```json
{
  "data": {
    "model": "gpt-4o",
    "provider": "openai",
    "content": "## 威胁分析报告\n\n### 告警概述\n检测到内网主机 192.168.1.105 与外部 IP 45.33.32.156 建立持续通信，该外部 IP 已被多个威胁情报源标记为 C2 服务器。\n\n### 风险等级\n**高危** - 置信度 92%\n\n### 关联分析\n- 目标 IP 45.33.32.156 关联到 APT29 组织基础设施\n- 通信协议为 HTTPS，使用伪造的 TLS 证书\n- 通信频率为每 5 分钟一次心跳，符合 C2 行为特征\n\n### 处置建议\n1. 立即隔离主机 192.168.1.105\n2. 在防火墙封禁 45.33.32.156\n3. 排查横向移动痕迹",
    "input_tokens": 85,
    "output_tokens": 312,
    "latency_ms": 2150,
    "cost": 0.01191,
    "priority": "quality",
    "fallback_used": false,
    "error": null
  }
}
```

#### 失败响应（所有模型不可用）

```json
{
  "data": {
    "model": null,
    "provider": null,
    "content": "所有模型调用失败: Connection timeout",
    "input_tokens": 0,
    "output_tokens": 0,
    "latency_ms": 0,
    "cost": 0.0,
    "priority": "quality",
    "fallback_used": false,
    "error": "Connection timeout"
  }
}
```

---

### 选择模型

```bash
POST /api/v1/ai/models/select
```

仅根据任务类型和优先级策略选择最优模型，不发起 LLM 调用。适用于前端预览或预检查场景。

#### 请求体

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `task_type` | string | 是 | - | 任务类型 |
| `priority` | string | 否 | `balanced` | 路由策略 |

#### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/ai/models/select" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "alert_triage",
    "priority": "cost"
  }'
```

#### 响应示例

```json
{
  "data": {
    "model": "gpt-4o-mini",
    "provider": "openai",
    "priority": "cost",
    "task_type": "alert_triage",
    "candidates": ["gpt-4o-mini", "qwen-max", "deepseek-chat"]
  }
}
```

---

## 数据库路由 API

前缀：`/api/v1/ai-models`

### 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/ai-models/seed` | 种子数据初始化 |
| GET | `/api/v1/ai-models` | 获取模型列表 |
| GET | `/api/v1/ai-models/{id}` | 获取模型详情 |
| POST | `/api/v1/ai-models` | 创建模型 |
| PUT | `/api/v1/ai-models/{id}` | 更新模型 |
| GET | `/api/v1/ai-models/routings` | 获取路由配置 |
| POST | `/api/v1/ai-models/routings` | 创建路由配置 |
| POST | `/api/v1/ai-models/route` | 路由调用 |
| GET | `/api/v1/ai-models/stats` | 获取统计 |
| GET | `/api/v1/ai-models/logs` | 获取调用日志 |

---

### 种子数据初始化

```bash
POST /api/v1/ai-models/seed
```

初始化系统预设的 AI 模型和路由配置。仅在首次部署或数据重置后调用，已存在的记录不会重复插入。

**种子模型：**

| 模型 | 提供商 | 质量评分 | 优先级 |
|------|--------|----------|--------|
| GPT-4o | OpenAI | 0.95 | 1 |
| Claude 3.5 Sonnet | Anthropic | 0.93 | 2 |
| Qwen-Max | Alibaba | 0.90 | 3 |
| DeepSeek V3 | DeepSeek | 0.88 | 4 |
| GLM-4 | Zhipu | 0.87 | 5 |

**种子路由：**

| 任务类型 | 主模型 ID | 策略 | 备用模型 ID |
|----------|----------|------|------------|
| threat_analysis | 1 | accuracy | 2 |
| alert_triage | 2 | balanced | 3 |
| report_generation | 3 | cost | 4 |
| code_analysis | 1 | accuracy | 2 |
| incident_response | 2 | latency | 4 |
| threat_hunting | 1 | accuracy | 2 |
| general_chat | 4 | cost | 5 |

#### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/ai-models/seed" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": {
    "seeded": 12
  }
}
```

---

### 获取模型列表

```bash
GET /api/v1/ai-models
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `active_only` | boolean | 否 | 仅返回活跃模型（默认 false） |

#### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/ai-models?active_only=true" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": [
    {
      "id": 1,
      "name": "gpt-4o",
      "provider": "openai",
      "model_id": "gpt-4o",
      "description": "OpenAI GPT-4o 多模态模型，适合复杂推理和分析",
      "capabilities": ["reasoning", "analysis", "code", "multimodal"],
      "max_tokens": 128000,
      "cost_per_1k_input": 0.005,
      "cost_per_1k_output": 0.015,
      "latency_ms": 1200,
      "accuracy_score": 0.95,
      "is_active": true,
      "priority": 1,
      "config": null,
      "created_at": "2024-01-15T08:00:00Z"
    },
    {
      "id": 2,
      "name": "claude-3.5-sonnet",
      "provider": "anthropic",
      "model_id": "claude-3-5-sonnet-20241022",
      "description": "Anthropic Claude 3.5 Sonnet，平衡性能与成本",
      "capabilities": ["reasoning", "analysis", "code", "long_context"],
      "max_tokens": 200000,
      "cost_per_1k_input": 0.003,
      "cost_per_1k_output": 0.015,
      "latency_ms": 900,
      "accuracy_score": 0.93,
      "is_active": true,
      "priority": 2,
      "config": null,
      "created_at": "2024-01-15T08:00:00Z"
    }
  ]
}
```

---

### 获取模型详情

```bash
GET /api/v1/ai-models/{model_id}
```

#### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/ai-models/1" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": {
    "id": 1,
    "name": "gpt-4o",
    "provider": "openai",
    "model_id": "gpt-4o",
    "description": "OpenAI GPT-4o 多模态模型，适合复杂推理和分析",
    "capabilities": ["reasoning", "analysis", "code", "multimodal"],
    "max_tokens": 128000,
    "cost_per_1k_input": 0.005,
    "cost_per_1k_output": 0.015,
    "latency_ms": 1200,
    "accuracy_score": 0.95,
    "is_active": true,
    "priority": 1,
    "config": null,
    "created_at": "2024-01-15T08:00:00Z"
  }
}
```

---

### 创建模型

```bash
POST /api/v1/ai-models
```

#### 请求体

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `name` | string | 是 | - | 模型名称（唯一） |
| `provider` | string | 是 | - | 提供商标识 |
| `model_id` | string | 是 | - | 提供商侧的模型 ID |
| `description` | string | 否 | null | 模型描述 |
| `capabilities` | array | 否 | null | 能力标签列表 |
| `max_tokens` | integer | 否 | 4096 | 最大上下文 Token 数 |
| `cost_per_1k_input` | float | 否 | 0.0 | 每 1K 输入 Token 成本 |
| `cost_per_1k_output` | float | 否 | 0.0 | 每 1K 输出 Token 成本 |
| `latency_ms` | integer | 否 | 0 | 平均延迟（毫秒） |
| `accuracy_score` | float | 否 | 0.0 | 准确率评分 |
| `is_active` | boolean | 否 | true | 是否启用 |
| `priority` | integer | 否 | 0 | 优先级（越小越优先） |
| `config` | object | 否 | null | 扩展配置 |

#### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/ai-models" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "qwen-max",
    "provider": "alibaba",
    "model_id": "qwen-max",
    "description": "通义千问Max，中文安全分析优化",
    "capabilities": ["reasoning", "analysis", "chinese_optimized"],
    "max_tokens": 32000,
    "cost_per_1k_input": 0.002,
    "cost_per_1k_output": 0.006,
    "latency_ms": 600,
    "accuracy_score": 0.90,
    "is_active": true,
    "priority": 3
  }'
```

#### 响应示例

```json
{
  "data": {
    "id": 6,
    "name": "qwen-max",
    "provider": "alibaba",
    "model_id": "qwen-max",
    "description": "通义千问Max，中文安全分析优化",
    "capabilities": ["reasoning", "analysis", "chinese_optimized"],
    "max_tokens": 32000,
    "cost_per_1k_input": 0.002,
    "cost_per_1k_output": 0.006,
    "latency_ms": 600,
    "accuracy_score": 0.90,
    "is_active": true,
    "priority": 3,
    "config": null,
    "created_at": "2024-01-15T09:00:00Z"
  }
}
```

---

### 更新模型

```bash
PUT /api/v1/ai-models/{model_id}
```

#### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `provider` | string | 否 | 提供商标识 |
| `model_id` | string | 否 | 提供商侧的模型 ID |
| `description` | string | 否 | 模型描述 |
| `capabilities` | array | 否 | 能力标签列表 |
| `max_tokens` | integer | 否 | 最大上下文 Token 数 |
| `cost_per_1k_input` | float | 否 | 每 1K 输入 Token 成本 |
| `cost_per_1k_output` | float | 否 | 每 1K 输出 Token 成本 |
| `latency_ms` | integer | 否 | 平均延迟 |
| `accuracy_score` | float | 否 | 准确率评分 |
| `is_active` | boolean | 否 | 是否启用 |
| `priority` | integer | 否 | 优先级 |
| `config` | object | 否 | 扩展配置 |

#### 请求示例

```bash
curl -X PUT "https://api.secmind.example.com/api/v1/ai-models/6" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accuracy_score": 0.92,
    "latency_ms": 550,
    "is_active": true
  }'
```

#### 响应示例

```json
{
  "data": {
    "id": 6,
    "name": "qwen-max",
    "provider": "alibaba",
    "model_id": "qwen-max",
    "description": "通义千问Max，中文安全分析优化",
    "capabilities": ["reasoning", "analysis", "chinese_optimized"],
    "max_tokens": 32000,
    "cost_per_1k_input": 0.002,
    "cost_per_1k_output": 0.006,
    "latency_ms": 550,
    "accuracy_score": 0.92,
    "is_active": true,
    "priority": 3,
    "config": null,
    "created_at": "2024-01-15T09:00:00Z"
  }
}
```

---

### 获取路由配置

```bash
GET /api/v1/ai-models/routings
```

返回所有任务类型的路由配置，包括主模型、备用模型和路由策略。

#### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/ai-models/routings" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": [
    {
      "id": 1,
      "task_type": "threat_analysis",
      "model_id": 1,
      "routing_strategy": "accuracy",
      "fallback_model_id": 2,
      "config": null,
      "created_at": "2024-01-15T08:00:00Z"
    },
    {
      "id": 2,
      "task_type": "alert_triage",
      "model_id": 2,
      "routing_strategy": "balanced",
      "fallback_model_id": 3,
      "config": null,
      "created_at": "2024-01-15T08:00:00Z"
    },
    {
      "id": 3,
      "task_type": "report_generation",
      "model_id": 3,
      "routing_strategy": "cost",
      "fallback_model_id": 4,
      "config": null,
      "created_at": "2024-01-15T08:00:00Z"
    }
  ]
}
```

---

### 创建路由配置

```bash
POST /api/v1/ai-models/routings
```

#### 请求体

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `task_type` | string | 是 | - | 任务类型（唯一） |
| `model_id` | integer | 是 | - | 主模型 ID |
| `routing_strategy` | string | 否 | `priority` | 路由策略 |
| `fallback_model_id` | integer | 否 | null | 备用模型 ID |
| `config` | object | 否 | null | 扩展配置 |

#### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/ai-models/routings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "vulnerability_analysis",
    "model_id": 1,
    "routing_strategy": "accuracy",
    "fallback_model_id": 2
  }'
```

#### 响应示例

```json
{
  "data": {
    "id": 8,
    "task_type": "vulnerability_analysis",
    "model_id": 1,
    "routing_strategy": "accuracy",
    "fallback_model_id": 2,
    "config": null,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### 路由调用

```bash
POST /api/v1/ai-models/route
```

根据数据库中的路由配置，选择模型并执行 LLM 调用。当 LLM 客户端不可用时，自动降级为模拟响应。

#### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `task_type` | string | 是 | 任务类型 |
| `input_text` | string | 是 | 输入文本 |
| `max_tokens` | integer | 否 | 最大输出 Token 数 |

#### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/ai-models/route" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "threat_analysis",
    "input_text": "检测到主机 192.168.1.105 与外部 IP 45.33.32.156 通信"
  }'
```

#### 响应示例

```json
{
  "data": {
    "model_id": 1,
    "model_name": "gpt-4o",
    "provider": "openai",
    "output": "基于多源关联分析，检测到疑似APT攻击行为。攻击者通过钓鱼邮件获取初始访问权限，随后进行横向移动和数据外泄。建议立即隔离受影响终端并重置相关凭证。",
    "input_tokens": 21,
    "output_tokens": 85,
    "latency_ms": 1250,
    "cost": 0.00138,
    "routing_strategy": "accuracy",
    "fallback_used": false
  }
}
```

---

### 获取统计

```bash
GET /api/v1/ai-models/stats
```

返回数据库记录的模型调用统计，包括总调用次数、成功率、平均延迟、总成本，以及按模型和按任务的分组统计。

#### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/ai-models/stats" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": {
    "total_calls": 1256,
    "success_rate": 0.9856,
    "avg_latency_ms": 980.5,
    "total_cost": 45.67,
    "calls_by_model": {
      "gpt-4o": 312,
      "claude-3.5-sonnet": 445,
      "qwen-max": 289,
      "deepseek-v3": 210
    },
    "calls_by_task": {
      "threat_analysis": 234,
      "alert_triage": 456,
      "report_generation": 178,
      "code_analysis": 89,
      "incident_response": 123,
      "threat_hunting": 67,
      "general_chat": 109
    }
  }
}
```

---

### 获取调用日志

```bash
GET /api/v1/ai-models/logs
```

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `model_id` | integer | 否 | - | 按模型 ID 筛选 |
| `limit` | integer | 否 | 50 | 返回条数（最大 200） |

#### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/ai-models/logs?model_id=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": [
    {
      "id": 1024,
      "model_id": 1,
      "task_type": "threat_analysis",
      "input_tokens": 85,
      "output_tokens": 312,
      "latency_ms": 1250,
      "cost": 0.00595,
      "status": "success",
      "error_message": null,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 1023,
      "model_id": 2,
      "task_type": "alert_triage",
      "input_tokens": 120,
      "output_tokens": 45,
      "latency_ms": 890,
      "cost": 0.00068,
      "status": "success",
      "error_message": null,
      "created_at": "2024-01-15T10:28:00Z"
    },
    {
      "id": 1022,
      "model_id": 1,
      "task_type": "threat_analysis",
      "input_tokens": 200,
      "output_tokens": 0,
      "latency_ms": 5000,
      "cost": 0.0,
      "status": "failure",
      "error_message": "LLM 服务超时",
      "created_at": "2024-01-15T10:25:00Z"
    }
  ]
}
```

---

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `RESOURCE_NOT_FOUND` | 404 | 模型或路由配置不存在 |
| `VALIDATION_ERROR` | 400 | 参数验证失败（如 priority 值不合法） |
| `UNSUPPORTED_TASK_TYPE` | 400 | 不支持的任务类型 |
| `INVALID_PRIORITY` | 400 | priority 必须为 quality / cost / speed / balanced |
| `ROUTING_CONFLICT` | 400 | 该任务类型的路由配置已存在 |
| `LLM_SERVICE_ERROR` | 502 | LLM 服务调用异常 |
| `ALL_MODELS_FAILED` | 503 | 所有候选模型均调用失败 |
| `QUOTA_EXCEEDED` | 429 | Token 配额超限 |
| `PERMISSION_DENIED` | 403 | 无权操作该资源 |
</parameter>
</path>
</content>
</write>
</tool_calls