# 权限管理 (RBAC)

## 功能概述

RBAC（基于角色的访问控制）是 SecMind v3.0 的核心安全机制，通过 **角色-权限** 的映射关系实现细粒度的访问控制。

**核心价值：** 遵循最小权限原则，确保每个用户仅拥有完成工作所必需的权限，最大程度保障数据安全。

## 角色体系

### 4 个系统角色

| 角色 | 权限范围 | 适用人员 |
|------|----------|----------|
| `admin` | 全部权限 (`*:*`) | 系统管理员 |
| `analyst` | 13 项权限（告警读写、处置执行、狩猎等） | 安全分析师 |
| `viewer` | 7 项只读权限 | 审计 / 管理层 |
| `soc_manager` | 17 项权限（含审批处置、用户查看） | SOC 主管 |

### 权限矩阵

系统共划分为 22 个资源模块，每个模块包含读（read）和写（write）两种操作，共计 44 个细粒度权限：

| 模块 | 读权限 | 写权限 | 说明 |
|------|--------|--------|------|
| `alert` | analyst / viewer / soc_manager | analyst / soc_manager | 告警管理 |
| `response` | analyst / viewer / soc_manager | analyst / soc_manager | 处置响应 |
| `hunting` | analyst / viewer / soc_manager | analyst / soc_manager | 威胁狩猎 |
| `dashboard` | analyst / viewer / soc_manager | — | 仪表盘 |
| `report` | analyst / viewer / soc_manager | analyst / soc_manager | 报告 |
| `playbook` | analyst / viewer / soc_manager | analyst / soc_manager | 剧本 |
| `user` | soc_manager / admin | admin | 用户管理 |
| `system` | admin | admin | 系统设置 |
| `integration` | admin | admin | 集成管理 |
| `compliance` | analyst / viewer / soc_manager | soc_manager / admin | 合规 |
| `ai` | analyst / viewer / soc_manager | analyst / soc_manager | AI 分析 |
| `asset` | analyst / viewer / soc_manager | analyst / soc_manager | 资产管理 |
| `log` | analyst / viewer / soc_manager | — | 日志查看 |
| `rule` | analyst / viewer / soc_manager | analyst / soc_manager | 检测规则 |
| `notification` | analyst / viewer / soc_manager | analyst / soc_manager | 通知配置 |
| `threat_intel` | analyst / viewer / soc_manager | analyst / soc_manager | 威胁情报 |
| `case` | analyst / viewer / soc_manager | analyst / soc_manager | 案件管理 |
| `sla` | soc_manager / admin | soc_manager / admin | SLA 配置 |
| `audit` | soc_manager / admin | — | 审计日志 |
| `backup` | admin | admin | 备份恢复 |
| `license` | admin | admin | 许可证管理 |
| `custom_field` | analyst / soc_manager | analyst / soc_manager | 自定义字段 |

## 使用方式

### 管理员

1. 进入 **设置 → 权限管理**
2. 查看完整的权限矩阵，了解各角色的权限配置
3. 创建自定义角色或编辑已有角色的权限集合
4. 为用户分配角色，支持单个用户多角色叠加
5. 权限变更即时生效，无需用户重新登录

### 普通用户

1. 在个人中心查看自己的权限清单
2. 无权限的操作按钮自动隐藏，避免误操作
3. 无权限的页面自动跳转至仪表盘，并提示无访问权限
4. 调用 API 时无权限操作将返回 `403 Forbidden`

## 技术实现

权限校验贯穿系统全链路，共分为四层：

| 层级 | 实现方式 | 说明 |
|------|----------|------|
| **中间件层** | 全局请求拦截 | 基于 JWT 解析用户身份，提取角色信息，附加到请求上下文 |
| **依赖注入层** | 路由级权限校验 | 通过 `@RequirePermission(module, action)` 装饰器声明路由所需权限，校验不通过时直接返回 403 |
| **前端层** | 路由守卫 + 按钮级控制 + 菜单动态渲染 | 路由守卫拦截未授权页面访问；按钮级指令根据权限动态控制显隐；菜单根据角色动态生成 |
| **缓存层** | Redis 缓存权限关系 | 用户权限数据缓存至 Redis，单次权限校验耗时 < 5ms，变更时自动失效重建 |

### 权限校验流程

```
请求 → 中间件解析 JWT → 获取用户 ID → 查询 Redis 缓存
  ├─ 缓存命中 → 校验权限 → 通过 / 拒绝
  └─ 缓存未命中 → 查询数据库 → 写入 Redis → 校验权限 → 通过 / 拒绝
```

## 最佳实践

- **最小权限原则：** 为用户分配完成工作所需的最小权限集合，避免过度授权
- **定期审计：** 每季度审查一次权限分配情况，清理冗余角色和过期权限
- **角色复用：** 优先使用系统内置角色，仅当业务需求无法满足时再创建自定义角色
- **敏感操作审批：** 对于删除、导出、修改系统配置等敏感操作，启用审批流程，由 soc_manager 或 admin 审批后执行
- **权限变更记录：** 所有权限变更操作均记录至审计日志，确保可追溯
- **多角色叠加：** 当用户拥有多个角色时，权限取并集，角色冲突时以高权限为准