# RBAC 权限管理 API

基于角色的访问控制（RBAC）是 SecMind v3.0 的核心安全机制，通过 **角色-权限** 的映射关系实现细粒度的访问控制。所有 API 请求路径前缀为 `/api/v1/rbac`。

## 概述

RBAC 系统遵循最小权限原则，确保每个用户仅拥有完成工作所必需的权限。系统预置了 4 个系统角色，同时支持创建自定义角色以满足不同的组织需求。

### 核心概念

| 概念 | 说明 |
|------|------|
| **用户（User）** | 系统使用者，可被分配一个或多个角色 |
| **角色（Role）** | 权限的集合，分为系统角色和自定义角色 |
| **权限（Permission）** | 对特定资源的操作许可，格式为 `resource:action` |
| **多角色叠加** | 用户拥有多个角色时，权限取并集 |

### 系统角色

| 角色标识 | 显示名称 | 权限范围 | 适用人员 |
|----------|----------|----------|----------|
| `admin` | 管理员 | 全部权限（`*:*`） | 系统管理员 |
| `analyst` | 安全分析师 | 告警读写、处置执行、威胁狩猎、报告查看等 13 项权限 | 安全分析师 |
| `viewer` | 只读观察者 | 告警查看、处置查看、仪表盘查看等 7 项只读权限 | 审计 / 管理层 |
| `soc_manager` | SOC 主管 | 告警读写、处置审批、用户查看、系统查看等 17 项权限 | SOC 主管 |

### 权限格式

权限采用 `resource:action` 格式，支持通配符：

| 格式 | 示例 | 说明 |
|------|------|------|
| `resource:action` | `alert:read` | 特定资源的特定操作 |
| `resource:*` | `alert:*` | 特定资源的所有操作 |
| `*:*` | `*:*` | 所有资源的所有操作（超级权限） |

### 资源与操作

系统共划分为 22 个资源模块，每个模块包含读（read）和写（write）两种操作：

| 资源 | 可用操作 | 说明 |
|------|----------|------|
| `alert` | read, write | 告警管理 |
| `response` | read, execute, approve, cancel | 处置响应 |
| `hunting` | read, write | 威胁狩猎 |
| `investigate` | read, write | 调查分析 |
| `dashboard` | read | 仪表盘 |
| `report` | read, write | 报告 |
| `playbook` | read, write, execute | 剧本 |
| `user` | read, write | 用户管理 |
| `system` | read, write | 系统设置 |
| `integration` | read, write | 集成管理 |
| `compliance` | read, write | 合规 |
| `ai` | read, write | AI 分析 |
| `asset` | read, write | 资产管理 |
| `log` | read | 日志查看 |
| `rule` | read, write | 检测规则 |
| `notification` | read, write | 通知配置 |
| `threat_intel` | read, write | 威胁情报 |
| `case` | read, write | 案件管理 |
| `sla` | read, write | SLA 配置 |
| `audit` | read | 审计日志 |
| `backup` | read, write | 备份恢复 |
| `license` | read, write | 许可证管理 |

## 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/rbac/seed` | 初始化权限数据 |
| GET | `/api/v1/rbac/roles` | 获取角色列表 |
| POST | `/api/v1/rbac/roles` | 创建角色 |
| GET | `/api/v1/rbac/roles/{id}` | 获取角色详情 |
| PUT | `/api/v1/rbac/roles/{id}` | 更新角色 |
| DELETE | `/api/v1/rbac/roles/{id}` | 删除角色 |
| GET | `/api/v1/rbac/permissions` | 获取权限列表 |
| POST | `/api/v1/rbac/users/{user_id}/roles` | 分配用户角色 |
| GET | `/api/v1/rbac/users/{user_id}/permissions` | 获取用户权限 |

---

## 初始化权限数据

首次使用 RBAC 系统时，需要调用此接口初始化权限数据和系统角色。

```bash
POST /api/v1/rbac/seed
```

### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/rbac/seed" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### 响应示例

```json
{
  "data": {
    "message": "RBAC 数据初始化完成"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T08:00:00Z"
  }
}
```

---

## 获取角色列表

