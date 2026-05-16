# 租户与计费 API

租户与计费 API 提供多租户管理和订阅计费相关接口，支持租户的创建与管理、成员管理、配额监控，以及订阅、订单、发票和用量统计等计费功能。

## 套餐定价

SecMind 提供以下套餐方案：

| 套餐 | 价格 | 告警处理量 | 成员数 | AI 分析 | 报告生成 | 数据留存 |
|------|------|-----------|--------|---------|---------|---------|
| Free | 免费 | 1,000 条/月 | 3 人 | 50 次/月 | 5 份/月 | 7 天 |
| Team | ¥999/月 | 10,000 条/月 | 10 人 | 500 次/月 | 50 份/月 | 30 天 |
| Business | ¥3,999/月 | 50,000 条/月 | 50 人 | 2,000 次/月 | 200 份/月 | 90 天 |
| Enterprise | 定制报价 | 不限 | 不限 | 不限 | 不限 | 365 天 |

> Enterprise 套餐支持私有化部署、定制化开发及专属 SLA，请联系销售团队。

## 租户管理

租户管理端点前缀：`/api/v1/tenants`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/tenants` | 获取租户列表 |
| POST | `/api/v1/tenants` | 创建租户 |
| GET | `/api/v1/tenants/{id}` | 获取租户详情 |
| PUT | `/api/v1/tenants/{id}` | 更新租户 |
| DELETE | `/api/v1/tenants/{id}` | 删除租户 |
| GET | `/api/v1/tenants/{id}/members` | 获取成员列表 |
| POST | `/api/v1/tenants/{id}/members` | 添加成员 |
| DELETE | `/api/v1/tenants/{id}/members/{user_id}` | 移除成员 |
| GET | `/api/v1/tenants/{id}/quota` | 获取配额信息 |

### 获取租户列表

```bash
GET /api/v1/tenants
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 否 | 状态：active, suspended, canceled |
| `plan` | string | 否 | 套餐：free, team, business, enterprise |
| `search` | string | 否 | 按名称或域名搜索 |
| `page` | integer | 否 | 页码（默认 1） |
| `page_size` | integer | 否 | 每页数量（默认 20，最大 100） |

#### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/tenants?status=active&page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": [
    {
      "id": "tnt_001",
      "name": "星辰科技有限公司",
      "domain": "starlight.example.com",
      "plan": "business",
      "status": "active",
      "member_count": 23,
      "owner": {
        "id": "usr_001",
        "name": "管理员",
        "email": "admin@starlight.example.com"
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-06-01T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

### 创建租户

```bash
POST /api/v1/tenants
```

#### 请求体

```json
{
  "name": "星辰科技有限公司",
  "domain": "starlight.example.com",
  "plan": "team",
  "owner_email": "admin@starlight.example.com",
  "owner_name": "管理员",
  "contact_phone": "+86-138-0000-0000",
  "address": "北京市朝阳区建国路 88 号"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 租户名称 |
| `domain` | string | 是 | 租户域名（唯一） |
| `plan` | string | 是 | 套餐：free, team, business, enterprise |
| `owner_email` | string | 是 | 管理员邮箱 |
| `owner_name` | string | 是 | 管理员姓名 |
| `contact_phone` | string | 否 | 联系电话 |
| `address` | string | 否 | 公司地址 |

#### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/tenants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "星辰科技有限公司",
    "domain": "starlight.example.com",
    "plan": "team",
    "owner_email": "admin@starlight.example.com",
    "owner_name": "管理员",
    "contact_phone": "+86-138-0000-0000"
  }'
```

#### 响应示例

```json
{
  "data": {
    "id": "tnt_001",
    "name": "星辰科技有限公司",
    "domain": "starlight.example.com",
    "plan": "team",
    "status": "active",
    "member_count": 1,
    "owner": {
      "id": "usr_001",
      "name": "管理员",
      "email": "admin@starlight.example.com"
    },
    "created_at": "2024-06-15T10:00:00Z"
  }
}
```

### 获取租户详情

```bash
GET /api/v1/tenants/{id}
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 租户 ID |

#### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/tenants/tnt_001" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": {
    "id": "tnt_001",
    "name": "星辰科技有限公司",
    "domain": "starlight.example.com",
    "plan": "business",
    "status": "active",
    "member_count": 23,
    "owner": {
      "id": "usr_001",
      "name": "管理员",
      "email": "admin@starlight.example.com"
    },
    "contact_phone": "+86-138-0000-0000",
    "address": "北京市朝阳区建国路 88 号",
    "subscription": {
      "id": "sub_001",
      "plan": "business",
      "status": "active",
      "current_period_start": "2024-06-01T00:00:00Z",
      "current_period_end": "2024-07-01T00:00:00Z",
      "auto_renew": true
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-06-01T08:00:00Z"
  }
}
```

### 更新租户

```bash
PUT /api/v1/tenants/{id}
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 租户 ID |

#### 请求体

```json
{
  "name": "星辰科技股份有限公司",
  "contact_phone": "+86-139-0000-0000",
  "address": "北京市海淀区中关村大街 1 号"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 租户名称 |
| `contact_phone` | string | 否 | 联系电话 |
| `address` | string | 否 | 公司地址 |

#### 请求示例

```bash
curl -X PUT "https://api.secmind.example.com/api/v1/tenants/tnt_001" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "星辰科技股份有限公司",
    "contact_phone": "+86-139-0000-0000"
  }'
```

#### 响应示例

```json
{
  "data": {
    "id": "tnt_001",
    "name": "星辰科技股份有限公司",
    "domain": "starlight.example.com",
    "plan": "business",
    "status": "active",
    "updated_at": "2024-06-15T10:30:00Z"
  }
}
```

### 删除租户

```bash
DELETE /api/v1/tenants/{id}
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 租户 ID |

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `reason` | string | 否 | 删除原因 |

#### 请求示例

```bash
curl -X DELETE "https://api.secmind.example.com/api/v1/tenants/tnt_001?reason=公司注销" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": {
    "id": "tnt_001",
    "status": "canceled",
    "deleted_at": "2024-06-15T11:00:00Z"
  }
}
```

### 获取成员列表

```bash
GET /api/v1/tenants/{id}/members
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 租户 ID |

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `role` | string | 否 | 角色：admin, analyst, viewer |
| `status` | string | 否 | 状态：active, inactive |
| `page` | integer | 否 | 页码（默认 1） |
| `page_size` | integer | 否 | 每页数量（默认 20，最大 100） |

#### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/tenants/tnt_001/members?role=admin&page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": [
    {
      "user_id": "usr_001",
      "name": "管理员",
      "email": "admin@starlight.example.com",
      "role": "admin",
      "status": "active",
      "last_active_at": "2024-06-15T09:00:00Z",
      "joined_at": "2024-01-01T00:00:00Z"
    },
    {
      "user_id": "usr_005",
      "name": "张安全",
      "email": "zhang@starlight.example.com",
      "role": "analyst",
      "status": "active",
      "last_active_at": "2024-06-14T16:00:00Z",
      "joined_at": "2024-01-05T00:00:00Z"
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

### 添加成员

```bash
POST /api/v1/tenants/{id}/members
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 租户 ID |

#### 请求体

```json
{
  "email": "wang@starlight.example.com",
  "name": "王分析",
  "role": "analyst"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 成员邮箱 |
| `name` | string | 是 | 成员姓名 |
| `role` | string | 是 | 角色：admin, analyst, viewer |

#### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/tenants/tnt_001/members" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wang@starlight.example.com",
    "name": "王分析",
    "role": "analyst"
  }'
```

#### 响应示例

```json
{
  "data": {
    "user_id": "usr_010",
    "email": "wang@starlight.example.com",
    "name": "王分析",
    "role": "analyst",
    "status": "active",
    "joined_at": "2024-06-15T10:30:00Z"
  }
}
```

### 移除成员

```bash
DELETE /api/v1/tenants/{id}/members/{user_id}
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 租户 ID |
| `user_id` | string | 用户 ID |

#### 请求示例

```bash
curl -X DELETE "https://api.secmind.example.com/api/v1/tenants/tnt_001/members/usr_010" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": {
    "user_id": "usr_010",
    "status": "removed",
    "removed_at": "2024-06-15T11:00:00Z"
  }
}
```

### 获取配额信息

```bash
GET /api/v1/tenants/{id}/quota
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 租户 ID |

#### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/tenants/tnt_001/quota" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": {
    "plan": "business",
    "period": {
      "start": "2024-06-01T00:00:00Z",
      "end": "2024-07-01T00:00:00Z"
    },
    "quotas": {
      "alerts": {
        "limit": 50000,
        "used": 12350,
        "remaining": 37650,
        "percent": 24.7
      },
      "ai_analysis": {
        "limit": 2000,
        "used": 456,
        "remaining": 1544,
        "percent": 22.8
      },
      "reports": {
        "limit": 200,
        "used": 38,
        "remaining": 162,
        "percent": 19.0
      },
      "members": {
        "limit": 50,
        "used": 23,
        "remaining": 27,
        "percent": 46.0
      },
      "storage": {
        "limit": 107374182400,
        "used": 21474836480,
        "remaining": 85899345920,
        "percent": 20.0,
        "unit": "bytes"
      }
    }
  }
}
```

## 计费管理

计费管理端点前缀：`/api/v1/billing`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/billing/subscription` | 获取订阅信息 |
| POST | `/api/v1/billing/subscription` | 创建/更新订阅 |
| GET | `/api/v1/billing/orders` | 获取订单列表 |
| POST | `/api/v1/billing/orders` | 创建订单 |
| GET | `/api/v1/billing/invoices` | 获取发票列表 |
| GET | `/api/v1/billing/usage` | 获取用量统计 |

### 获取订阅信息

```bash
GET /api/v1/billing/subscription
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `tenant_id` | string | 是 | 租户 ID |

#### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/billing/subscription?tenant_id=tnt_001" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": {
    "id": "sub_001",
    "tenant_id": "tnt_001",
    "plan": "business",
    "status": "active",
    "billing_cycle": "monthly",
    "current_period_start": "2024-06-01T00:00:00Z",
    "current_period_end": "2024-07-01T00:00:00Z",
    "auto_renew": true,
    "trial_end": null,
    "cancel_at_period_end": false,
    "payment_method": {
      "type": "credit_card",
      "last_four": "4242",
      "brand": "Visa",
      "exp_month": 12,
      "exp_year": 2026
    },
    "next_invoice": {
      "amount": 399900,
      "currency": "CNY",
      "due_date": "2024-07-01T00:00:00Z"
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-06-01T08:00:00Z"
  }
}
```

### 创建/更新订阅

```bash
POST /api/v1/billing/subscription
```

#### 请求体

```json
{
  "tenant_id": "tnt_001",
  "plan": "business",
  "billing_cycle": "monthly",
  "auto_renew": true,
  "payment_method_id": "pm_001"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `tenant_id` | string | 是 | 租户 ID |
| `plan` | string | 是 | 目标套餐：free, team, business, enterprise |
| `billing_cycle` | string | 否 | 计费周期：monthly, yearly（默认 monthly） |
| `auto_renew` | boolean | 否 | 是否自动续费（默认 true） |
| `payment_method_id` | string | 否 | 支付方式 ID |

#### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/billing/subscription" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "tnt_001",
    "plan": "business",
    "billing_cycle": "yearly",
    "auto_renew": true,
    "payment_method_id": "pm_001"
  }'
```

#### 响应示例

```json
{
  "data": {
    "id": "sub_001",
    "tenant_id": "tnt_001",
    "plan": "business",
    "status": "active",
    "billing_cycle": "yearly",
    "current_period_start": "2024-06-15T00:00:00Z",
    "current_period_end": "2025-06-15T00:00:00Z",
    "auto_renew": true,
    "cancel_at_period_end": false,
    "immediate_change": {
      "previous_plan": "monthly",
      "prorated_amount": 280000,
      "currency": "CNY"
    },
    "updated_at": "2024-06-15T10:00:00Z"
  }
}
```

### 获取订单列表

```bash
GET /api/v1/billing/orders
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `tenant_id` | string | 是 | 租户 ID |
| `status` | string | 否 | 状态：pending, paid, failed, refunded |
| `start_date` | string | 否 | 创建时间起始（ISO 8601） |
| `end_date` | string | 否 | 创建时间截止（ISO 8601） |
| `page` | integer | 否 | 页码（默认 1） |
| `page_size` | integer | 否 | 每页数量（默认 20，最大 100） |

#### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/billing/orders?tenant_id=tnt_001&status=paid&page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": [
    {
      "id": "ord_001",
      "tenant_id": "tnt_001",
      "type": "subscription",
      "description": "Business 套餐订阅（月度）",
      "amount": 399900,
      "currency": "CNY",
      "status": "paid",
      "payment_method": "credit_card",
      "paid_at": "2024-06-01T08:00:00Z",
      "created_at": "2024-06-01T00:00:00Z"
    },
    {
      "id": "ord_002",
      "tenant_id": "tnt_001",
      "type": "upgrade",
      "description": "Team 升级至 Business 套餐差价",
      "amount": 300000,
      "currency": "CNY",
      "status": "paid",
      "payment_method": "credit_card",
      "paid_at": "2024-03-15T09:00:00Z",
      "created_at": "2024-03-15T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 6,
    "total_pages": 1
  }
}
```

### 创建订单

```bash
POST /api/v1/billing/orders
```

#### 请求体

```json
{
  "tenant_id": "tnt_001",
  "type": "subscription",
  "plan": "business",
  "billing_cycle": "monthly",
  "payment_method_id": "pm_001",
  "coupon_code": "WELCOME20"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `tenant_id` | string | 是 | 租户 ID |
| `type` | string | 是 | 订单类型：subscription, upgrade, addon |
| `plan` | string | 是 | 套餐 |
| `billing_cycle` | string | 否 | 计费周期（默认 monthly） |
| `payment_method_id` | string | 是 | 支付方式 ID |
| `coupon_code` | string | 否 | 优惠券代码 |

#### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/billing/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "tnt_001",
    "type": "subscription",
    "plan": "business",
    "billing_cycle": "monthly",
    "payment_method_id": "pm_001"
  }'
