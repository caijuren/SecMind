# v2.x → v3.0 升级指南

## 升级概述

### v3.0 主要变更

v3.0 是一次重大版本升级，引入了多项核心能力：

- **多租户架构**：基于 PostgreSQL Row-Level Security（RLS）实现租户数据隔离，支持企业级多团队协作
- **AI 分析引擎重构**：从模拟数据切换为真实 LLM 推理，支持 OpenAI / Anthropic 等多供应商切换
- **实时协作能力**：引入 WebSocket 实现威胁狩猎、研判响应等场景的实时协同
- **性能优化**：新增数据库索引、查询优化，大幅提升 IOC 查询和告警检索速度
- **基础设施升级**：新增 Redis 依赖，用于会话管理、实时消息队列和缓存加速

### 升级前注意事项

- 升级过程涉及数据库迁移，**请务必在生产环境操作前进行完整备份**
- v3.0 **仅支持 PostgreSQL 14+**，不再支持 SQLite。请确保目标数据库版本符合要求
- 升级后需要额外配置 Redis 和 LLM API Key，服务才能正常运行
- 旧版 API 完全向后兼容，现有客户端无需修改即可继续使用

### 预计停机时间

根据数据量大小，预计停机时间为 **15-30 分钟**。其中主要耗时在数据库备份（5-10 分钟）和数据库迁移（5-15 分钟）。建议安排在业务低峰期进行操作。

## 前置检查

请逐项确认以下条件均已满足，再开始升级操作：

- [ ] **备份数据库** — 使用 `pg_dump` 完整备份当前数据库
- [ ] **备份配置文件** — 备份 `backend/.env` 及所有自定义配置文件
- [ ] **确认当前版本** — 当前版本必须为 v2.2.0 或更高版本。可通过 `git log --oneline -1` 或后端 `/api/version` 接口确认
- [ ] **确认 PostgreSQL 版本** — 运行 `psql --version` 确认版本为 14 或更高
- [ ] **确认 Redis 可用** — 运行 `redis-cli ping` 确认 Redis 服务正常响应
- [ ] **确认 LLM API Key 已配置** — 确保已获取有效的 LLM API Key（OpenAI / Anthropic 等），并在环境变量中配置

## 升级步骤

### 1. 备份

执行以下命令对数据库和配置文件进行完整备份：

```bash
# 备份数据库
pg_dump -U secmind secmind > secmind_backup_$(date +%Y%m%d).sql

# 备份配置文件
cp backend/.env backend/.env.backup
```

建议将备份文件复制到安全的外部存储或对象存储中，以防服务器故障导致数据丢失。

### 2. 更新代码

```bash
git pull origin main
# 或替换为新版本代码
```

如果使用自定义分支或私有仓库，请拉取对应的 v3.0 发布分支。更新后建议执行 `git status` 确认没有冲突文件。

### 3. 更新依赖

v3.0 新增了 Redis、WebSocket 等依赖，需要重新安装依赖包：

```bash
# 后端
cd backend
pip install -r requirements.txt

# 前端
cd frontend
npm install
```

安装完成后，确认关键依赖版本：
- `alembic` >= 1.12.0（数据库迁移）
- `redis` >= 5.0.0（缓存与消息队列）
- `websockets` >= 12.0（实时通信）

### 4. 执行数据库迁移

```bash
cd backend
alembic upgrade head
```

此命令将按顺序执行以下迁移脚本：

| 迁移脚本 | 说明 |
|---------|------|
| `018_add_tenant_rls.py` | 新增多租户字段和 Row-Level Security 策略 |
| `019_add_performance_indexes.py` | 新增性能优化索引（告警时间、IOC 类型、租户 ID 等） |

迁移完成后，运行 `alembic current` 确认数据库版本已更新到最新。

### 5. 配置新环境变量

在 `backend/.env` 中新增以下配置项：

```bash
# .env 新增配置

# Redis 连接（必填）
REDIS_URL=redis://localhost:6379/0

# LLM API 配置（至少配置一个供应商）
LLM_API_KEY=sk-...

# 可选多供应商配置
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# WebSocket 配置（可选，使用默认值即可）
WS_HEARTBEAT_INTERVAL=30
WS_MAX_CONNECTIONS=1000
```

> **注意**：`LLM_API_KEY` 为通用配置项。如果需要切换供应商，可同时配置 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY`，系统将根据实际请求自动路由。

### 6. 启动服务

```bash
docker compose -f backend/docker-compose.yml up -d
```

建议分步启动以观察各组件状态：

```bash
# 先启动基础设施（Redis）
docker compose -f backend/docker-compose.yml up -d redis

# 确认 Redis 启动成功后，启动后端服务
docker compose -f backend/docker-compose.yml up -d backend

# 最后启动前端和其他辅助服务
docker compose -f backend/docker-compose.yml up -d frontend
```

### 7. 验证升级

启动后逐项验证以下功能是否正常：

- [ ] **健康检查通过** — 访问 `GET /api/health`，返回 `{"status": "ok"}`
- [ ] **AI 分析返回真实结果** — 触发一次 AI 分析任务，确认返回内容为 LLM 推理结果而非模拟数据
- [ ] **IOC 查询正常** — 提交 IOC 查询请求，确认响应时间在预期范围内
- [ ] **WebSocket 连接正常** — 确认前端实时事件推送正常，浏览器控制台无连接错误
- [ ] **多租户隔离正常** — 使用不同租户账号登录，确认数据互不可见

## 回滚方案

如果升级过程中出现异常，可按以下步骤回滚到 v2.x 版本：

```bash
# 恢复数据库
psql -U secmind secmind < secmind_backup.sql

# 恢复代码
git revert HEAD

# 恢复配置
cp backend/.env.backup backend/.env
```

回滚后执行以下验证：
1. 确认服务正常启动
2. 确认 API 接口正常响应
3. 确认数据完整性未受影响

> **建议**：在正式升级前，先在预发布环境完成全流程演练，确保回滚方案可行。

## 已知问题

- v3.0 **需要 PostgreSQL 14+**，SQLite 不支持 Row-Level Security，无法使用多租户功能。请确保已迁移到 PostgreSQL
- 旧版 API 完全兼容，无需修改客户端代码。所有 v2.x 的 API 端点、请求格式和响应结构均保持不变
- Redis 为新增基础设施依赖，如 Redis 不可用，部分实时功能（WebSocket、缓存）将降级运行，但不影响核心分析功能
- 多租户功能需要在管理后台完成租户配置后方可生效，升级后默认仍为单租户模式