```bash
GET /api/v1/rbac/roles
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `skip` | integer | 否 | 跳过记录数（默认 0） |
| `limit` | integer | 否 | 返回记录数（默认 50，最大 100） |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/rbac/roles?skip=0&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": [
    {
      "id": 1,
      "name": "admin",
      "display_name": "管理员",
      "description": "系统管理员，拥有所有权限",
      "is_system": 1,
      "permissions": [
        {
          "id": 1,
          "resource": "*",
          "action": "*",
          "description": "超级权限"
        }
      ],
      "created_at": "2024-01-15T08:00:00Z",
      "updated_at": "2024-01-15T08:00:00Z"
    },
    {
      "id": 2,
      "name": "analyst",
      "display_name": "安全分析师",
      "description": "可调查分析、执行处置",
      "is_system": 1,
      "permissions": [
        {
          "id": 2,
          "resource": "alert",
          "action": "read",
          "description": "查看告警"
        },
        {
          "id": 3,
          "resource": "alert",
          "action": "write",
          "description": "编辑告警"
        }
      ],
      "created_at": "2024-01-15T08:00:00Z",
      "updated_at": "2024-01-15T08:00:00Z"
    }
  ],
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T08:00:00Z"
  }
}
```

---

## 创建角色

```bash
POST /api/v1/rbac/roles
```

### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 角色标识（唯一，小写字母和下划线） |
| `display_name` | string | 是 | 角色显示名称 |
| `description` | string | 否 | 角色描述 |
| `permission_ids` | array[int] | 否 | 权限 ID 列表 |

### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/rbac/roles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "junior_analyst",
    "display_name": "初级分析师",
    "description": "仅可查看和处理低级别告警",
    "permission_ids": [2, 4, 8, 10]
  }'
```

### 响应示例

```json
{
  "data": {
    "id": 5,
    "name": "junior_analyst",
    "display_name": "初级分析师",
    "description": "仅可查看和处理低级别告警",
    "is_system": 0,
    "permissions": [
      {
        "id": 2,
        "resource": "alert",
        "action": "read",
        "description": "查看告警"
      },
      {
        "id": 4,
        "resource": "response",
        "action": "read",
        "description": "查看处置"
      }
    ],
    "created_at": "2024-01-15T08:30:00Z",
    "updated_at": "2024-01-15T08:30:00Z"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T08:30:00Z"
  }
}
```

---

## 获取角色详情

```bash
GET /api/v1/rbac/roles/{id}
```

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | integer | 角色 ID |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/rbac/roles/2" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "id": 2,
    "name": "analyst",
    "display_name": "安全分析师",
    "description": "可调查分析、执行处置",
    "is_system": 1,
    "permissions": [
      {
        "id": 2,
        "resource": "alert",
        "action": "read",
        "description": "查看告警"
      },
      {
        "id": 3,
        "resource": "alert",
        "action": "write",
        "description": "编辑告警"
      },
      {
        "id": 4,
        "resource": "response",
        "action": "read",
        "description": "查看处置"
      },
      {
        "id": 5,
        "resource": "response",
        "action": "execute",
        "description": "执行处置"
      }
    ],
    "created_at": "2024-01-15T08:00:00Z",
    "updated_at": "2024-01-15T08:00:00Z"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T08:00:00Z"
  }
}
```

---

## 更新角色

```bash
PUT /api/v1/rbac/roles/{id}
```

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | integer | 角色 ID |

### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `display_name` | string | 否 | 角色显示名称 |
| `description` | string | 否 | 角色描述 |
| `permission_ids` | array[int] | 否 | 权限 ID 列表（传入空数组 `[]` 可清空权限） |

::: warning 注意
系统角色（`is_system=1`）的名称不可修改，仅可更新显示名称、描述和权限。
:::

### 请求示例

```bash
curl -X PUT "https://api.secmind.example.com/api/v1/rbac/roles/5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "中级分析师",
    "description": "可查看和处理中高级别告警",
    "permission_ids": [2, 3, 4, 5, 8, 10, 12]
  }'
```

### 响应示例

