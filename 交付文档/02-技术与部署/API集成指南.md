# SecMind AI安全运营平台 API集成指南

**文档版本**: v2.3.0  
**密级**: 客户内部公开  
**适用对象**: 集成开发工程师、安全团队技术负责人、第三方系统对接方

---

## 1. API概述

### 1.1 设计风格

SecMind API 遵循 **RESTful** 设计规范，使用标准 HTTP 方法（GET/POST/PUT/PATCH/DELETE）对资源进行操作。所有请求和响应均使用 **JSON** 格式进行序列化。

| 方法 | 用途 | 幂等性 |
|------|------|--------|
| GET | 查询资源列表或详情 | 是 |
| POST | 创建资源或触发操作 | 否 |
| PUT | 全量更新资源 | 是 |
| PATCH | 部分更新资源 | 是 |
| DELETE | 删除资源 | 是 |

### 1.2 Base URL

所有 API 请求的基准地址为：

```
https://<your-secmind-instance>/api/v1
```

- **SaaS 版**: `https://api.secmind.ai/api/v1`
- **私有化部署版**: `https://<custom-domain>/api/v1`

### 1.3 认证方式

所有 API 请求（健康检查等公开接口除外）必须在 HTTP Header 中携带 Bearer Token：

```
Authorization: Bearer <your-api-key>
```

### 1.4 响应格式

所有 API 响应遵循统一的 JSON 结构：

**成功响应：**
```json
{
    "success": true,
    "data": { ... },
    "pagination": {
        "page": 1,
        "page_size": 20,
        "total": 156,
        "total_pages": 8
    },
    "request_id": "req_abc123def456"
}
```

**错误响应：**
```json
{
    "success": false,
    "error": {
        "code": "ALERT_NOT_FOUND",
        "message": "告警记录不存在",
        "details": {
            "alert_id": "alert_123"
        }
    },
    "request_id": "req_abc123def456"
}
```

### 1.5 HTTP 状态码说明

| 状态码 | 含义 | 说明 |
|--------|------|------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 204 | No Content | 删除/更新成功（无返回体） |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 认证失败（API Key无效或过期） |
| 403 | Forbidden | 权限不足 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如重复创建） |
| 422 | Unprocessable Entity | 请求体格式错误 |
| 429 | Too Many Requests | 超过速率限制 |
| 500 | Internal Server Error | 服务器内部错误 |
| 502 | Bad Gateway | 上游服务异常（如AI模型） |
| 503 | Service Unavailable | 服务暂时不可用 |

---

## 2. 认证与授权

### 2.1 API Key 生成

API Key 可通过以下方式生成：

1. **平台管理后台**: 登录 SecMind 平台 -> 系统设置 -> API集成 -> 创建API Key
2. **API接口**: 调用系统管理API创建

API Key 的格式为：

```
sk_sec_<32位随机十六进制字符串>
```

示例：`sk_sec_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6`

### 2.2 API Key 权限范围

每个 API Key 可以绑定到特定的权限范围，实现最小权限原则：

| 权限范围 | 说明 | 包含权限 |
|---------|------|---------|
| `alerts:read` | 告警只读 | 查看告警列表、详情 |
| `alerts:write` | 告警读写 | 创建、更新、删除告警 |
| `ai:read` | AI分析只读 | 查看分析结果 |
| `ai:write` | AI分析读写 | 触发AI分析 |
| `cases:read` | 案件只读 | 查看案件 |
| `cases:write` | 案件读写 | 创建、处置案件 |
| `response:write` | 处置操作 | 执行阻断、隔离等处置 |
| `threat_intel:read` | 威胁情报只读 | 查询威胁情报 |
| `reports:read` | 报表只读 | 查看和导出报表 |
| `admin:read` | 系统管理只读 | 查看配置查看 |
| `admin:write` | 系统管理读写 | 修改配置、管理用户 |

**预定义角色权限组合：**

| 角色 | API Key 权限范围 |
  | --- |
  | `alerts:read`, `alerts:write`, `ai:read` |
  | `cases:read`, `cases:write`, `response:write` |
| **系统管理员** | 全部权限 |

### 2.3 API Key 生命周期管理

| 操作 | 说明 | 注意 |
|------|------|------|
| 创建 | 生成新的 API Key | 创建后只显示一次密钥值 |
| 查看元信息 | 查看Key名称、权限、最后使用时间 | 不显示密钥本身 |
| 禁用 | 临时停用，可恢复 | 禁用后立即生效 |
| 启用 | 恢复已禁用的Key | |
| 删除 | 永久移除 | 不可恢复 |
| 轮换 | 生成新Key同时失效旧Key | 建议90天轮换一次 |