```

#### 响应示例

```json
{
  "data": {
    "id": "ord_003",
    "tenant_id": "tnt_001",
    "type": "subscription",
    "description": "Business 套餐订阅（月度）",
    "amount": 399900,
    "currency": "CNY",
    "status": "pending",
    "payment_url": "https://pay.secmind.example.com/checkout/ord_003",
    "created_at": "2024-06-15T10:00:00Z",
    "expires_at": "2024-06-15T10:30:00Z"
  }
}
```

### 获取发票列表

```bash
GET /api/v1/billing/invoices
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `tenant_id` | string | 是 | 租户 ID |
| `status` | string | 否 | 状态：pending, issued, paid, voided |
| `start_date` | string | 否 | 发票日期起始（ISO 8601） |
| `end_date` | string | 否 | 发票日期截止（ISO 8601） |
| `page` | integer | 否 | 页码（默认 1） |
| `page_size` | integer | 否 | 每页数量（默认 20，最大 100） |

#### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/billing/invoices?tenant_id=tnt_001&status=issued&page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": [
    {
      "id": "inv_001",
      "tenant_id": "tnt_001",
      "order_id": "ord_001",
      "number": "INV-2024-0001",
      "type": "vat",
      "title": "星辰科技有限公司",
      "tax_id": "91110000MA1234567X",
      "amount": 399900,
      "currency": "CNY",
      "status": "issued",
      "pdf_url": "https://files.secmind.example.com/invoices/inv_001.pdf",
      "issued_at": "2024-06-01T08:00:00Z",
      "created_at": "2024-06-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 6,
    "total_pages": 1
  }
}
```

### 获取用量统计

```bash
GET /api/v1/billing/usage
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `tenant_id` | string | 是 | 租户 ID |
| `start_date` | string | 否 | 统计起始日期（默认当期计费周期开始） |
| `end_date` | string | 否 | 统计截止日期（默认当期计费周期结束） |
| `granularity` | string | 否 | 粒度：daily, monthly（默认 daily） |

#### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/billing/usage?tenant_id=tnt_001&granularity=daily" \
  -H "Authorization: Bearer $TOKEN"
```

#### 响应示例

```json
{
  "data": {
    "tenant_id": "tnt_001",
    "plan": "business",
    "period": {
      "start": "2024-06-01T00:00:00Z",
      "end": "2024-07-01T00:00:00Z"
    },
    "summary": {
      "alerts_processed": 12350,
      "ai_analysis_runs": 456,
      "reports_generated": 38,
      "storage_used_bytes": 21474836480,
      "api_calls": 28500
    },
    "daily_breakdown": [
      {
        "date": "2024-06-01",
        "alerts_processed": 420,
        "ai_analysis_runs": 15,
        "reports_generated": 2,
        "api_calls": 950
      },
      {
        "date": "2024-06-02",
        "alerts_processed": 385,
        "ai_analysis_runs": 12,
        "reports_generated": 1,
        "api_calls": 880
      }
    ]
  }
}
```

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `RESOURCE_NOT_FOUND` | 404 | 租户或资源不存在 |
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `PERMISSION_DENIED` | 403 | 无权操作该租户 |
| `TENANT_EXISTS` | 409 | 租户域名已存在 |
| `TENANT_SUSPENDED` | 403 | 租户已被暂停 |
| `MEMBER_LIMIT_EXCEEDED` | 403 | 成员数量超出套餐限制 |
| `QUOTA_EXCEEDED` | 403 | 用量超出套餐配额 |
| `INVALID_PLAN` | 400 | 无效的套餐类型 |
| `PLAN_DOWNGRADE_NOT_ALLOWED` | 400 | 不允许降级套餐 |
| `SUBSCRIPTION_ACTIVE` | 409 | 已有有效订阅 |
| `PAYMENT_FAILED` | 402 | 支付失败 |
| `INVALID_COUPON` | 400 | 优惠券无效或已过期 |
| `INVOICE_NOT_FOUND` | 404 | 发票不存在 |