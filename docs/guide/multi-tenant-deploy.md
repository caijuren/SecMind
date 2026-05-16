# 多租户部署指南

本文档介绍 SecMind v3.0 多租户架构的部署与配置。多租户支持允许单个 SecMind 实例同时服务多个组织，确保各租户之间的数据完全隔离。

## 概述

### 多租户架构说明

SecMind 采用 **共享数据库、行级隔离** 的多租户模型。所有租户共享同一个数据库实例，通过 PostgreSQL 的行级安全策略（Row-Level Security, RLS）实现数据隔离。应用层通过 JWT 中的 `tenant_id` 识别租户身份，中间件自动为每个请求设置租户上下文，确保数据访问始终限定在当前租户范围内。

核心设计原则：

- **数据隔离**：RLS 策略确保租户只能访问自己的数据
- **性能共享**：充分利用数据库资源，避免为每个租户单独部署实例
- **运维简化**：单实例部署，统一升级与监控
- **弹性扩展**：按需调整租户套餐配额，无需变更基础设施

### 适用场景

| 场景 | 说明 |
|------|------|
| MSP/MSSP | 安全服务提供商为多个客户管理安全运营，每个客户对应一个租户 |
| 多部门 | 企业内部不同安全团队独立运作，部门间数据相互隔离 |
| 集团子公司 | 集团总部统一部署安全平台，各子公司作为独立租户使用 |

## 部署架构

### 数据库层

| 项目 | 要求 |
|------|------|
| 数据库 | PostgreSQL 16+（必需） |
| 隔离机制 | Row-Level Security（RLS） |
| 数据模式 | 所有租户共享同一数据库，表结构相同 |
| 租户标识 | 每张数据表均包含 `tenant_id` 列 |

> **注意**：SQLite 不支持 RLS，无法用于多租户部署。生产环境必须使用 PostgreSQL 16 或更高版本。

RLS 策略示例：

```sql
-- 在每张业务表上启用 RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_hunts ENABLE ROW LEVEL SECURITY;

-- 创建租户隔离策略
CREATE POLICY tenant_isolation ON alerts
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY tenant_isolation ON playbooks
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY tenant_isolation ON threat_hunts
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);
```

### 应用层

SecMind 采用单实例部署，所有租户共享同一应用进程：

```
┌──────────────────────────────────────────────────────────┐
│                     负载均衡器                             │
│               tenant-a.secmind.com                       │
│               tenant-b.secmind.com                       │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────┼─────────────────────────────────┐
│                  API 网关 / 反向代理                       │
│    域名解析 → 路由 → JWT 校验 → 提取 tenant_id           │
└────────────────────────┼─────────────────────────────────┘
                         │
┌────────────────────────┼─────────────────────────────────┐
│                   SecMind 应用实例                        │
│  ┌──────────────────────────────────────────────────┐    │
│  │              租户上下文中间件                      │    │
│  │  从 JWT 提取 tenant_id → 设置 PostgreSQL 会话参数  │    │
│  └──────────────────────────────────────────────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 告警服务  │ │ 狩猎服务  │ │ 响应服务  │ │ AI 分析  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────┼─────────────────────────────────┐
│               PostgreSQL 16+（RLS 启用）                  │
│     ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│     │ tenant_a │ │ tenant_b │ │ tenant_c │              │
│     │  数据行   │ │  数据行   │ │  数据行   │              │
│     └──────────┘ └──────────┘ └──────────┘              │
└──────────────────────────────────────────────────────────┘
```

**请求处理流程**：

1. 用户通过租户专属域名发起请求
2. 反向代理将请求转发至 SecMind 应用实例
3. 中间件解析 JWT Token，提取 `tenant_id`
4. 中间件通过 `SET app.current_tenant_id = <tenant_id>` 设置数据库会话参数
5. RLS 策略自动应用，查询结果仅包含当前租户数据

### JWT Token 规范