### 2.4 多租户上下文

对于多租户部署，API Key 自动绑定到创建时所属的租户。在API调用中可通过 Header 指定上下文：

```
X-Tenant-ID: tenant_abc123
```

仅系统管理员 API Key 可切换租户上下文。

---

## 3. API速率限制说明

### 3.1 限制策略

| 版本 | 基础速率 | 突发速率 | AI模型调用限制 | 说明 |
|------|---------|---------|---------------|------|
| **免费版** | 60次/分钟 | 100次/分钟 | 10次/小时 | 适用于 POC 测试 |
| **专业版** | 300次/分钟 | 500次/分钟 | 100次/小时 | 适用于中小企业 |
| **企业版** | 2000次/分钟 | 5000次/分钟 | 1000次/小时 | 适用于大型企业，支持定制扩容 |

### 3.2 速率限制 Header

每次 API 响应的 Header 中会包含当前速率限制信息：

```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 287
X-RateLimit-Reset: 1704067200
```

| Header | 说明 |
|--------|------|
| `X-RateLimit-Limit` | 时间窗口内允许的最大请求数 |
| `X-RateLimit-Remaining` | 当前时间窗口剩余请求数 |
| `X-RateLimit-Reset` | 时间窗口重置的 Unix 时间戳 |

### 3.3 触发限制时的响应

当超过速率限制时，API 返回 HTTP 429：

```json
{
    "success": false,
    "error": {
        "code": "RATE_LIMIT_EXCEEDED",
        "message": "请求频率超限，请在 45 秒后重试",
        "details": {
            "retry_after": 45,
            "limit": 300,
            "window_seconds": 60
        }
    },
    "request_id": "req_abc123def456"
}
```

### 3.4 速率限制优化建议

- 对告警查询等频繁调用的接口实现本地缓存，设置合理的 TTL（建议30-60秒）
- 批量操作使用批量接口而非循环单条调用
- 在遇到 429 错误时，使用 `Retry-After` Header 或响应体中的 `retry_after` 字段进行指数退避重试
- WebSocket 长连接不受速率限制影响，建议实时场景优先使用 WebSocket

---

## 4. 核心API分类说明

### 4.1 告警API (Alerts)

告警API是SecMind平台的核心数据入口，负责安全告警的接收、查询和管理。

**基础路径**: `/api/v1/alerts`

| 端点 | 用途 | 说明 |
|------|------|------|
| `GET /alerts` | 查询告警列表 | 支持多维度筛选（时间范围、严重等级、告警类型、来源、处置状态等），支持分页和排序 |
| `GET /alerts/{alert_id}` | 查询告警详情 | 返回告警的完整信息、关联证据、原始日志、处置记录等完整上下文 |
| `POST /alerts` | 创建告警 | 第三方系统向SecMind推送告警，支持单条和批量创建 |
| `PUT /alerts/{alert_id}` | 更新告警 | 全量更新告警字段 |
| `PATCH /alerts/{alert_id}` | 部分更新告警 | 更新告警指定字段（如状态、严重等级、标签） |
| `DELETE /alerts/{alert_id}` | 删除告警 | 逻辑删除，支持批量删除 |
| `POST /alerts/batch` | 批量导入告警 | 单次最多1000条，支持异步处理 |
| `GET /alerts/stats` | 告警统计概览 | 按时间维度的告警数量分布、严重级别分布、TOP告警类型等 |
| `POST /alerts/{alert_id}/enrich` | 告警富化触发 | 触发对指定告警的威胁情报富化、AI分析 |

**关键查询参数（告警列表）：**

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `page` | int | 页码，默认1 | `page=1` |
| `page_size` | int | 每页条数，默认20，最大100 | `page_size=50` |
| `severity` | str | 严重等级筛选 | `severity=critical,high` |
| `status` | str | 处置状态筛选 | `status=new,in_progress` |
| `alert_type` | str | 告警类型筛选 | `alert_type=malware` |
| `source` | str | 告警来源筛选 | `source=siem,syslog` |
| `time_from` | datetime | 开始时间 | `time_from=2025-01-01T00:00:00Z` |
| `time_to` | datetime | 结束时间 | `time_to=2025-01-02T00:00:00Z` |
| `tenant_id` | uuid | 租户ID（管理员可用） | `tenant_id=...` |
| `q` | str | 全文搜索（告警标题、描述） | `q=ransomware` |
| `sort_by` | str | 排序字段 | `sort_by=created_at` |
| `sort_order` | str | 排序方向 | `sort_order=desc` |

