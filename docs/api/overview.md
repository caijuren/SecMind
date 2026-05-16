# API 概览

SecMind 提供 RESTful API 接口，支持与外部系统集成和自动化操作。

## 基本信息

| 项目 | 说明 |
|------|------|
| 基础 URL | `https://api.secmind.example.com/api` |
| 协议 | HTTPS |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |
| 时间格式 | ISO 8601（`2024-01-15T08:30:00Z`） |
| API 版本 | v1 |

## 请求规范

### 请求头

| Header | 必填 | 说明 |
|--------|------|------|
| `Authorization` | 是 | `Bearer {access_token}` |
| `Content-Type` | 是 | `application/json` |
| `X-Request-ID` | 否 | 请求追踪 ID |
| `X-Tenant-ID` | 条件 | 多租户模式下的租户 ID |

### 分页参数

所有列表接口支持分页查询：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | integer | 1 | 页码 |
| `page_size` | integer | 20 | 每页数量（最大 100） |
| `sort_by` | string | - | 排序字段 |
| `sort_order` | string | desc | 排序方向：asc / desc |

### 筛选参数

列表接口支持通用筛选语法：

```bash
# 按字段筛选
GET /api/alerts?severity=high&status=open

# 范围筛选
GET /api/alerts?created_after=2024-01-01&created_before=2024-01-31

# 模糊搜索
GET /api/alerts?search=suspicious+login

# 多值筛选
GET /api/alerts?severity=high,critical
```

## 响应规范

### 成功响应

```json
{
  "data": { },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T08:30:00Z"
  }
}
```

### 列表响应

```json
{
  "data": [ ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 150,
    "total_pages": 8
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T08:30:00Z"
  }
}
```

### 错误响应

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "severity",
        "message": "必须是 low, medium, high, critical 之一"
      }
    ]
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T08:30:00Z"
  }
}
```

## 错误码

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 204 | 删除成功（无返回内容） |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 数据验证失败 |
| 429 | 请求频率超限 |
| 500 | 服务器内部错误 |
| 503 | 服务暂不可用 |

### 业务错误码

| 错误码 | 说明 |
|--------|------|
| `AUTH_FAILED` | 认证失败 |
| `TOKEN_EXPIRED` | 令牌已过期 |
| `PERMISSION_DENIED` | 权限不足 |
| `RESOURCE_NOT_FOUND` | 资源不存在 |
| `RESOURCE_CONFLICT` | 资源冲突 |
| `VALIDATION_ERROR` | 数据验证失败 |
| `RATE_LIMIT_EXCEEDED` | 频率超限 |
| `LLM_SERVICE_ERROR` | LLM 服务异常 |
| `INTEGRATION_ERROR` | 外部集成异常 |
| `PLAYBOOK_EXECUTION_ERROR` | 剧本执行异常 |

## 速率限制

API 实施速率限制以保护服务稳定性：

| 级别 | 限制 | 窗口 |
|------|------|------|
| 普通 | 100 次 | 每分钟 |
| AI 分析 | 20 次 | 每分钟 |
| 报告生成 | 5 次 | 每分钟 |

超出限制时返回 `429` 状态码，响应头包含：

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705312200
Retry-After: 30
```

## SDK

### Python SDK

```bash
pip install secmind-sdk
```

```python
from secmind import SecMindClient

client = SecMindClient(
    base_url="https://api.secmind.example.com",
    api_key="your-api-key"
)

alerts = client.alerts.list(severity="high", status="open")
```

### TypeScript SDK

```bash
npm install @secmind/sdk
```

```typescript
import { SecMindClient } from '@secmind/sdk'

const client = new SecMindClient({
  baseUrl: 'https://api.secmind.example.com',
  apiKey: 'your-api-key'
})

const alerts = await client.alerts.list({ severity: 'high', status: 'open' })
```
