# 告警管理 API

告警管理 API 提供安全告警的查询、更新和批量操作接口。

## 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/alerts` | 获取告警列表 |
| GET | `/api/alerts/{alert_id}` | 获取告警详情 |
| PATCH | `/api/alerts/{alert_id}` | 更新告警 |
| POST | `/api/alerts/batch-update` | 批量更新告警 |
| POST | `/api/alerts/{alert_id}/analyze` | 触发 AI 分析 |
| GET | `/api/alerts/stats` | 获取告警统计 |

## 获取告警列表

```bash
GET /api/alerts
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `severity` | string | 否 | 严重级别：low, medium, high, critical |
| `status` | string | 否 | 状态：new, investigating, resolved, false_positive |
| `category` | string | 否 | 分类：malware, phishing, intrusion, data_leak, other |
| `source` | string | 否 | 告警来源 |
| `assigned_to` | string | 否 | 负责人 ID |
| `created_after` | string | 否 | 创建时间起始（ISO 8601） |
| `created_before` | string | 否 | 创建时间截止（ISO 8601） |
| `search` | string | 否 | 关键词搜索 |
| `page` | integer | 否 | 页码（默认 1） |
| `page_size` | integer | 否 | 每页数量（默认 20，最大 100） |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/alerts?severity=high,critical&status=new,investigating&page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": [
    {
      "id": "alt_001",
      "title": "疑似恶意软件通信",
      "description": "检测到主机 192.168.1.105 与已知 C2 服务器通信",
      "severity": "critical",
      "status": "new",
      "category": "malware",
      "source": "EDR",
      "source_ip": "192.168.1.105",
      "destination_ip": "45.33.32.156",
      "indicators": [
        {
          "type": "ip",
          "value": "45.33.32.156",
          "threat_intel": {
            "virustotal": "malicious",
            "otx": "known_c2"
          }
        }
      ],
      "assigned_to": null,
      "created_at": "2024-01-15T08:23:45Z",
      "updated_at": "2024-01-15T08:23:45Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

## 获取告警详情

```bash
GET /api/alerts/{alert_id}
```

### 响应示例

```json
{
  "data": {
    "id": "alt_001",
    "title": "疑似恶意软件通信",
    "description": "检测到主机 192.168.1.105 与已知 C2 服务器通信",
    "severity": "critical",
    "status": "investigating",
    "category": "malware",
    "source": "EDR",
    "source_ip": "192.168.1.105",
    "destination_ip": "45.33.32.156",
    "raw_data": {
      "event_type": "network_connection",
      "process": "svchost.exe",
      "pid": 2847
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
          }
        }
      }
    ],
    "ai_analysis": {
      "verdict": "malicious",
      "confidence": 0.95,
      "summary": "该告警高度可疑，目标 IP 为已知 Cobalt Strike C2 服务器",
      "recommendations": [
        "立即隔离受感染主机",
        "收集内存取证样本",
        "排查横向移动痕迹"
      ]
    },
    "timeline": [
      {
        "timestamp": "2024-01-15T08:23:45Z",
        "event": "alert_created",
        "description": "告警由 EDR 系统自动生成"
      },
      {
        "timestamp": "2024-01-15T08:24:10Z",
        "event": "ai_analysis_completed",
        "description": "AI 自动研判完成，判定为恶意"
      }
    ],
    "assigned_to": {
      "id": "usr_005",
      "name": "张安全",
      "email": "zhang@company.com"
    },
    "created_at": "2024-01-15T08:23:45Z",
    "updated_at": "2024-01-15T08:30:00Z"
  }
}
```

## 更新告警

```bash
PATCH /api/alerts/{alert_id}
```

### 请求体

```json
{
  "status": "investigating",
  "severity": "critical",
  "assigned_to": "usr_005",
  "notes": "已确认 C2 通信，开始深入调查"
}
```

### 响应示例

```json
{
  "data": {
    "id": "alt_001",
    "status": "investigating",
    "severity": "critical",
    "assigned_to": "usr_005",
    "updated_at": "2024-01-15T08:35:00Z"
  }
}
```

## 批量更新告警

```bash
POST /api/alerts/batch-update
```

### 请求体

```json
{
  "alert_ids": ["alt_001", "alt_002", "alt_003"],
  "updates": {
    "status": "investigating",
    "assigned_to": "usr_005"
  }
}
```

### 响应示例

```json
{
  "data": {
    "updated_count": 3,
    "failed_count": 0,
    "results": [
      { "alert_id": "alt_001", "status": "success" },
      { "alert_id": "alt_002", "status": "success" },
      { "alert_id": "alt_003", "status": "success" }
    ]
  }
}
```

## 触发 AI 分析

```bash
POST /api/alerts/{alert_id}/analyze
```

### 请求体

```json
{
  "analysis_type": "full",
  "include_threat_intel": true,
  "include_related_alerts": true,
  "custom_prompt": "请重点分析该告警是否为 APT 攻击的初始入侵"
}
```

### 响应示例

```json
{
  "data": {
    "analysis_id": "ana_001",
    "alert_id": "alt_001",
    "status": "completed",
    "verdict": "malicious",
    "confidence": 0.95,
    "summary": "该告警高度可疑，目标 IP 为已知 Cobalt Strike C2 服务器",
    "attack_technique": "T1071.001 - Application Layer Protocol: Web Protocols",
    "recommendations": [
      "立即隔离受感染主机 192.168.1.105",
      "收集内存取证样本进行深度分析",
      "排查同一网段其他主机的类似通信"
    ],
    "related_alerts": ["alt_002", "alt_005"],
    "analyzed_at": "2024-01-15T08:24:10Z"
  }
}
```

## 获取告警统计

```bash
GET /api/alerts/stats
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `time_range` | string | 否 | 时间范围：24h, 7d, 30d, 90d（默认 7d） |
| `group_by` | string | 否 | 分组字段：severity, category, source, status |

### 响应示例

```json
{
  "data": {
    "total": 156,
    "by_severity": {
      "critical": 12,
      "high": 35,
      "medium": 68,
      "low": 41
    },
    "by_status": {
      "new": 45,
      "investigating": 38,
      "resolved": 60,
      "false_positive": 13
    },
    "by_category": {
      "malware": 42,
      "phishing": 31,
      "intrusion": 28,
      "data_leak": 15,
      "other": 40
    },
    "trend": [
      { "date": "2024-01-09", "count": 18 },
      { "date": "2024-01-10", "count": 22 },
      { "date": "2024-01-11", "count": 15 },
      { "date": "2024-01-12", "count": 25 },
      { "date": "2024-01-13", "count": 20 },
      { "date": "2024-01-14", "count": 28 },
      { "date": "2024-01-15", "count": 28 }
    ]
  }
}
```

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `RESOURCE_NOT_FOUND` | 404 | 告警不存在 |
| `VALIDATION_ERROR` | 400 | 参数验证失败 |
| `PERMISSION_DENIED` | 403 | 无权操作该告警 |
| `RATE_LIMIT_EXCEEDED` | 429 | AI 分析请求超频 |