### 4.2 AI分析API (AI Analysis)

AI分析API提供对告警和案件的人工智能分析能力，支持多种大语言模型。

**基础路径**: `/api/v1/ai`

| 端点 | 用途 | 说明 |
|------|------|------|
| `GET /ai/models` | 查询可用AI模型 | 返回当前可用的AI模型列表及其状态（GPT-4o/Claude/DeepSeek/通义千问） |
| `POST /ai/analyze/alert` | AI分析单条告警 | 对指定告警进行智能分析，生成分析报告（包含根因分析、影响评估、处置建议） |
| `POST /ai/analyze/batch` | AI批量分析告警 | 对多条告警进行批量分析，返回分析结果列表，异步处理 |
| `POST /ai/analyze/case` | AI分析案件 | 对指定案件进行综合分析，生成案件时间线、关联告警汇总、处置建议 |
| `POST /ai/chat` | AI安全助手对话 | 基于上下文的安全知识问答，可携带告警/案件上下文 |
| `GET /ai/analysis/{analysis_id}` | 查询分析结果 | 根据分析任务ID获取分析结果（异步任务轮询用） |
| `GET /ai/analysis/history` | 查询分析历史 | 查看AI分析历史记录，支持按时间、模型、分析类型筛选 |
| `POST /ai/settings` | 查询AI配置 | 查看当前AI模型的参数配置（模型选择、超时、温度等） |

**分析类型说明：**

| 分析类型 | 输入 | 输出 | 典型耗时 |
|---------|------|------|---------|
| 告警分析 | 告警ID + 上下文（原始日志、关联告警） | 分析报告（根因、影响、建议、置信度） | 5-15秒 |
| 批量分析 | 告警ID列表（最多20条） | 分析结果列表 | 15-60秒 |
| 案件分析 | 案件ID + 关联告警集合 | 综合分析报告（时间线、关联图、建议） | 10-30秒 |
| 安全问答 | 用户问题 + 可选上下文 | AI回答 | 3-10秒 |

### 4.3 案件API (Incident/Case Management)

案件API用于安全事件的关联分析、调查取证和全生命周期管理。

**基础路径**: `/api/v1/cases`

| 端点 | 用途 | 说明 |
|------|------|------|
| `GET /cases` | 查询案件列表 | 按状态、优先级、负责人、时间范围等条件筛选 |
| `GET /cases/{case_id}` | 查询案件详情 | 返回案件基本信息、关联告警列表、处置记录、时间线等 |
| `POST /cases` | 创建案件 | 将一条或多条告警归并为案件 |
| `PUT /cases/{case_id}` | 更新案件信息 | 更新案件标题、描述、优先级、状态等 |
| `PATCH /cases/{case_id}/status` | 更新案件状态 | 状态流转：新建->调查中->处置中->已关闭 |
| `PATCH /cases/{case_id}/assign` | 分配案件负责人 | 将案件分配给指定分析师 |
| `POST /cases/{case_id}/merge` | 合并案件 | 将多个案件合并为一个案件 |
| `POST /cases/{case_id}/split` | 拆分案件 | 从案件中将指定告警拆分为新案件 |
| `POST /cases/{case_id}/alerts` | 关联告警 | 为案件关联新的告警 |
| `DELETE /cases/{case_id}/alerts/{alert_id}` | 移除关联告警 | 从案件中移除指定告警 |
| `GET /cases/{case_id}/timeline` | 查询案件时间线 | 案件处理过程的完整时间线记录 |
| `GET /cases/stats` | 案件统计 | 案件数量分布、MTTR（平均处置时间）、结案率 |
| `POST /cases/{case_id}/notes` | 添加案件备注 | 添加调查笔记或评论 |

**案件状态流转：**

```
                    +-----------+
                    |  新建     |
                    +-----+-----+
                          |
                          v
                    +-----------+
          +-------->| 调查中     |<---------+
          |         +-----+-------+-----+
          |         |           |
          |         v           v
          |   +-----------+  +-----------+
          |   |  处置中    |  |  待确认   |
          |   +-----+-----+  +-----+-----+
          |         |               |
          |         v               v
          |   +-----------+  +-----------+
          |   |  已关闭    |  |  已归档   |
          |   +-----------+  +-----+-----+
          |         |               |
          +---------+---------------+
```

### 4.4 处置API (Response Actions)

