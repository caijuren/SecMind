# AI 分析 API

AI 分析 API 提供基于人工智能的安全事件自动研判能力，支持事件提交、批量分析、重新分析和统计分析等操作。所有端点均位于 `/api/v1/ai-analysis` 前缀之下。

## 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/ai-analysis/events` | 获取待分析事件列表 |
| GET | `/api/v1/ai-analysis/events/{event_id}` | 获取单个事件详情 |
| POST | `/api/v1/ai-analysis/events` | 提交新告警进行分析 |
| POST | `/api/v1/ai-analysis/events/batch` | 批量提交告警 |
| GET | `/api/v1/ai-analysis/status` | 获取分析状态 |
| POST | `/api/v1/ai-analysis/events/{event_id}/reanalyze` | 重新分析 |
| DELETE | `/api/v1/ai-analysis/events/{event_id}` | 删除事件 |
| GET | `/api/v1/ai-analysis/stats` | 获取统计信息 |
| POST | `/api/v1/ai-analysis/simulate/generate-sample-events` | 生成模拟事件 |
| GET | `/api/v1/ai-analysis/health` | 健康检查 |

---

## 获取待分析事件列表

```bash
GET /api/v1/ai-analysis/events
```

获取已提交至 AI 分析引擎的事件列表，支持按严重级别和来源筛选。

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `severity` | string | 否 | 严重级别筛选，支持多值逗号分隔：low, medium, high, critical |
| `source` | string | 否 | 事件来源筛选，如 EDR, SIEM, NDR, WAF |
| `status` | string | 否 | 分析状态：pending, analyzing, completed, failed |
| `page` | integer | 否 | 页码（默认 1） |
| `page_size` | integer | 否 | 每页数量（默认 20，最大 100） |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/ai-analysis/events?severity=high,critical&source=EDR&status=pending&page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": [
    {
      "id": "evt_001",
      "title": "疑似 C2 通信行为",
      "severity": "critical",
      "source": "EDR",
      "status": "pending",
      "summary": "主机 192.168.1.105 向已知恶意 IP 发起频繁连接",
      "indicators_count": 3,
      "submitted_at": "2024-01-15T08:23:45Z",
      "analyzed_at": null
    },
    {
      "id": "evt_002",
      "title": "异常 PowerShell 执行",
      "severity": "high",
      "source": "SIEM",
      "status": "completed",
      "summary": "检测到混淆的 PowerShell 命令，尝试绕过执行策略",
      "indicators_count": 5,
      "submitted_at": "2024-01-15T07:50:12Z",
      "analyzed_at": "2024-01-15T07:51:30Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 42,
    "total_pages": 3
  }
}
```

---

## 获取单个事件详情

```bash
GET /api/v1/ai-analysis/events/{event_id}
```

获取指定事件的完整详情，包括原始告警数据、AI 分析结果和处置建议。

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `event_id` | string | 是 | 事件 ID |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/ai-analysis/events/evt_001" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "id": "evt_001",
    "title": "疑似 C2 通信行为",
    "description": "检测到主机 192.168.1.105 在短时间内向多个外部 IP 发起异常频繁的 HTTPS 连接，其中部分 IP 关联已知威胁情报。",
    "severity": "critical",
    "source": "EDR",
    "status": "completed",
    "raw_data": {
      "event_type": "network_connection",
      "process": "svchost.exe",
      "pid": 2847,
      "parent_process": "services.exe",
      "command_line": "C:\\Windows\\System32\\svchost.exe -k netsvcs",
      "connections": [
        {
          "destination_ip": "45.33.32.156",
          "destination_port": 443,
          "protocol": "HTTPS",
          "bytes_sent": 20480,
          "bytes_received": 10240,
          "timestamp": "2024-01-15T08:20:00Z"
        }
      ]
    },
    "indicators": [
      {
        "type": "ip",
        "value": "45.33.32.156",
        "threat_intel": {
          "virustotal": {
            "malicious": 52,
            "total": 70,
            "tags": ["cobalt-strike", "c2"]
          },
          "otx": "known_c2"
        }
      }
    ],
    "ai_analysis": {
      "model_version": "secmind-llm-v3.0",
      "verdict": "malicious",
      "confidence": 0.95,
      "attack_technique": {
        "id": "T1071.001",
        "name": "Application Layer Protocol: Web Protocols",
        "matrix": "enterprise"
      },
      "mitre_mapping": [
        {
          "tactic": "command_and_control",
          "technique": "T1071.001",
          "description": "使用 Web 协议进行 C2 通信"
        }
      ],
      "summary": "该告警高度可疑，目标 IP 45.33.32.156 为已知 Cobalt Strike C2 服务器，通信行为符合 C2 特征。",
      "recommendations": [
        "立即隔离受感染主机 192.168.1.105",
        "收集内存取证样本进行深度分析",
        "排查同一网段其他主机的类似通信行为",
        "检查防火墙和代理日志确认数据外泄范围"
      ],
      "related_events": ["evt_003", "evt_007"],
      "analyzed_at": "2024-01-15T08:24:10Z",
      "analysis_duration_ms": 3240
    },
    "timeline": [
      {
        "timestamp": "2024-01-15T08:23:45Z",
        "event": "submitted",
        "description": "事件提交至 AI 分析引擎"
      },
      {
        "timestamp": "2024-01-15T08:24:10Z",
        "event": "analysis_completed",
        "description": "AI 自动研判完成，判定为恶意"
      }
    ],
    "tags": ["c2", "cobalt-strike", "高危"],
    "created_at": "2024-01-15T08:23:45Z",
    "updated_at": "2024-01-15T08:24:10Z"
  }
}
```

