# 事件响应 API

事件响应 API 提供安全事件的创建、管理和响应动作执行接口。

## 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/response/incidents` | 获取事件列表 |
| POST | `/api/response/incidents` | 创建安全事件 |
| GET | `/api/response/incidents/{incident_id}` | 获取事件详情 |
| PATCH | `/api/response/incidents/{incident_id}` | 更新事件 |
| POST | `/api/response/actions` | 执行响应动作 |
| GET | `/api/response/actions/{action_id}` | 获取动作执行状态 |
| POST | `/api/response/incidents/{incident_id}/notes` | 添加事件备注 |
| GET | `/api/response/incidents/{incident_id}/timeline` | 获取事件时间线 |

## 获取事件列表

```bash
GET /api/response/incidents
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `severity` | string | 否 | 严重级别：low, medium, high, critical |
| `status` | string | 否 | 状态：new, confirmed, investigating, containment, eradication, recovery, closed |
| `category` | string | 否 | 分类：malware, phishing, intrusion, data_leak, ddos, insider |
| `assigned_to` | string | 否 | 负责人 ID |
| `created_after` | string | 否 | 创建时间起始 |
| `page` | integer | 否 | 页码 |
| `page_size` | integer | 否 | 每页数量 |

### 响应示例

```json
{
  "data": [
    {
      "id": "inc_001",
      "title": "疑似勒索软件感染事件",
      "severity": "critical",
      "status": "containment",
      "category": "malware",
      "assigned_to": {
        "id": "usr_005",
        "name": "张安全"
      },
      "affected_assets": ["WS-FINANCE-01", "WS-FINANCE-02"],
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 23,
    "total_pages": 2
  }
}
```

## 创建安全事件

```bash
POST /api/response/incidents
```

### 请求体

```json
{
  "title": "疑似勒索软件感染事件",
  "severity": "critical",
  "category": "malware",
  "description": "终端 EDR 检测到疑似勒索软件行为，多个文件被加密",
  "affected_assets": ["WS-FINANCE-01", "WS-FINANCE-02"],
  "indicators": [
    {
      "type": "file_hash",
      "value": "sha256:def456..."
    }
  ],
  "alert_ids": ["alt_001", "alt_002"],
  "assigned_to": "usr_005"
}
```

### 响应示例

```json
{
  "data": {
    "id": "inc_001",
    "title": "疑似勒索软件感染事件",
    "severity": "critical",
    "status": "new",
    "category": "malware",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

## 获取事件详情

```bash
GET /api/response/incidents/{incident_id}
```

### 响应示例

```json
{
  "data": {
    "id": "inc_001",
    "title": "疑似勒索软件感染事件",
    "severity": "critical",
    "status": "containment",
    "category": "malware",
    "description": "终端 EDR 检测到疑似勒索软件行为",
    "affected_assets": ["WS-FINANCE-01", "WS-FINANCE-02"],
    "indicators": [
      {
        "type": "file_hash",
        "value": "sha256:def456..."
      }
    ],
    "assigned_to": {
      "id": "usr_005",
      "name": "张安全",
      "email": "zhang@company.com"
    },
    "collaborators": [
      {
        "id": "usr_008",
        "name": "李响应",
        "role": "responder"
      }
    ],
    "related_alerts": ["alt_001", "alt_002", "alt_005"],
    "actions_taken": [
      {
        "id": "act_001",
        "type": "isolate_host",
        "status": "completed",
        "executed_at": "2024-01-15T10:15:00Z",
        "executed_by": "usr_005"
      }
    ],
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T14:30:00Z"
  }
}
```

## 执行响应动作

```bash
POST /api/response/actions
```

### 请求体

```json
{
  "incident_id": "inc_001",
  "action_type": "isolate_host",
  "parameters": {
    "host": "WS-FINANCE-01",
    "isolation_level": "full",
    "duration_minutes": 120,
    "allowlist": ["10.0.0.1"]
  },
  "approval_required": true,
  "reason": "检测到勒索软件行为，需要立即隔离防止扩散"
}
```

### 响应示例

```json
{
  "data": {
    "id": "act_002",
    "incident_id": "inc_001",
    "action_type": "isolate_host",
    "status": "pending_approval",
    "parameters": {
      "host": "WS-FINANCE-01",
      "isolation_level": "full"
    },
    "requested_by": "usr_005",
    "created_at": "2024-01-15T10:10:00Z"
  }
}
```

## 获取动作执行状态

```bash
GET /api/response/actions/{action_id}
```

### 响应示例

```json
{
  "data": {
    "id": "act_002",
    "action_type": "isolate_host",
    "status": "completed",
    "result": {
      "host": "WS-FINANCE-01",
      "isolation_active": true,
      "isolated_at": "2024-01-15T10:15:00Z",
      "expires_at": "2024-01-15T12:15:00Z"
    },
    "approved_by": "usr_001",
    "executed_by": "system",
    "created_at": "2024-01-15T10:10:00Z",
    "completed_at": "2024-01-15T10:15:00Z"
  }
}
```

## 添加事件备注

```bash
POST /api/response/incidents/{incident_id}/notes
```

### 请求体

```json
{
  "content": "已完成主机隔离，建议下一步进行恶意样本分析",
  "visibility": "team",
  "attachments": []
}
```

### 响应示例

```json
{
  "data": {
    "id": "note_001",
    "incident_id": "inc_001",
    "content": "已完成主机隔离，建议下一步进行恶意样本分析",
    "author": {
      "id": "usr_005",
      "name": "张安全"
    },
    "visibility": "team",
    "created_at": "2024-01-15T14:35:00Z"
  }
}
```

## 获取事件时间线

```bash
GET /api/response/incidents/{incident_id}/timeline
```

### 响应示例

```json
{
  "data": [
    {
      "timestamp": "2024-01-15T10:00:00Z",
      "event_type": "incident_created",
      "description": "安全事件创建",
      "actor": "system"
    },
    {
      "timestamp": "2024-01-15T10:10:00Z",
      "event_type": "action_requested",
      "description": "请求隔离主机 WS-FINANCE-01",
      "actor": "usr_005"
    },
    {
      "timestamp": "2024-01-15T10:12:00Z",
      "event_type": "action_approved",
      "description": "审批通过隔离操作",
      "actor": "usr_001"
    },
    {
      "timestamp": "2024-01-15T10:15:00Z",
      "event_type": "action_completed",
      "description": "主机 WS-FINANCE-01 已隔离",
      "actor": "system"
    }
  ]
}
```

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `RESOURCE_NOT_FOUND` | 404 | 事件不存在 |
| `VALIDATION_ERROR` | 400 | 参数验证失败 |
| `PERMISSION_DENIED` | 403 | 无权操作该事件 |
| `ACTION_PENDING_APPROVAL` | 202 | 动作待审批 |
| `ACTION_EXECUTION_FAILED` | 500 | 动作执行失败 |