处置API提供自动化和手动化的安全处置能力，支持对威胁进行快速响应。

**基础路径**: `/api/v1/response`

| 端点 | 用途 | 说明 |
|------|------|------|
| `GET /response/actions` | 查询可用处置动作 | 返回当前环境可用的处置动作列表（端点隔离、IP封禁、进程终止等） |
| `POST /response/execute` | 执行处置动作 | 对指定目标执行处置操作（如隔离主机、封禁IP） |
| `POST /response/execute/batch` | 批量执行处置 | 对多个目标执行同类处置操作 |
| `GET /response/tasks` | 查询处置任务列表 | 查看处置任务的执行状态和历史 |
| `GET /response/tasks/{task_id}` | 查询处置任务详情 | 查看单个处置任务的执行结果、详情、日志 |
| `POST /response/playbooks` | 创建处置剧本 | 创建自动化处置剧本，定义触发条件和执行动作序列 |
| `GET /response/playbooks` | 查询处置剧本列表 | 查看已配置的自动化处置剧本 |
| `PATCH /response/playbooks/{playbook_id}` | 更新处置剧本 | 修改自动处置规则 |
| `POST /response/playbooks/{playbook_id}/trigger` | 手动触发剧本 | 对指定告警/案件手动触发处置剧本 |

**处置动作类型：**

| 动作类型 | 描述 | 支持平台 | 可逆性 |
|---------|------|---------|--------|
| `host_isolation` | 主机隔离 | 所有EDR平台 | 可逆 |
| `ip_block` | IP封禁 | 防火墙/WAF | 可逆 |
| `domain_block` | 域名封禁 | DNS/WAF | 可逆 |
| `process_kill` | 终止进程 | EDR | 不可逆 |
| `file_quarantine` | 文件隔离 | EDR | 可逆 |
| `user_lock` | 锁定用户账号锁定 | IAM/AD | 可逆 |
| `session_terminate` | 会话终止 | VPN/IAM | 不可逆 |
| `email_quarantine` | 邮件隔离 | 邮件网关 | 可逆 |
| `notify` | 发送通知 | - | - |

###4.5 威胁情报API (Threat Intelligence)

威胁情报API提供IOC查询、情报订阅和信誉评估服务。

**基础路径**: `/api/v1/threat-intel`

| 端点 | 用途 | 说明 |
|------|------|------|
| `POST /threat-intel/ioc/query` | 查询IOC情报 | 批量查询IP、域名、Hash、URL等IOC的信誉信息 |
| `GET /threat-intel/ioc/{ioc_type}/{ioc_value}` | 查询单个IOC详情 | 查询特定IOC的详细信息、关联事件、历史记录 |
| `POST /threat-intel/ioc/batch` | 批量导入自定义IOC | 上传内部威胁情报指标到平台 |
| `GET /threat-intel/feeds` | 查询情报源列表 | 查看所有已接入的外部威胁情报源及状态 |
| `POST /threat-intel/feeds/subscribe` | 订阅情报源 | 订阅指定的外部威胁情报源 |
| `DELETE /threat-intel/feeds/{feed_id}` | 取消订阅情报源 | 停止接收指定情报源的数据 |
| `GET /threat-intel/indicators` | 查询情报指标列表 | 查看所有活跃的威胁情报指标 |
| `GET /threat-intel/stats` | 威胁情报统计 | 情报数量、类型分布、更新频率等统计 |
| `POST /threat-intel/enrich` | 告警情报富化 | 对告警中的IOC自动进行威胁情报关联富化 |

**IOC查询类型：**