---

## 提交新告警进行分析

```bash
POST /api/v1/ai-analysis/events
```

提交一条新的安全告警供 AI 引擎进行自动研判分析。

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 告警标题 |
| `description` | string | 是 | 告警描述 |
| `severity` | string | 是 | 严重级别：low, medium, high, critical |
| `source` | string | 是 | 告警来源，如 EDR, SIEM, NDR, WAF |
| `source_ip` | string | 否 | 源 IP 地址 |
| `destination_ip` | string | 否 | 目标 IP 地址 |
| `raw_data` | object | 否 | 原始告警数据，格式不限 |
| `indicators` | array | 否 | 威胁指标列表 |

```json
{
  "title": "疑似横向移动行为",
  "description": "检测到主机 192.168.1.105 通过 SMB 协议向多台内网主机发起连接",
  "severity": "high",
  "source": "EDR",
  "source_ip": "192.168.1.105",
  "destination_ip": "192.168.1.200",
  "raw_data": {
    "event_type": "network_connection",
    "process": "wmiprvse.exe",
    "pid": 3921,
    "protocol": "SMB",
    "destination_ports": [445]
  },
  "indicators": [
    {
      "type": "ip",
      "value": "192.168.1.200"
    }
  ]
}
```

### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/ai-analysis/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "疑似横向移动行为",
    "description": "检测到主机 192.168.1.105 通过 SMB 协议向多台内网主机发起连接",
    "severity": "high",
    "source": "EDR",
    "source_ip": "192.168.1.105",
    "destination_ip": "192.168.1.200",
    "raw_data": {
      "event_type": "network_connection",
      "process": "wmiprvse.exe",
      "pid": 3921
    },
    "indicators": [
      {
        "type": "ip",
        "value": "192.168.1.200"
      }
    ]
  }'
```

### 响应示例

```json
{
  "data": {
    "id": "evt_010",
    "status": "pending",
    "message": "事件已提交，AI 分析已加入队列",
    "estimated_wait_ms": 1500,
    "created_at": "2024-01-15T09:00:00Z"
  }
}
```

---

## 批量提交告警

```bash
POST /api/v1/ai-analysis/events/batch
```

批量提交多条告警进行分析。单次最多提交 50 条。

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `events` | array | 是 | 告警数组，每项结构与单条提交一致 |
| `parallel` | boolean | 否 | 是否并行分析（默认 true） |

```json
{
  "events": [
    {
      "title": "端口扫描检测",
      "description": "外部 IP 203.0.113.5 对防火墙进行端口扫描",
      "severity": "medium",
      "source": "NDR",
      "source_ip": "203.0.113.5"
    },
    {
      "title": "可疑 DNS 查询",
      "description": "内部主机查询了已知恶意域名",
      "severity": "high",
      "source": "SIEM",
      "source_ip": "10.0.1.50",
      "indicators": [
        {
          "type": "domain",
          "value": "evil.example.com"
        }
      ]
    }
  ],
  "parallel": true
}
```

### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/ai-analysis/events/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "title": "端口扫描检测",
        "description": "外部 IP 203.0.113.5 对防火墙进行端口扫描",
        "severity": "medium",
        "source": "NDR",
        "source_ip": "203.0.113.5"
      },
      {
        "title": "可疑 DNS 查询",
        "description": "内部主机查询了已知恶意域名",
        "severity": "high",
        "source": "SIEM",
        "source_ip": "10.0.1.50",
        "indicators": [
          {
            "type": "domain",
            "value": "evil.example.com"
          }
        ]
      }
    ],
    "parallel": true
  }'
```

