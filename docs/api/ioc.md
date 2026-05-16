# 威胁情报 API

威胁情报 API 提供 IOC（失陷标示）管理和情报查询接口。

## 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/ioc` | 获取 IOC 列表 |
| POST | `/api/ioc` | 创建 IOC |
| GET | `/api/ioc/{ioc_id}` | 获取 IOC 详情 |
| DELETE | `/api/ioc/{ioc_id}` | 删除 IOC |
| POST | `/api/ioc/batch` | 批量创建 IOC |
| GET | `/api/ioc/search` | 搜索 IOC |
| GET | `/api/ioc/{ioc_id}/enrich` | 富化 IOC 情报 |
| GET | `/api/ioc/sources` | 获取情报源列表 |

## 获取 IOC 列表

```bash
GET /api/ioc
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 否 | IOC 类型：ip, domain, url, hash, email, cidr |
| `threat_type` | string | 否 | 威胁类型：malware, c2, phishing, botnet, ransomware |
| `severity` | string | 否 | 严重级别 |
| `source` | string | 否 | 情报来源 |
| `is_active` | boolean | 否 | 是否活跃 |
| `page` | integer | 否 | 页码 |
| `page_size` | integer | 否 | 每页数量 |

### 响应示例

```json
{
  "data": [
    {
      "id": "ioc_001",
      "type": "ip",
      "value": "45.33.32.156",
      "threat_type": "c2",
      "severity": "high",
      "source": "VirusTotal",
      "is_active": true,
      "tags": ["cobalt-strike", "apt29"],
      "first_seen": "2024-01-01T00:00:00Z",
      "last_seen": "2024-01-15T08:00:00Z",
      "created_at": "2024-01-10T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 1250,
    "total_pages": 63
  }
}
```

## 创建 IOC

```bash
POST /api/ioc
```

### 请求体

```json
{
  "type": "domain",
  "value": "malicious-example.com",
  "threat_type": "phishing",
  "severity": "high",
  "source": "manual",
  "tags": ["phishing", "credential-harvesting"],
  "description": "钓鱼网站，仿冒内部登录页面",
  "ttl_days": 90
}
```

### 响应示例

```json
{
  "data": {
    "id": "ioc_002",
    "type": "domain",
    "value": "malicious-example.com",
    "threat_type": "phishing",
    "severity": "high",
    "source": "manual",
    "is_active": true,
    "tags": ["phishing", "credential-harvesting"],
    "created_at": "2024-01-15T09:00:00Z"
  }
}
```

## 批量创建 IOC

```bash
POST /api/ioc/batch
```

### 请求体

```json
{
  "iocs": [
    {
      "type": "ip",
      "value": "192.168.100.1",
      "threat_type": "c2",
      "severity": "critical"
    },
    {
      "type": "hash",
      "value": "sha256:abc123def456...",
      "threat_type": "malware",
      "severity": "high"
    },
    {
      "type": "domain",
      "value": "evil-domain.com",
      "threat_type": "c2",
      "severity": "high"
    }
  ],
  "source": "threat_feed",
  "tags": ["batch-import", "2024-01"]
}
```

### 响应示例

```json
{
  "data": {
    "created_count": 3,
    "duplicate_count": 0,
    "failed_count": 0,
    "results": [
      { "value": "192.168.100.1", "id": "ioc_010", "status": "created" },
      { "value": "sha256:abc123def456...", "id": "ioc_011", "status": "created" },
      { "value": "evil-domain.com", "id": "ioc_012", "status": "created" }
    ]
  }
}
```

## 搜索 IOC

```bash
GET /api/ioc/search?q=45.33.32.156
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `q` | string | 是 | 搜索关键词（IP、域名、哈希等） |
| `include_enrichment` | boolean | 否 | 是否包含情报富化结果（默认 true） |

### 响应示例

```json
{
  "data": {
    "query": "45.33.32.156",
    "matches": [
      {
        "id": "ioc_001",
        "type": "ip",
        "value": "45.33.32.156",
        "threat_type": "c2",
        "severity": "high",
        "enrichment": {
          "virustotal": {
            "malicious_votes": 52,
            "total_votes": 70,
            "tags": ["cobalt-strike", "c2"],
            "detection_ratio": "74%"
          },
          "geolocation": {
            "country": "US",
            "city": "Los Angeles",
            "isp": "Example ISP"
          },
          "whois": {
            "registration_date": "2023-12-01",
            "registrar": "Example Registrar"
          }
        }
      }
    ],
    "total_matches": 1
  }
}
```

## 富化 IOC 情报

```bash
GET /api/ioc/{ioc_id}/enrich
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sources` | string | 否 | 指定情报源（逗号分隔） |
| `force_refresh` | boolean | 否 | 是否强制刷新缓存（默认 false） |

### 响应示例

```json
{
  "data": {
    "ioc_id": "ioc_001",
    "value": "45.33.32.156",
    "enrichment": {
      "virustotal": {
        "malicious_votes": 52,
        "total_votes": 70,
        "tags": ["cobalt-strike", "c2"],
        "last_analysis": "2024-01-15T06:00:00Z"
      },
      "otx": {
        "pulse_count": 15,
        "related_malware": ["Cobalt Strike", "Beacon"],
        "adversary": "APT29"
      },
      "shodan": {
        "ports": [443, 8443],
        "services": ["https"],
        "last_seen": "2024-01-14"
      }
    },
    "enriched_at": "2024-01-15T09:30:00Z"
  }
}
```

## 获取情报源列表

```bash
GET /api/ioc/sources
```

### 响应示例

```json
{
  "data": [
    {
      "id": "src_001",
      "name": "VirusTotal",
      "type": "virustotal",
      "enabled": true,
      "last_sync": "2024-01-15T06:00:00Z",
      "ioc_count": 15000,
      "rate_limit": {
        "requests_per_minute": 4,
        "remaining": 3
      }
    },
    {
      "id": "src_002",
      "name": "AlienVault OTX",
      "type": "otx",
      "enabled": true,
      "last_sync": "2024-01-15T05:00:00Z",
      "ioc_count": 8500
    }
  ]
}
```

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `RESOURCE_NOT_FOUND` | 404 | IOC 不存在 |
| `VALIDATION_ERROR` | 400 | IOC 格式无效 |
| `DUPLICATE_IOC` | 409 | IOC 已存在 |
| `PERMISSION_DENIED` | 403 | 无权操作 |
| `ENRICHMENT_FAILED` | 503 | 情报富化服务不可用 |
| `RATE_LIMIT_EXCEEDED` | 429 | 情报源请求超频 |