| IOC类型 | 参数值 | 示例 |
|---------|--------|------|
| IP地址 | `ip` | `8.8.8.8` |
| 域名 | `domain` | `example.com` |
| URL | `url` | `https://example.com/payload` |
| MD5 | `hash_md5` | `d41d8cd98f00b204e9800998ecf8427e` |
| SHA1 | -`hash_sha1` | `da39a3ee5e6b4b0d3255bfef95601890afd80709` |
| SHA256 | `hash_sha256` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852bc5c650` |
| 邮箱 | `email` | `attacker@example.com` |
| 注册表键 | `registry_key` | `HKEY_LOCAL_MACHINE\SOFTWARE\Malware` |

### 4.6 报表API (Reports)

报表API支持安全数据的统计分析和报告导出。

**基础路径**: `/api/v1/reports`

| 端点 | 用途 | 说明 |
|------|------|------|
| `GET /reports/templates` | 查询报表模板列表 | 返回所有可用的报表模板 |
| `GET /reports/templates/{template_id}` | 查询模板详情 | 查看报表模板的配置详情 |
| `POST /reports/generate` | 生成报表 | 根据模板和数据范围生成报表（支持PDF/CSV/Excel/JSON格式） |
| `GET /reports/list` | 查询已生成报表列表 | 查看历史生成的报表记录 |
| `GET /reports/{report_id}` | 获取报表文件 | 下载已生成的报表文件 |
| `DELETE /reports/{report_id}` | 删除报表 | 删除指定报表 |
| `POST /reports/schedule` | 创建定时报表 | 配置定期自动生成报表（每日/每周/每月） |
| `PATCH /reports/schedule/{schedule_id}` | 更新定时报表配置 | 修改报表调度配置 |
| `DELETE /reports/schedule/{schedule_id}` | 删除定时报表 | 取消定时报表任务 |

**报表类型：**

| 报表类型 | 内容 | 适用对象 |
|---------|------|---------|
| 安全态势日报 | 每日告警统计、TOP威胁、处置概览 | 安全运营团队 |
| 案件分析周报 | 案件统计、MTTR、处置效果分析 | 安全团队负责人 |
| 威胁情报月报 | 威胁趋势、IOC统计、行业对比 | CISO/安全总监 |
| 合规审计报告 | 告警审计、权限审计、操作记录 | 合规/审计部门 |
| AI效能报告 | AI分析覆盖率、准确率、处理效率 | 技术负责人 |
| 租户使用报告 | 各租户告警量、处置情况（MSP场景） | 服务提供商 |

### 4.7 系统管理API (System Admin)

系统管理API提供用户、租户、配置、审计等管理功能。

**基础路径**: `/api/v1/admin`

| 端点 | 用途 | 说明 |
|------|------|------|
| `GET /admin/users` | 查询用户列表 | 平台用户管理列表 |
| `POST /admin/users` | 创建用户 | 创建新的平台用户 |
| `PATCH /admin/users/{user_id}` | 更新用户信息 | 修改用户角色、状态、权限 |
| `DELETE /admin/users/{user_id}` | 删除用户 | 删除指定用户 |
| `GET /admin/tenants` | 查询租户列表 | 多租户列表管理 |
| `POST /admin/tenants` | 创建租户 | 创建新租户 |
| `PATCH /admin/tenants/{tenant_id}` | 更新租户配置 | 修改租户配额、配置等 |
| `GET /admin/audit-logs` | 查询审计日志 | 操作审计日志查询与导出 |
| `GET /admin/integrations` | 查询集成配置 | 查看所有第三方集成配置列表 |
| `POST /admin/integrations` | 创建集成配置 | 配置新的第三方系统对接（SIEM/ITSM/邮件网关等） |
| `PATCH /admin/integrations/{integration_id}` | 更新集成配置 | 修改第三方系统对接配置 |
| `DELETE /admin/integrations/{integration_id}` | 删除集成配置 | 移除第三方系统对接 |
| `GET /admin/system-config` | 查询系统配置 | 查看系统全局配置 |
| `PATCH /admin/system-config` | 更新系统配置 | 修改系统全局配置（如速率限制、告警阈值等） |
| `POST /admin/api-keys` | 创建API Key | 为指定用户/角色生成API Key |
| `GET /admin/api-keys` | 查询API Key列表 | 查看所有API Key元信息 |
| `DELETE /admin/api-keys/{key_id}` | 删除API Key | 吊销指定API Key |
| `GET /admin/health` | 系统健康检查 | 检查各组件健康状态 |

---

## 5. WebSocket实时通知说明

### 5.1 连接方式

WebSocket 连接地址：

```
wss://<your-secmind-instance>/api/v1/ws/events
```

认证方式（二选一）：

1. **Header 方式**:
```
Authorization: Bearer <your-api-key>
```

2. **Query 参数方式**:
```
wss://<host>/api/v1/ws/events?token=<your-api-key>
```

### 5.2 事件类型

| 事件类型 | 说明 | 触发场景 |
|---------|------|---------|
| `alert.new` | 新告警通知 | 收到新的安全告警时推送 |
| `alert.updated` | 告警状态变更 | 告警被查看、标记、处置时推送 |
| `case.new` | 新案件通知 | 告警归并创建新案件时推送 |
| `case.updated` | 案件状态变更 | 案件状态变更、负责人变更、处置完成时推送 |
| `ai.analysis.complete` | AI分析完成通知 | AI分析任务异步完成时推送 |
| `response.task.completed` | 处置任务完成通知 | 自动/manual处置任务执行完成时推送 |
| `threat_intel.update` | 威胁情报更新 | 威胁情报库更新时推送 |
| `system.alert` | 系统告警通知 | 系统健康状态变化时推送（如磁盘空间不足） |

### 5.3 消息格式

```json
{
    "event": "alert.new",
    "timestamp": "2025-01-01T10:30:00.123Z",
    "tenant_id": "tenant_abc123",
    "data": {
        "alert_id": "alert_xyz789",
        "title": "检测到可疑横向移动行为",
        "severity": "high",
        "source": "edr",
        "summary": {
            "affected_host": "192.168.1.100",
            "indicator_count": 3
        }
    }
}
```

### 5.4 心跳机制

- 服务端每 **30秒** 发送一次心跳消息：`{"event": "ping", "timestamp": "..."}`
- 客户端应在收到 ping 后回复：`{"event": "pong"}`
- 如果超过 **60秒** 未收到客户端响应，服务端将主动断开连接
- 建议客户端实现自动重连机制，断线后间隔 **1s/5s/30s** 指数退避重连

---

## 6. 集成最佳实践

### 6.1 重试策略

对于API调用失败，建议采用**指数退避**重试策略：

```python
# 推荐的重试策略伪代码
max_retries = 3
base_delay = 1.0  # 秒
max_delay = 30.0  # 秒