### 响应示例

```json
{
  "data": {
    "total_submitted": 2,
    "success_count": 2,
    "failed_count": 0,
    "results": [
      {
        "index": 0,
        "event_id": "evt_011",
        "status": "pending",
        "error": null
      },
      {
        "index": 1,
        "event_id": "evt_012",
        "status": "pending",
        "error": null
      }
    ],
    "created_at": "2024-01-15T09:05:00Z"
  }
}
```

---

## 获取分析状态

```bash
GET /api/v1/ai-analysis/status
```

获取 AI 分析引擎的当前运行状态，包括队列深度、处理速率和资源使用情况。

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/ai-analysis/status" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "engine_status": "running",
    "queue": {
      "pending": 15,
      "analyzing": 3,
      "completed_today": 128,
      "failed_today": 2,
      "average_wait_ms": 2400,
      "average_process_ms": 3200
    },
    "throughput": {
      "events_per_minute": 8.5,
      "peak_per_minute": 15.0
    },
    "resources": {
      "gpu_utilization": 0.72,
      "memory_usage_mb": 4096,
      "model_loaded": "secmind-llm-v3.0"
    },
    "uptime_seconds": 259200,
    "last_heartbeat": "2024-01-15T09:00:00Z"
  }
}
```

---

## 重新分析

```bash
POST /api/v1/ai-analysis/events/{event_id}/reanalyze
```

对已分析完成的事件触发重新分析。适用于需要更新研判结果或使用了新模型的场景。

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `event_id` | string | 是 | 事件 ID |

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model_version` | string | 否 | 指定分析模型版本，不填则使用当前最新模型 |
| `reason` | string | 否 | 重新分析原因（用于审计日志） |

```json
{
  "model_version": "secmind-llm-v3.1",
  "reason": "模型升级后重新评估历史告警"
}
```

### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/ai-analysis/events/evt_001/reanalyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_version": "secmind-llm-v3.1",
    "reason": "模型升级后重新评估历史告警"
  }'
```

### 响应示例

```json
{
  "data": {
    "event_id": "evt_001",
    "previous_analysis_id": "ana_001",
    "new_analysis_id": "ana_015",
    "status": "analyzing",
    "message": "重新分析已开始",
    "estimated_wait_ms": 3500,
    "started_at": "2024-01-15T09:10:00Z"
  }
}
```

---

## 删除事件

```bash
DELETE /api/v1/ai-analysis/events/{event_id}
```

从 AI 分析引擎中删除指定事件及其分析结果。

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `event_id` | string | 是 | 事件 ID |

### 请求示例

```bash
curl -X DELETE "https://api.secmind.example.com/api/v1/ai-analysis/events/evt_001" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "event_id": "evt_001",
    "deleted": true,
    "deleted_at": "2024-01-15T09:15:00Z"
  }
}
```

---

## 获取统计信息

```bash
GET /api/v1/ai-analysis/stats
```

获取 AI 分析引擎的统计信息，包括分析总量、判定分布和趋势数据。

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `time_range` | string | 否 | 时间范围：24h, 7d, 30d, 90d（默认 7d） |
| `group_by` | string | 否 | 分组字段：severity, source, verdict |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/ai-analysis/stats?time_range=7d&group_by=verdict" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "total_analyzed": 856,
    "time_range": "7d",
    "by_severity": {
      "critical": 45,
      "high": 128,
      "medium": 342,
      "low": 341
    },
    "by_verdict": {
      "malicious": 198,
      "suspicious": 312,
      "benign": 285,
      "unknown": 61
    },
    "by_source": {
      "EDR": 320,
      "SIEM": 280,
      "NDR": 156,
      "WAF": 100
    },
    "confidence_distribution": {
      "above_0_9": 142,
      "0_7_to_0_9": 268,
      "0_5_to_0_7": 312,
      "below_0_5": 134
    },
    "average_confidence": 0.72,
    "average_process_time_ms": 2850,
    "trend": [
      { "date": "2024-01-09", "analyzed": 110, "malicious": 28 },
      { "date": "2024-01-10", "analyzed": 125, "malicious": 30 },
      { "date": "2024-01-11", "analyzed": 98, "malicious": 22 },
      { "date": "2024-01-12", "analyzed": 132, "malicious": 35 },
      { "date": "2024-01-13", "analyzed": 115, "malicious": 26 },
      { "date": "2024-01-14", "analyzed": 140, "malicious": 31 },
      { "date": "2024-01-15", "analyzed": 136, "malicious": 26 }
    ]
  }
}
```

---

## 生成模拟事件

```bash
POST /api/v1/ai-analysis/simulate/generate-sample-events
```

