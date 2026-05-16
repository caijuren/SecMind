# 威胁狩猎 API

威胁狩猎 API 提供假设管理、证据收集和狩猎查询接口。

## 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/hunting/hypotheses` | 获取假设列表 |
| POST | `/api/hunting/hypotheses` | 创建狩猎假设 |
| GET | `/api/hunting/hypotheses/{hypothesis_id}` | 获取假设详情 |
| PATCH | `/api/hunting/hypotheses/{hypothesis_id}` | 更新假设 |
| POST | `/api/hunting/hypotheses/{hypothesis_id}/evidence` | 添加证据 |
| POST | `/api/hunting/hypotheses/{hypothesis_id}/evolve` | 触发假设演化 |
| POST | `/api/hunting/query` | 执行狩猎查询 |
| GET | `/api/hunting/hypotheses/{hypothesis_id}/graph` | 获取假设关系图 |

## 获取假设列表

```bash
GET /api/hunting/hypotheses
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 否 | 状态：active, confirmed, disproven, suspended |
| `severity` | string | 否 | 严重级别 |
| `hypothesis_type` | string | 否 | 类型：threat_actor, malware, technique, anomaly |
| `assigned_to` | string | 否 | 负责人 ID |
| `page` | integer | 否 | 页码 |
| `page_size` | integer | 否 | 每页数量 |

### 响应示例

```json
{
  "data": [
    {
      "id": "hyp_001",
      "title": "疑似 APT29 鱼叉钓鱼活动",
      "hypothesis_type": "threat_actor",
      "severity": "high",
      "status": "active",
      "confidence": 0.65,
      "evidence_count": 5,
      "assigned_to": {
        "id": "usr_003",
        "name": "王猎手"
      },
      "created_at": "2024-01-14T09:00:00Z",
      "updated_at": "2024-01-15T16:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 8,
    "total_pages": 1
  }
}
```

## 创建狩猎假设

```bash
POST /api/hunting/hypotheses
```

### 请求体

```json
{
  "title": "疑似 APT29 鱼叉钓鱼活动",
  "description": "基于近期情报，怀疑 APT29 组织通过鱼叉钓鱼邮件针对我司发起攻击",
  "hypothesis_type": "threat_actor",
  "severity": "high",
  "indicators": [
    {
      "type": "domain",
      "value": "finnce-secure.com",
      "ioc_type": "domain"
    }
  ],
  "data_sources": ["email_logs", "edr_events", "proxy_logs"],
  "assigned_to": "usr_003"
}
```

### 响应示例

```json
{
  "data": {
    "id": "hyp_001",
    "title": "疑似 APT29 鱼叉钓鱼活动",
    "status": "active",
    "confidence": 0.0,
    "evidence_count": 0,
    "created_at": "2024-01-14T09:00:00Z"
  }
}
```

## 添加证据

```bash
POST /api/hunting/hypotheses/{hypothesis_id}/evidence
```

### 请求体

```json
{
  "evidence_type": "email",
  "source": "exchange_logs",
  "data": {
    "message_id": "<20240115.finnce-secure.com>",
    "sender": "cfo@finnce-secure.com",
    "recipients": ["employee@company.com"],
    "attachment_hash": "sha256:abc123..."
  },
  "confidence": 0.85,
  "notes": "附件包含恶意宏代码"
}
```

### 响应示例

```json
{
  "data": {
    "id": "evi_001",
    "hypothesis_id": "hyp_001",
    "evidence_type": "email",
    "source": "exchange_logs",
    "confidence": 0.85,
    "hypothesis_confidence_updated": 0.65,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

## 触发假设演化

```bash
POST /api/hunting/hypotheses/{hypothesis_id}/evolve
```

### 请求体

```json
{
  "evolution_strategy": "expand",
  "direction": "lateral",
  "max_depth": 3,
  "additional_indicators": [
    {
      "type": "ip",
      "value": "45.33.32.156"
    }
  ]
}
```

### 响应示例

```json
{
  "data": {
    "evolution_id": "evo_001",
    "hypothesis_id": "hyp_001",
    "status": "completed",
    "new_hypotheses": [
      {
        "id": "hyp_002",
        "title": "APT29 横向移动活动",
        "confidence": 0.45,
        "derived_from": "hyp_001"
      }
    ],
    "new_indicators": [
      {
        "type": "ip",
        "value": "45.33.32.156",
        "context": "与已知 C2 基础设施关联"
      }
    ],
    "completed_at": "2024-01-15T16:00:00Z"
  }
}
```

## 执行狩猎查询

```bash
POST /api/hunting/query
```

### 请求体

```json
{
  "hypothesis_id": "hyp_001",
  "query": {
    "data_source": "email_logs",
    "time_range": "7d",
    "filters": {
      "sender_domain": "finnce-secure.com"
    },
    "fields": ["sender", "recipients", "subject", "attachments"]
  },
  "max_results": 1000
}
```

### 响应示例

```json
{
  "data": {
    "query_id": "q_001",
    "status": "completed",
    "results": [
      {
        "sender": "cfo@finnce-secure.com",
        "recipients": ["employee@company.com"],
        "subject": "Q3 财务报告更新",
        "attachments": ["Q3_Report.xlsx"],
        "timestamp": "2024-01-15T08:00:00Z"
      }
    ],
    "total_matches": 3,
    "execution_time_ms": 1250
  }
}
```

## 获取假设关系图

```bash
GET /api/hunting/hypotheses/{hypothesis_id}/graph
```

### 响应示例

```json
{
  "data": {
    "nodes": [
      {
        "id": "hyp_001",
        "type": "hypothesis",
        "label": "APT29 鱼叉钓鱼",
        "confidence": 0.65
      },
      {
        "id": "evi_001",
        "type": "evidence",
        "label": "恶意邮件",
        "confidence": 0.85
      },
      {
        "id": "ioc_001",
        "type": "indicator",
        "label": "finnce-secure.com"
      }
    ],
    "edges": [
      {
        "source": "hyp_001",
        "target": "evi_001",
        "relation": "supported_by"
      },
      {
        "source": "evi_001",
        "target": "ioc_001",
        "relation": "contains"
      }
    ]
  }
}
```

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `RESOURCE_NOT_FOUND` | 404 | 假设不存在 |
| `VALIDATION_ERROR` | 400 | 参数验证失败 |
| `PERMISSION_DENIED` | 403 | 无权操作该假设 |
| `QUERY_TIMEOUT` | 408 | 狩猎查询超时 |
| `DATA_SOURCE_UNAVAILABLE` | 503 | 数据源不可用 |