```json
{
  "data": {
    "id": 5,
    "name": "junior_analyst",
    "display_name": "中级分析师",
    "description": "可查看和处理中高级别告警",
    "is_system": 0,
    "permissions": [
      {
        "id": 2,
        "resource": "alert",
        "action": "read",
        "description": "查看告警"
      },
      {
        "id": 3,
        "resource": "alert",
        "action": "write",
        "description": "编辑告警"
      },
      {
        "id": 4,
        "resource": "response",
        "action": "read",
        "description": "查看处置"
      },
      {
        "id": 5,
        "resource": "response",
        "action": "execute",
        "description": "执行处置"
      }
    ],
    "created_at": "2024-01-15T08:30:00Z",
    "updated_at": "2024-01-15T09:00:00Z"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T09:00:00Z"
  }
}
```

---

## 删除角色

```bash
DELETE /api/v1/rbac/roles/{id}
```

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | integer | 角色 ID |

::: danger 注意
- 系统角色（`is_system=1`）不可删除
- 删除角色后，拥有该角色的用户将自动失去该角色对应的所有权限
- 该操作不可撤销
:::

### 请求示例

```bash
curl -X DELETE "https://api.secmind.example.com/api/v1/rbac/roles/5" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "message": "角色已删除"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T09:30:00Z"
  }
}
```

---

## 获取权限列表

```bash
GET /api/v1/rbac/permissions
```

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/rbac/permissions" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": [
    {
      "id": 1,
      "resource": "alert",
      "action": "read",
      "description": "查看告警"
    },
    {
      "id": 2,
      "resource": "alert",
      "action": "write",
      "description": "编辑告警"
    },
    {
      "id": 3,
      "resource": "response",
      "action": "read",
      "description": "查看处置"
    },
    {
      "id": 4,
      "resource": "response",
      "action": "execute",
      "description": "执行处置"
    },
    {
      "id": 5,
      "resource": "response",
      "action": "approve",
      "description": "审批处置"
    },
    {
      "id": 6,
      "resource": "response",
      "action": "cancel",
      "description": "取消处置"
    }
  ],
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T08:00:00Z"
  }
}
```

---

## 分配用户角色

```bash
POST /api/v1/rbac/users/{user_id}/roles
```

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `user_id` | integer | 用户 ID |

### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `role_ids` | array[int] | 是 | 角色 ID 列表（传入空数组 `[]` 可移除用户所有角色） |

### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/rbac/users/10/roles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role_ids": [2, 4]
  }'
```

### 响应示例

```json
{
  "data": {
    "user_id": 10,
    "roles": ["analyst", "soc_manager"],
    "permissions": [
      "alert:read",
      "alert:write",
      "dashboard:read",
      "hunting:read",
      "hunting:write",
      "investigate:read",
      "investigate:write",
      "playbook:read",
      "playbook:write",
      "report:read",
      "report:write",
      "response:approve",
      "response:cancel",
      "response:execute",
      "response:read",
      "system:read",
      "user:read"
    ]
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

---

## 获取用户权限

```bash
GET /api/v1/rbac/users/{user_id}/permissions
```

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `user_id` | integer | 用户 ID |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/rbac/users/10/permissions" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "user_id": 10,
    "roles": ["analyst", "soc_manager"],
    "permissions": [
      "alert:read",
      "alert:write",
      "dashboard:read",
      "hunting:read",
      "hunting:write",
      "investigate:read",
      "investigate:write",
      "playbook:read",
      "playbook:write",
      "report:read",
      "report:write",
      "response:approve",
      "response:cancel",
      "response:execute",
      "response:read",
      "system:read",
      "user:read"
    ]
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

---

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `RESOURCE_NOT_FOUND` | 404 | 角色、权限或用户不存在 |
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `PERMISSION_DENIED` | 403 | 无权执行该操作 |
| `RESOURCE_CONFLICT` | 409 | 角色名称已存在 |
| `SYSTEM_ROLE_NOT_DELETABLE` | 400 | 系统角色不可删除 |
| `SYSTEM_ROLE_NOT_MODIFIABLE` | 400 | 系统角色名称不可修改 |
| `ROLE_IN_USE` | 409 | 角色已被用户使用，无法删除 |
| `USER_NOT_FOUND` | 404 | 用户不存在 |