生成模拟安全事件用于测试 AI 分析引擎的功能和性能。生成的事件包含完整的原始数据和威胁指标。

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `count` | integer | 否 | 生成数量（默认 10，最大 100） |
| `severity_distribution` | object | 否 | 严重级别分布比例 |
| `include_malicious` | boolean | 否 | 是否包含恶意样本（默认 true） |

```json
{
  "count": 20,
  "severity_distribution": {
    "critical": 0.1,
    "high": 0.3,
    "medium": 0.4,
    "low": 0.2
  },
  "include_malicious": true
}
```

### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/ai-analysis/simulate/generate-sample-events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 20,
    "severity_distribution": {
      "critical": 0.1,
      "high": 0.3,
      "medium": 0.4,
      "low": 0.2
    },
    "include_malicious": true
  }'
```

### 响应示例

```json
{
  "data": {
    "generated_count": 20,
    "events": [
      {
        "id": "evt_sim_001",
        "title": "[模拟] 勒索软件加密行为",
        "severity": "critical",
        "source": "EDR",
        "status": "pending",
        "simulated": true,
        "submitted_at": "2024-01-15T09:20:00Z"
      },
      {
        "id": "evt_sim_002",
        "title": "[模拟] 暴力破解 SSH 登录",
        "severity": "high",
        "source": "SIEM",
        "status": "pending",
        "simulated": true,
        "submitted_at": "2024-01-15T09:20:00Z"
      }
    ],
    "message": "模拟事件生成成功，已自动提交至分析队列"
  }
}
```

---

## 健康检查

```bash
GET /api/v1/ai-analysis/health
```

获取 AI 分析引擎的健康状态，用于监控和负载均衡的健康探测。

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/ai-analysis/health" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "status": "healthy",
    "version": "3.0.0",
    "components": {
      "api_server": {
        "status": "up",
        "latency_ms": 2
      },
      "analysis_engine": {
        "status": "up",
        "model_loaded": "secmind-llm-v3.0",
        "gpu_available": true
      },
      "database": {
        "status": "up",
        "connection_pool": 12
      },
      "message_queue": {
        "status": "up",
        "queue_depth": 15
      },
      "threat_intel": {
        "status": "up",
        "last_sync": "2024-01-15T09:00:00Z"
      }
    },
    "checked_at": "2024-01-15T09:20:00Z"
  }
}
```

---

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `RESOURCE_NOT_FOUND` | 404 | 指定的事件不存在 |
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `PERMISSION_DENIED` | 403 | 无权操作该事件 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超过限制 |
| `BATCH_SIZE_EXCEEDED` | 400 | 批量提交数量超过上限（50） |
| `ANALYSIS_IN_PROGRESS` | 409 | 事件正在分析中，无法重复操作 |
| `EVENT_ALREADY_DELETED` | 410 | 事件已被删除 |
| `ENGINE_BUSY` | 503 | AI 分析引擎负载过高，请稍后重试 |
| `MODEL_NOT_FOUND` | 400 | 指定的模型版本不存在 |
| `SIMULATION_LIMIT_EXCEEDED` | 429 | 模拟事件生成频率超过限制（每小时 100 条） |

---

## 速率限制

AI 分析 API 对不同的端点实施不同的速率限制策略，以防止滥用并确保服务质量。

| 端点 | 限制策略 | 限制值 |
|------|---------|--------|
| `GET /events` | 按 IP / Token | 每分钟 60 次 |
| `GET /events/{event_id}` | 按 IP / Token | 每分钟 120 次 |
| `POST /events` | 按 Token | 每分钟 30 次 |
| `POST /events/batch` | 按 Token | 每分钟 10 次 |
| `GET /status` | 按 IP / Token | 每分钟 30 次 |
| `POST /events/{event_id}/reanalyze` | 按 Token | 每小时 20 次 |
| `DELETE /events/{event_id}` | 按 Token | 每分钟 10 次 |
| `GET /stats` | 按 IP / Token | 每分钟 30 次 |
| `POST /simulate/generate-sample-events` | 按 Token | 每小时 5 次 |
| `GET /health` | 按 IP | 每分钟 120 次 |

超出速率限制时，API 将返回 HTTP 429 状态码，响应头中包含以下信息：

| 响应头 | 说明 |
|--------|------|
| `X-RateLimit-Limit` | 时间窗口内的请求上限 |
| `X-RateLimit-Remaining` | 当前时间窗口内剩余的请求次数 |
| `X-RateLimit-Reset` | 限制重置的 Unix 时间戳 |
| `Retry-After` | 建议等待秒数 |