JWT payload 必须包含以下字段：

```json
{
  "sub": "user_abc123",
  "tenant_id": 1,
  "role": "admin",
  "iat": 1718000000,
  "exp": 1718086400
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `sub` | string | 用户唯一标识 |
| `tenant_id` | integer | 租户 ID，必填字段 |
| `role` | string | 用户在租户内的角色 |

## 配置步骤

### 1. 启用 RLS

系统启动时自动执行 RLS 迁移。如需手动执行：

```bash
# 运行数据库迁移
alembic upgrade head

# 确认 RLS 策略已生效
psql -d secmind -c "\d+ alerts"
# 输出应包含: Policies: tenant_isolation FOR ALL TO PUBLIC USING ((tenant_id = current_setting('app.current_tenant_id'::text)))
```

迁移脚本会自动完成以下操作：

- 在所有业务表上添加 `tenant_id` 列
- 为每张表创建 RLS 策略
- 创建必要的数据库索引

### 2. 配置域名

每个租户使用独立的域名访问 SecMind。DNS 配置示例：

| 域名 | 解析目标 |
|------|----------|
| `tenant-a.secmind.com` | `10.0.1.1` |
| `tenant-b.secmind.com` | `10.0.1.1` |
| `tenant-c.secmind.com` | `10.0.1.1` |

Nginx 反向代理配置：

```nginx
server {
    listen 443 ssl;
    server_name ~^(?<tenant>.+)\.secmind\.com$;

    ssl_certificate     /etc/ssl/certs/secmind.crt;
    ssl_certificate_key /etc/ssl/private/secmind.key;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Tenant-ID $tenant;
    }
}
```

### 3. 配置 JWT

JWT 密钥配置在 `config.yaml` 中：

```yaml
auth:
  jwt_secret: "your-256-bit-secret"
  jwt_algorithm: "HS256"
  jwt_expiry_hours: 24

multi_tenant:
  enabled: true
  tenant_id_field: "tenant_id"
  header_name: "X-Tenant-ID"
```

Python 示例：生成携带 `tenant_id` 的 JWT：

```python
import jwt
from datetime import datetime, timedelta

payload = {
    "sub": user_id,
    "tenant_id": tenant.id,
    "role": user.role,
    "iat": datetime.utcnow(),
    "exp": datetime.utcnow() + timedelta(hours=24),
}

token = jwt.encode(payload, config.JWT_SECRET, algorithm="HS256")
```

## 套餐与配额

### 套餐配置

SecMind 内置四种套餐，在管理后台或配置文件中定义：

```yaml
plans:
  free:
    max_users: 5
    max_alerts_per_day: 100
    max_tokens_per_day: 100000
  starter:
    max_users: 20
    max_alerts_per_day: 1000
    max_tokens_per_day: 500000
  professional:
    max_users: 100
    max_alerts_per_day: 10000
    max_tokens_per_day: 5000000
  enterprise:
    max_users: -1        # 无限
    max_alerts_per_day: -1
    max_tokens_per_day: 50000000
```

| 套餐 | 用户数上限 | 告警数/天 | Token 数/天 |
|------|-----------|-----------|------------|
| Free | 5 | 100 | 100K |
| Starter | 20 | 1,000 | 500K |
| Professional | 100 | 10,000 | 5M |
| Enterprise | 无限 | 无限 | 50M |

### 配额强制

系统通过中间件自动强制执行配额限制：

**告警配额检查**：告警写入中间件检查当前租户当日告警数是否超限，超限时记录告警丢弃日志并返回错误。

**Token 配额检查**：AI 模型路由在每次 LLM 调用前检查当前租户 Token 消耗是否超限，超限时拒绝请求。

**超限响应**：

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 3600

{
  "error": "quota_exceeded",
  "message": "租户告警配额已用尽，请升级套餐或等待配额重置",
  "quota_type": "alerts_per_day",
  "limit": 1000,
  "reset_after_seconds": 3600
}
```