def call_secmind_api(request_func):
    last_error = None
    for attempt in range(max_retries + 1):
        try:
            response = request_func()
            if response.status_code == 429:
                # 速率限制，使用 Retry-After
                retry_after = int(response.headers.get('Retry-After', 10))
                time.sleep(retry_after)
                continue
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            last_error = "timeout"
            delay = min(base_delay * (2 ** attempt), max_delay)
            time.sleep(delay)
        except requests.exceptions.ConnectionError:
            last_error = "connection"
            delay = min(base_delay * (2 ** attempt), max_delay)
            time.sleep(delay)
        except requests.exceptions.HTTPError as e:
            if e.response.status_code in [500, 502, 503]:
                # 服务端错误，可重试
                delay = min(base_delay * (2 ** attempt), max_delay)
                time.sleep(delay)
            else:
                # 客户端错误（4xx），不重试
                raise
    raise Exception(f"API调用失败，{max_retries}次重试后仍失败: {last_error}")
```

**重试建议矩阵：**

| HTTP 状态码 | 是否重试 | 说明 |
|------------|---------|------|
| 401 Unauthorized | 否 | 检查API Key是否有效 |
| 403 Forbidden | 否 | 检查权限范围 |
| 404 Not Found | 否 | 检查资源ID是否正确 |
| 409 Conflict | 否 | 检查业务逻辑 |
| 422 格式化错误 | 否 | 检查请求体 |
| 429 Too Many Requests | 是 | 按Retry-After等待 |
| 500 Internal Server Error | 是（最多3次） | 指数退避 |
| 502 Bad Gateway | 是（最多3次） | AI模型服务异常 |
| 503 Service Unavailable | 是（最多3次） | 指数退避 |

### 6.2 错误处理

```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "人类可读的错误描述",
        "details": {
            "field": "具体字段的错误信息"
        }
    },
    "request_id": "req_abc123"
}
```

**全局错误码说明：**

| 错误码 | HTTP状态码 | 说明 | 处理建议 |
|-------|-----------|------|---------|
| `UNAUTHORIZED` | 401 | API Key无效或过期 | 检查API Key是否正确设置 Authorization Header |
| `FORBIDDEN` | 403 | 权限不足 | 当前API Key无该操作的权限 |
| `NOT_FOUND` | 404 | 请求的资源不存在 | 检查资源ID |
| 检查资源ID是否正确 |
| `VALIDATION_ERROR` | 422 | 请求参数验证失败 | 根据 `details` 字段修正请求参数 |
| `RATE_LIMIT_EXCEEDED` | 429 | 超过速率限制 | 按 `retry_after` 等待后重试 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 | 重试，若持续失败请联系支持 |
| `AI_SERVICE_ERROR` | 502 | AI模型服务异常 | 重试，检查模型API连通性和配额 |
| `TOO_LARGE` | 413 | 请求体过大 | 减少批量操作的数据量 |
| `CONFLICT` | 409 | 资源冲突 | 检查是否重复创建 |

### 6.3 批量操作

为提高API调用效率，建议使用批量接口替代循环单条调用：

| 场景 | 不推荐的做法 | 推荐的做法 | 性能提升 |
|------|-------------|-----------|---------|
| 导入100条告警 | 100次 `POST /alerts` | 1次 `POST /alerts/batch` | ~50倍 |
| 查询20个IOC | 20次 IOC查询 | 1次 `POST /threat-intel/ioc/query` | ~15倍 |
| AI分析10条告警 | 10次 `POST /ai/analyze/alert` | 1次 `POST /ai/analyze/batch` | ~8倍 |
| 批量处置 | 多条`POST /response/execute` | 1次 `POST /response/execute/batch` | ~20倍 |

**批量请求注意：**
- 单次批量导入告警上限为 **1000条**
- 单次批量AI分析上限为 **20条**
- 批量操作建议在非高峰期执行
- 大批量数据导入时，建议使用异步模式并轮询执行状态

### 6.4 分页处理

对于列表类API，始终使用分页参数获取数据：

```python
# 分页获取所有告警的推荐方式
def fetch_all_alerts(api_key, base_url):
    all_alerts = []
    page = 1
    page_size = 100  # 使用最大page_size减少请求次数

    while True:
        response = requests.get(
            f"{base_url}/alerts",
            headers={"Authorization": f"Bearer {api_key}"},
            params={"page": page,
                "page_size": page_size,
                "sort_by": "created_at",
                "sort_order": "asc"
            }
        )
        data = response.json()
        all_alerts.extend(data["data"])

        if page >= data["pagination"]["total_pages"]:
            break
        page += 1

    return all_alerts
```

### 6.5 异步任务处理

对于耗时较长的操作（如AI批量分析、批量导入），API会返回任务ID，客户端需轮询任务状态：

```python
# 异步任务轮询模式
def submit_and_wait(api_key, base_url, endpoint, payload, poll_interval=5):
    # 1. 提交任务
    response = requests.post(
        f"{base_url}{endpoint}",
        headers={"Authorization": f"Bearer {api_key}"},
        json=payload
    )
    task_id = response.json()["data"]["task_id"]

    # 2. 轮询任务状态
    max_polls = 120  # 最多等待10分钟
    for _ in range(max_polls):
        status_response = requests.get(
            f"{base_url}/tasks/{task_id}",
            headers={"Authorization": f"Bearer {api_key}"}
        )
        task_data = status_response.json()["data"]
        status = task_data["status"]

        if status == "completed":
            return task_data["result"]
        elif status == "failed":
            raise Exception(f"任务失败: {task_data.get('error')}")

        time.sleep(poll_interval)

    raise Exception("任务超时")
```

---

## 7. 集成示例场景

### 7.1 与SIEM系统集成

#### 场景说明
将企业现有SIEM（如Splunk、ELK、ArcSight）的安全告警实时发送到SecMind平台，利用AI分析能力进行智能研判。

#### 架构示意

```
+-------------+         +-------------+         +--------------+
|   SIEM      |  Webhook|  SecMind    |         |  SecMind     |
| (Splunk等)  +-------->+  API        +-------->+  WebSocket   |
|             |  POST   |  /alerts    |         |  事件推送    |  (可选)
+-------------+         +------+------+         +--------------+
                               |
                               v
                        +------+------+
                        |  AI分析引擎  |
                        |  自动研判     |
                        +------+------+
                               |
                               v
                        +------+------+
                        |  处置响应    |
                        |  自动/手动   |
                        +-------|------+
```

#### 集成步骤

1. **在SecMind平台创建集成配置**
   - 进入 系统管理 -> 数据集成 -> 新建集成选择"SIEM集成"，获取Webhook URL

2. **在SIEM端配置Webhook转发**
  - Splunk: 使用 Alert Webhook 功能
  - ELK: 使用 Watcher Webhook Action
  - 配置告警数据映射字段

3. **数据映射建议**
  SIEM原始字段 -> SecMind告警字段：

  | SIEM字段 | SecMind字段 | 说明 |
  |---------|-------------|------|
  | event_id | source_id | 原始告警ID |
  | title/name | title | 告警标题 |
  | severity | severity | 严重等级映射 |
  | src_ip | source_ip | 源IP |
  | dst_ip | target_ip | 目标IP |
  | raw_message | raw_data | 原始告警 |
  | timestamp | occurred_at | 发生时间 |

4. **严重等级映射**
  ```
  SIEM: Critical     -> SecMind: critical
  SIEM: High         -> SecMind: high
  SIEM: Medium/Info  -> SecMind: medium
  SIEM: Low/Warning  -> SecMind: low
  SIEM: Info         -> SecMind: info
  ```

5. **验证集成**
  在SIEM端触发测试告警，确认SecMind平台成功接收

### 7.2 与ITSM系统集成

#### 场景说明
将SecMind平台生成的案件自动同步到ITSM系统（如ServiceNow、Jira Service Management），实现SOC与IT运维的工单联动。

#### 架构示意

```
+-------------+         +-------------+         +-------------+
|  SecMind    |  POST   |  SecMind    |         |  ITSM       |
|  案件创建   +-------->+  API        +-------->+ (ServiceNow  |
|             |         |             |  Webhook | 等)          |
+------+------+         +------+------+         +------+------+
       |                        |                       |
       |   WebSocket            |                       |
       +  案件状态变更推送       +  工单状态回写         +