## 数据隔离验证

部署完成后，按以下步骤验证数据隔离是否正确生效：

### 测试步骤

1. **准备测试数据**

   以租户 A 身份登录，创建 5 条告警。以租户 B 身份登录，创建 3 条告警。

2. **验证 SQL 查询自动过滤**

   ```bash
   # 以租户 A 身份调用 API
   curl -H "Authorization: Bearer <tenant_a_token>" \
        https://tenant-a.secmind.com/api/v1/alerts | jq '. | length'
   # 预期输出: 5

   # 以租户 B 身份调用 API
   curl -H "Authorization: Bearer <tenant_b_token>" \
        https://tenant-b.secmind.com/api/v1/alerts | jq '. | length'
   # 预期输出: 3
   ```

3. **验证跨租户数据不可见**

   ```bash
   # 尝试以租户 A 的 Token 访问租户 B 的告警 ID
   curl -H "Authorization: Bearer <tenant_a_token>" \
        https://tenant-a.secmind.com/api/v1/alerts/<tenant_b_alert_id>
   # 预期输出: 404 Not Found（而非 403 或数据泄露）
   ```

4. **验证数据库层隔离**

   ```sql
   -- 直接连接数据库，模拟租户 A 的会话
   SET app.current_tenant_id = 1;
   SELECT COUNT(*) FROM alerts;
   -- 预期输出: 5

   -- 模拟租户 B 的会话
   SET app.current_tenant_id = 2;
   SELECT COUNT(*) FROM alerts;
   -- 预期输出: 3
   ```

### 验证清单

| 检查项 | 预期结果 | 状态 |
|--------|---------|------|
| 同租户数据完整可见 | 查询返回所属租户全部数据 | ✅ |
| 跨租户数据不可见 | 查询不返回其他租户数据 | ✅ |
| 直接 URL 访问隔离 | 跨租户 ID 查询返回 404 | ✅ |
| SQL 注入绕过 RLS | 无法通过 SQL 注入读取其他租户数据 | ✅ |
| 配额独立计算 | 各租户配额互不影响 | ✅ |

## 最佳实践

### 生产环境域名策略

- 每个租户使用独立域名，而非路径前缀（如 `/tenant-a/`），避免 Cookie 和 Token 泄露风险
- 使用泛域名 SSL 证书（Wildcard Certificate）简化证书管理
- 启用 HSTS 确保全链路 HTTPS

### CDN 缓存分离

```yaml
cdn:
  enabled: true
  cache_by_tenant: true
  cache_key_include:
    - host
    - uri
```

- 按 `Host` 头区分租户缓存，避免数据串混
- 静态资源（JS/CSS/图片）可共享缓存，动态 API 响应按租户隔离
- 配置 `Cache-Control: private` 确保敏感数据不被公共缓存代理存储

### 配额监控

- 配置 Prometheus 指标收集各租户配额使用率
- 设置告警阈值：使用率达 80% 时发送预警通知
- 每日自动生成配额使用报告，推送至租户管理员邮箱

### 定期审计

- 每月执行一次数据隔离审计，使用验证清单逐项检查
- 审查数据库日志，确认无跨租户查询记录
- 审计租户创建和权限变更操作，保留完整操作日志

### 租户生命周期管理

- **创建**：通过管理 API 创建租户，自动生成数据库隔离策略
- **暂停**：暂停租户时禁用其 API Token，但保留数据
- **删除**：删除租户前执行数据导出，确认后级联清除所有数据
- **迁移**：支持将租户数据导出为标准格式，迁移至独立实例

### 性能优化

- 在 `tenant_id` 列上建立索引，确保 RLS 过滤不产生全表扫描
- 定期 `VACUUM ANALYZE` 更新统计信息，帮助查询规划器生成高效计划
- 对高频访问的热点租户，可配置连接池预留专用连接