```

#### 集成步骤

1. **在ITSM系统中创建Webhook接收端**
  ServiceNow: REST API Endpoint
  Jira: Webhook Connector

2. **配置SecMind案件同步规则**

3. **双向同步字段映射**

  | SecMind案件字段 | ITSM工单字段 | 同步方向 |
  |----------------|-------------|---------|
  | case.id | 工单编号 | SecMind -> ITSM |
  | case.title | 工单标题 | SecMind -> ITSM |
  | case.severity | 工单优先级 |  | 双向 |
  | case.status | 工单状态 | 双向 |
  | case.assignee | 负责人 | 双向 |
  | case.description | 描述 | SecMind -> ITSM |
  | case.alert_count | 关联告警数 | SecMind -> ITSM |
  | case.resolution | 解决方案 | ITSM -> SecMind |

4. **状态同步规则**
  ```
  SecMind: 新建       -> ITSM: 新建
  SecMind: 调查中     -> ITSM: 处理中
  SecMind: 处置中     -> ITSM: 处理中
  SecMind: 待确认     -> ITSM: 待确认
  SecMind: 已关闭     -> ITSM: 已解决
  SecMind: 已归档     -> ITSM: 已关闭
  ITSM: 已解决        -> SecMind: 待确认
  ```

### 7.3 与邮件网关集成

#### 场景说明
将邮件安全网关（如Proofpoint、Mimecast、奇安信邮件网关）检测到的钓鱼邮件、恶意邮件等告警接入SecMind，进行统一分析和处置。

#### 架构示意

```
+---------------+         +--------------+         +--------------+
| 邮件安全网关   |  Webhook|  SecMind     |         |  SecMind     |
| (Proofpoint   +-------->+  API         +-------->|  AI分析      |
|  等)          |  POST   |  /alerts     |         |  邮件关联分析 |
+-------+-------+         +------+-------+         +-------+------+
        |                        |                         |
        |  检测到钓鱼邮件         |  自动创建告警            |  分析师研判
        |                        |                         |
        +------------------------+-------------------------+
                                 |
                                 v
                          +------+-------+
                          |  自动处置      |
                          |  隔离邮件、删除 |
                          +--------------+
```

#### 集成步骤

1. **在邮件网关配置自动转发**
  配置邮件网关将检测到的恶意邮件信息转发到SecMind Webhook

2. **配置自动处置动作**
  - 高置信度钓鱼邮件：自动隔离
  - 可疑邮件：自动创建案件等待分析师确认

3. **关键数据字段**
  ```json
  {
      "alert_type": "phishing",
      "title": "检测到鱼叉式钓鱼邮件",
      "severity": "high",
      "source": "email_gateway",
      "source_ip": "192.0.2.1",
      "indicators": [
          {"type": "email", "value": "attacker@evil.com"},
          {"type": "url", "value": "https://evil.com/phishing"},
          {"type": "domain", "value": "evil.com"}
      ],
      "raw_data": {
          "email_from": "attacker@evil.com",
          "email_to": "victim@company.com",
          "subject": "紧急：密码过期通知",
          "attachment_name": "invoice.pdf.exe",
          "attachment_hash": "e3b0c44298fc1c149afbf4c8996fb924..."
      }
  }
  ```

---

## 附录A: API 修订历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v2.3.0 | 2025-01 | 新增AI批量分析接口、案件合并拆分、WebSocket事件类型扩展 |
| v2.2.0 | 2024-10 | 新增威胁情报批量查询、定时报表、处置剧本 |
| v2.1.0 | 2024-06 | 新增WebSocket实时通知、案件时间线、AI对话 |
| v2.0.0 | 2024-01 | API正式发布，RESTful重构 |