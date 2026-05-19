# SecMind 上线前全面 Review 报告

> **Review 日期**：2026-05-16  
> **当前版本**：VERSION 文件标注 2.3.0  
> **Review 范围**：前端 + 后端 + 文档 + 产品化包装  
> **Review 角色**：资深产品经理

---

## 目录

1. [后台页面设计与营销页设计一致性](#一后台页面设计与营销页设计一致性)
2. [页面设计质量评估](#二页面设计质量评估)
3. [功能点 Review](#三功能点-review)
4. [页面排布与导航结构](#四页面排布与导航结构)
5. [技术栈 Review](#五技术栈-review)
6. [安全与管理问题](#六安全与管理问题)
7. [产品化包装](#七产品化包装)
8. [详细解决方案](#八详细解决方案)
9. [修复优先级汇总](#九修复优先级汇总)

---

## 一、后台页面设计与营销页设计一致性

### 核心问题：两套设计系统严重割裂

SecMind 当前存在**三套互不兼容的设计系统**：

| 设计维度 | 营销页（实际） | 后台设计规范 | 排版规范文档 |
|----------|:-----------:|:----------:|:----------:|
| **主题** | 深色 (#09090b) | 浅色 (#f8fafc) | 浅色 |
| **主色调** | Blue + Violet 渐变 | Cyan 纯色 | Cyan + Teal |
| **卡片风格** | 玻璃拟态 (bg-white/[0.02]) | 实色白底 (bg-white) | 未定义 |
| **按钮** | 渐变 + 发光阴影 | 纯色 bg-cyan-600 | 渐变 cyan→teal |
| **特效** | 大量 glow/blur/渐变 | 明确禁止 | 未提及 |

### 具体问题

**1. 营销页用深色暗黑主题，后台规范要求浅色工作台风格**

营销 Landing Page、Solutions、Pricing 全部采用深色 Cyberpunk 风格（`bg-[#09090b]`、渐变文字、毛玻璃导航、发光阴影）。但 [admin-ui-guidelines-v1.md](docs/admin-ui-guidelines-v1.md) 第 19 章明确禁止：透明背景、毛玻璃效果、发光阴影、violet 作为主色。后台实际代码中，[dashboard layout](frontend/src/app/(dashboard)/layout.tsx) 使用 `bg-[#09090b]`（深色），sidebar 使用毛玻璃效果（`backdropFilter: "blur(20px)"`），直接违反了规范。

**2. 主色调不一致**

- 营销页主色调：Blue-Violet 渐变
- 设计规范主色调：Cyan
- 实际后台：混合使用 blue、violet、cyan、amber 等多个 accent 色

**3. 两套规范文档的矛盾**

[UI-TYPOGRAPHY.md](frontend/UI-TYPOGRAPHY.md) 定义的是浅色主题 + Cyan 主色，[admin-ui-guidelines-v1.md](docs/admin-ui-guidelines-v1.md) 也是浅色主题 + Cyan 主色，但实际营销页和后台都是深色主题。这说明设计规范形同虚设。

**4. ESLint 插件与实际的矛盾**

ESLint 插件 `ui-guidelines.js` 禁止了 `backdrop-blur`、`glow-shadow` 等，但 sidebar 组件大量使用了这些效果且没有被 ESLint 拦截（因为 sidebar 使用 inline style 而非 Tailwind 类名，绕过了检测）。

### 建议

- **【高优先】决策统一方向**：要么营销页改浅色、要么后台规范改深色，不能各说各话
- **【高优先】统一主色调**：选定 Blue 或 Cyan 作为唯一品牌色，全局统一
- **【中优先】补齐 ESLint 规则**：覆盖 inline style 的检测

---

## 二、页面设计质量评估

### 设计优秀的页面

| 页面 | 评分 | 亮点 |
|------|:--:|------|
| **Investigate（智能研判）** | 9/10 | 两阶段交互（列表→详情）、4 状态卡片、完整的证据链可视化、AI 推理步骤时间线、MITRE ATT&CK 映射。是整个平台设计最好的页面 |
| **Situation Room（态势大屏）** | 8.5/10 | 安全评分仪表盘、攻击地图、威胁统计面板、实时告警流，组件化程度高 |
| **Marketing Landing** | 8.5/10 | Hero 区设计精良、AI Demo 终端窗口模拟、Bento Grid 仪表盘、动画系统完善 |
| **Pricing** | 8/10 | 三列定价卡 + 功能对比表，推荐方案高亮处理得当 |

### 设计有改进空间的页面

| 页面 | 评分 | 问题 |
|------|:--:|------|
| **Dashboard** | 7/10 | KPI 卡片与告警列表功能完整，但使用了 `design-system` 工具类，与营销页的 glass-card 体系不统一。缺少真实数据接入时骨架屏/加载态 |
| **Signals** | 6.5/10 | 告警信号列表页，功能完整但视觉偏平淡，缺少与 Investigate 页面的事件关联引导 |
| **Response** | 6.5/10 | 响应处置页，状态流转清晰但缺少执行进度的实时反馈动画 |
| **Hunting** | 7/10 | 威胁狩猎页，MITRE 矩阵展示有特色，但缺少空状态引导（新用户没有狩猎假设时） |

### 设计有明显问题的页面

| 页面 | 评分 | 问题 |
|------|:--:|------|
| **Knowledge（知识库）** | 5/10 | 文档列表页，设计过于简单，缺少分类导航、搜索高亮、阅读进度等基础功能 |
| **Learning（学习中心）** | 5/10 | 策略演化学习页，概念较抽象但缺少可视化引导，新用户难以理解 |
| **Workflows（剧本编排）** | 6/10 | 使用了 @xyflow/react 流程图编辑器，但与整体设计风格割裂（暗色编辑器 + 浅色外围） |
| **System Settings** | 5.5/10 | 设置页面是多个子页面的容器，但表单风格不统一，部分使用原生 input 样式 |

### 共性问题

1. **缺少空状态设计**：大部分页面没有 Empty State（如新用户首次进入知识库/学习中心/狩猎页时）
2. **缺少加载骨架屏**：所有页面直接渲染 mock 数据，没有 loading skeleton
3. **缺少错误状态**：没有 API 请求失败时的错误提示和重试机制 UI
4. **国际化不完整**：大量页面存在硬编码中文，虽然有 i18n 框架但未全面覆盖
5. **Investigate 页面使用浅色主题**（`bg-white`），与其他深色后台页面不一致

---

## 三、功能点 Review

### 功能完整度高的模块

| 模块 | 说明 |
|------|------|
| 告警管理 | 信号采集 → 告警生成 → AI 研判 → 响应处置，链路完整 |
| AI 分析 | 多模型路由 + 自动降级 + 预算控制，架构先进 |
| 多租户 | 三层隔离（中间件 + contextvars + RLS），企业级水准 |
| RBAC | 4 系统角色 + 120+ 路由权限映射，粒度细致 |
| 合规管理 | 框架→控制项→评估→结果，四层模型完整 |
| 策略演化 | 强化学习反馈 + 自动调整，理念前沿 |

### 功能重复或冗余

| 问题 | 详情 |
|------|------|
| **Dashboard 重复** | 存在 `/dashboard`（运营看板）和 `/dashboard-hub`（看板中心）两个页面，功能定位模糊。sidebar 中两者都出现，用户会困惑 |
| **AI 入口分散** | AI 分析 (`/ai-analysis`)、AI 对话 (`/ai-chat`)、AI 模型管理 (`/system` 内) 分布在三个不同位置，缺少统一的 AI 工作台入口 |
| **设置页扁平化过度** | `/system` 页面作为设置入口，但 RBAC、租户、账单、合规等 6 个子页面全部扁平展示，缺少分组和层级感 |
| **响应处置与剧本编排割裂** | Response 和 Workflows/Playbooks 是紧密关联的功能，但在导航中分属不同区域，且没有交叉链接 |

### 功能缺失

| 缺失功能 | 重要性 | 说明 |
|----------|:------:|------|
| **告警聚合/去重** | 高 | 大量同类告警应自动聚合为告警事件，减少噪音。当前 signals 页是扁平列表 |
| **通知中心** | 高 | Topbar 有通知铃铛（hardcoded 5 条），但 `/notifications` 页面功能简陋，缺少通知分级、已读/未读、通知偏好设置 |
| **全局搜索** | 高 | Topbar 有搜索框但功能未实现，仅展示 placeholder。安全运营平台必须支持跨模块全局搜索 |
| **审计日志导出** | 中 | `/audit` 页面缺少导出功能（CSV/PDF），合规场景必备 |
| **报表定时发送** | 中 | 报表引擎支持生成，但缺少定时邮件发送功能 |
| **移动端适配** | 中 | 后台页面完全没有移动端响应式设计，sidebar 在小屏幕不可用 |
| **数据导出** | 中 | 大部分列表页缺少数据导出功能 |
| **Webhook 事件订阅** | 低 | 模型已有但前端缺少管理界面 |
| **操作确认** | 中 | 危险操作（如删除用户、关闭告警）缺少二次确认弹窗 |

### 逻辑问题

| 问题 | 详情 |
|------|------|
| **Investigate 状态流转** | 4 个状态（investigating→pending_review→disposing→closed），但缺少"重新打开"操作，已闭环案件无法回溯 |
| **Billing 定价** | 白皮书只列专业版和企业版，用户指南提到"基础版"，实际模型有 4 个 Plan（Free/Starter/Professional/Enterprise），前后不一致 |
| **Trial 试用期** | Free Plan 14 天试用，其他 Plan 30 天试用，但 TrialBanner 组件未区分不同 Plan 的试用期提示 |

---

## 四、页面排布与导航结构

### 当前导航结构

侧边栏使用**双模式切换**设计：主功能导航 + 设置导航，通过 URL 路径自动切换。

**主功能导航（14 项）**：
```
运营看板 → 工作台 → 运营看板(旧) → 态势大屏 → 运营指标
→ 通知中心 → AI调查助手 → 原始信号 → 智能研判 → 响应处置
→ 学习中心 → 知识库 → 威胁狩猎 → 剧本编排 → 设置
```

**设置导航（11 项）**：
```
数据源 → 资产管理 → 用户管理 → 报告管理 → 审计日志
→ 集成管理 → 系统设置 → 权限管理 → 租户管理 → 账单订阅 → 合规管理
```

### 问题分析

**1. 导航项过多，层级混乱**

14 个主功能导航项全部平铺，违反 7±2 认知法则。建议分组：
- **监控概览**：运营看板、态势大屏、运营指标
- **告警处置**：原始信号、智能研判、响应处置
- **AI 能力**：工作台、AI 调查助手、知识库、学习中心
- **威胁分析**：威胁狩猎、剧本编排

**2. "运营看板"出现两次**

sidebar 中 `/dashboard-hub`（运营看板）和 `/dashboard`（也是运营看板）同时存在，分别使用不同的图标和 accent 色，显然是历史遗留问题。应合并为一个。

**3. 设置导航的返回按钮体验差**

点击"设置"后进入设置模式，需要点击"返回"才能回到主功能导航。这种模式切换对用户不直观，建议改为**可展开的子菜单**或**面包屑导航**。

**4. 缺少快捷操作入口**

安全运营人员的高频操作（如：确认告警、创建案件、执行响应）需要进入对应页面才能操作，缺少全局快捷操作面板。

**5. Playbook Editor 路由孤立**

`/playbooks/editor` 是独立路由，但不在 sidebar 导航中，只能从 Workflows 页面跳转进入，容易被忽视。

### 建议的导航结构

```
├── 📊 监控中心
│   ├── 运营看板（合并 dashboard-hub + dashboard）
│   ├── 态势大屏
│   └── 运营指标
├── 🚨 告警处置
│   ├── 原始信号
│   ├── 智能研判
│   └── 响应处置
├── 🤖 AI 能力
│   ├── AI 工作台（合并 ai-analysis + ai-chat 入口）
│   ├── 知识库
│   └── 学习中心
├── 🎯 威胁分析
│   ├── 威胁狩猎
│   └── 剧本编排
├── ⚙️ 系统设置（可展开子菜单）
│   ├── 数据源
│   ├── 资产管理
│   ├── 用户管理
│   ├── 权限管理
│   ├── 租户管理
│   ├── 账单订阅
│   ├── 合规管理
│   ├── 集成管理
│   ├── 报告管理
│   └── 审计日志
```

---

## 五、技术栈 Review

### 技术栈亮点

| 方面 | 评价 |
|------|------|
| **前端框架** | Next.js 16 + React 19，使用最新主版本，技术前瞻性强 |
| **UI 组件** | shadcn/ui + @base-ui/react 双组件策略，兼顾效率与灵活性 |
| **状态管理** | Zustand 5 + Immer，轻量且类型安全 |
| **可视化** | ECharts 6 + @xyflow/react，图表和流程图能力完备 |
| **后端框架** | FastAPI + SQLAlchemy 2.0，异步支持良好 |
| **AI 路由** | 多模型智能路由（5 模型 + 7 任务类型 + 4 优先级策略），架构先进 |
| **多租户** | 中间件 + contextvars + PostgreSQL RLS 三层隔离 |
| **部署** | Docker 多阶段构建 + standalone 输出 + 非 root 运行 |

### 需要注意的问题

| 问题 | 详情 |
|------|------|
| **Tailwind CSS v4** | 使用最新的 v4 版本，去掉了 `tailwind.config.ts`，改用 CSS 内 `@theme` 配置。这是较新的迁移方式，生态工具兼容性需验证 |
| **Next.js 16** | 同样是最新版本，可能存在未发现的 bug。建议关注 Next.js 的 patch 更新 |
| **@base-ui/react** | 可能未被实际使用，建议运行 `depcheck` 确认 |
| **Python 3.11** | Dockerfile 使用 `python:3.11-slim`，Python 3.11 安全更新持续到 2027-10，短期内无风险 |
| **测试覆盖** | 仅有 4 个测试文件（test_api.py, test_smoke.py, test_tenant_isolation.py, test_v2_modules.py），测试覆盖率明显不足 |

### 需要修复的问题

| 问题 | 详情 |
|------|------|
| **CSP 配置严重缺陷** | [next.config.ts](frontend/next.config.ts) 中 `script-src 'unsafe-inline' 'unsafe-eval'` 几乎完全抵消了 CSP 的 XSS 防护能力 |
| **SQL 拼接风险** | [tenant_isolation.py](backend/app/middleware/tenant_isolation.py) 使用 f-string 拼接 SQL |
| **Refresh Token 不轮转** | 刷新端点只返回新 access token，不返回新 refresh token，存在安全风险 |
| **Redis 无密码** | docker-compose 中 Redis 无密码认证 |

---

## 六、安全与管理问题

### 高危问题（上线前必须修复）

| # | 问题 | 位置 |
|---|------|------|
| 1 | **CSP 允许 unsafe-inline + unsafe-eval**，XSS 防护形同虚设 | [next.config.ts](frontend/next.config.ts) |
| 2 | **SQL 参数拼接**：f-string 拼接 SET 命令 | [tenant_isolation.py](backend/app/middleware/tenant_isolation.py) |
| 3 | **Redis 无密码认证** | [docker-compose.yml](backend/docker-compose.yml) |
| 4 | **PostgreSQL 默认密码 changeme** | [docker-compose.yml](backend/docker-compose.yml) |

### 中危问题（建议上线前修复）

| # | 问题 | 位置 |
|---|------|------|
| 5 | Refresh Token 不轮转，泄露后可无限刷新 | [auth.py](backend/app/routers/auth.py) |
| 6 | Token 无黑名单/撤销机制，登出后 JWT 仍有效 | auth_service.py |
| 7 | SECRET_KEY 自动生成导致重启后所有 Token 失效 | [config.py](backend/app/config.py) |
| 8 | PostgreSQL/Redis 端口暴露到宿主机 | [docker-compose.yml](backend/docker-compose.yml) |
| 9 | 前端 Dockerfile 缺少 HEALTHCHECK | [frontend/Dockerfile](frontend/Dockerfile) |
| 10 | 前端 .dockerignore 未排除 .env | [frontend/.dockerignore](frontend/.dockerignore) |

### 做得好的安全措施

- 密码使用 pbkdf2_sha256 哈希
- 登录限流 5次/分钟 + 账户锁定机制（5 次失败锁定 15 分钟）
- JWT 区分 access/refresh 类型
- 多租户三层隔离（中间件 + contextvars + PostgreSQL RLS）
- 120+ 路由权限映射
- `poweredByHeader: false`、HSTS、X-Frame-Options 等安全响应头
- 前端无 dangerouslySetInnerHTML / eval 使用

### 管理问题

| 问题 | 详情 |
|------|------|
| **缺少操作审计** | 后端有审计日志模型但缺少敏感操作（删除用户、修改权限等）的强制审计记录 |
| **缺少会话管理** | 无强制踢出其他会话、查看活跃会话等功能 |
| **缺少数据备份策略** | 文档中未提及数据库备份和恢复方案 |
| **缺少监控告警** | 无 CPU/内存/磁盘的监控和告警机制（仅有性能统计端点） |

---

## 七、产品化包装

### 做得好的

| 方面 | 评价 |
|------|------|
| **产品白皮书** | 1000+ 行专业级白皮书，从行业痛点到技术架构到竞品对比，内容极为详实 |
| **用户指南** | 8 章 + 3 附录，工作流驱动的操作手册，实用性强 |
| **CHANGELOG** | 严格遵循 Keep a Changelog 格式，从 v0.1.0 到 v3.0.0 完整追溯 |
| **CI/CD** | CI + Release + Auto Deploy 完整流水线，版本一致性三重校验 |
| **一键部署** | init-server.sh 提供交互式部署体验 |
| **API 文档** | 15 个模块的 API 文档 + Scalar API 在线文档 |
| **迭代计划** | ROADMAP-2.0 极其详尽，包含任务分解、甘特图、风险矩阵 |

### 缺失的关键项

| 缺失项 | 重要性 | 说明 |
|--------|:------:|------|
| **LICENSE 文件** | **高** | README 提到 MIT 但仓库中无 LICENSE 文件，没有许可证意味着默认保留所有权利，用户无法合法使用 |
| **软著/知识产权** | **高** | 未发现软著登记信息、商标注册信息。产品名"SecMind"需要确认是否已注册商标 |
| **信创适配** | **高** | 文档中未提及信创兼容性（如是否支持国产数据库 GaussDB/达梦、国产中间件、麒麟操作系统等）。如果面向政企客户，这是硬性要求 |
| **CONTRIBUTING.md** | 中 | 开源社区贡献指南缺失 |
| **前端 README** | 中 | 当前是 `create-next-app` 的默认模板，完全未定制 |
| **根目录 AGENTS.md** | 中 | AI 编程助手缺少项目级指令 |
| **安全白皮书** | 中 | 产品白皮书中有安全性说明章节，但缺少独立的渗透测试报告、安全审计报告 |

### 需要修复的问题

| 问题 | 详情 |
|------|------|
| **版本号不一致** | README badges 显示 2.2.0、VERSION 文件是 2.3.0、CHANGELOG 同时有 2.3.0 和 3.0.0、用户指南标注 3.0.0、产品白皮书是 2.1.0 |
| **文档冗余** | `docs/user-guide.md` = `docs/guide/user-guide.md`，两份完全相同，维护成本翻倍 |
| **白皮书版本落后** | 白皮书标注 v2.1.0（2026年5月），但当前产品已是 v2.3.0 |
| **定价方案不一致** | 白皮书列 2 个 Plan、用户指南列 3 个、实际模型有 4 个 |
| **init-server.sh 硬编码路径** | 包含开发者个人路径 `/Users/grubby/Desktop/SecMind/` |
| **README badges 过时** | Next.js 16 的 badge 与实际不符 |

### 产品化建议

1. **立即注册软著**：代码量已达可申请标准，建议在工信部/版权局完成软件著作权登记
2. **商标检索**：确认"SecMind"是否可注册商标，防止品牌纠纷
3. **信创兼容性清单**：
   - 数据库：需测试 GaussDB、达梦 DM8、人大金仓 KingbaseES
   - 操作系统：需测试麒麟 V10、统信 UOS
   - CPU 架构：需支持 ARM64（鲲鹏/飞腾），当前 Dockerfile 仅 x86
4. **生成 LICENSE**：在仓库根目录添加 MIT LICENSE 文件
5. **统一版本号**：README、白皮书、用户指南、VERSION 文件全部对齐到同一版本
6. **准备交付包**：
   - 产品白皮书（更新至当前版本）
   - 部署手册
   - 用户操作手册
   - API 文档
   - 安全配置最佳实践
   - 运维手册

---

## 八、详细解决方案

### 8.1 设计一致性问题：深色/浅色主题统一

#### 方案选择：推荐统一为「深色主题 + Blue 主色」

理由：
- 营销页已经投入大量设计资源（543 行 Landing Page、128 行导航、95 行页脚、470 行全局 CSS 动画系统）
- 后台页面也已经是深色实现（layout.tsx 第 44 行：`bg-[#09090b]`）
- 安全产品天然适合深色主题（"在黑暗中看见威胁"的产品理念）
- 竞品 CrowdStrike、SentinelOne 均为深色主题

#### 具体执行步骤

**Step 1：废弃旧的设计规范文档**

删除或归档以下文件（它们定义的是浅色 Cyan 主题，与实际不符）：
- `docs/admin-ui-guidelines-v1.md` → 归档为 `admin-ui-guidelines-v1-deprecated.md`
- `docs/guide/ui-guidelines.md` → 删除（与上一条重复）
- `frontend/UI-TYPOGRAPHY.md` → 归档为 `UI-TYPOGRAPHY-deprecated.md`

**Step 2：更新 ESLint 插件规则**

当前 [eslint-plugins/ui-guidelines.js](frontend/eslint-plugins/ui-guidelines.js) 的 6 条规则是基于浅色主题的。需要改为深色主题规则：
- `no-transparent-bg` → 改为 `enforce-dark-card-bg`（强制使用 #131316 而非透明）
- `no-backdrop-blur` → 改为 `restrict-backdrop-blur`（仅允许 sidebar 使用）
- `no-glow-shadow` → 改为 `restrict-glow-shadow`（仅允许 CTA 按钮使用）
- `no-violet-primary-color` → 保留（violet 仍不应作为主色）
- `no-light-text-on-light-bg` → 改为 `enforce-dark-text-contrast`
- `no-decorative-gradient` → 保留

**Step 3：统一 Sidebar 风格**

将 sidebar 的 inline style 改为使用 Tailwind 类名，使其可被 ESLint 检测：

```tsx
// 修改前
<aside style={{
  borderColor: "rgba(255,255,255,0.06)",
  background: "rgba(12,12,16,0.85)",
  backdropFilter: "blur(20px)",
}}>

// 修改后
<aside className="border-r border-white/5 bg-[#0c0c10]/85 backdrop-blur-xl">
```

**Step 4：统一 Investigate 页面主题**

[investigate/page.tsx](frontend/src/app/(dashboard)/investigate/page.tsx) 目前使用浅色主题（`bg-white`、`border-slate-200`、`text-slate-*`），与全站深色不一致。需要改为深色适配：
- 卡片背景：`bg-white` → `bg-[#131316]`
- 边框：`border-slate-200` → `border-white/6`
- 主文字：`text-slate-900` → `text-zinc-100`
- 次文字：`text-slate-600` → `text-zinc-400`

**Step 5：创建新的设计规范文档**

在 `docs/` 下创建 `admin-ui-guidelines-v2.md`，定义深色主题规范。

### 8.2 主色调统一

建立**三层色彩体系**：

```typescript
const ACCENT_COLORS = {
  // 第一层：品牌主色（唯一）
  brand: {
    primary: '#3b82f6',        // Blue-500 - 全局主交互色
    primaryHover: '#2563eb',   // Blue-600
    primaryGradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  },
  // 第二层：语义色（4 种，用于状态表达）
  semantic: {
    success: '#22c55e',        // 成功/闭环/合规通过
    warning: '#f59e0b',        // 警告/待处理
    danger: '#ef4444',         // 危险/严重告警
    info: '#06b6d4',           // 信息/进行中
  },
  // 第三层：功能标识色（仅用于 sidebar 导航图标）
  nav: {
    alerts: '#ef4444',
    ai: '#8b5cf6',
    response: '#f97316',
  }
}
```

### 8.3 页面设计质量改进

#### Knowledge 页面改造

增加左侧分类树 + 右侧内容区的双栏布局：

```tsx
export default function KnowledgePage() {
  return (
    <div className="flex h-full gap-6">
      <aside className="w-56 shrink-0 space-y-4">
        <Input placeholder="搜索文章..." />
        <CategoryTree categories={categories} activeId={activeCategory} onSelect={setActiveCategory} />
        <TagFilter tags={allTags} selected={selectedTags} onToggle={toggleTag} />
      </aside>
      <main className="flex-1">
        <ArticleListHeader sortBy={sortBy} onSortChange={setSortBy} totalCount={filteredArticles.length} />
        <ArticleList articles={filteredArticles} />
      </main>
    </div>
  );
}
```

#### Learning 页面改造

增加顶部引导卡片，解释"策略自演化"的概念：

```tsx
{showGuide && (
  <Card className="border-blue-500/20 bg-blue-500/5">
    <CardContent className="flex items-start gap-4 p-4">
      <Brain className="size-8 text-blue-400 shrink-0 mt-1" />
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-zinc-100">策略自演化学习中心</h3>
        <p className="mt-1 text-sm text-zinc-400">
          SecMind 通过强化学习持续优化安全策略。当安全分析师对 AI 研判结果
          给出反馈时，系统自动调整策略权重，使下一次研判更准确。
        </p>
      </div>
    </CardContent>
  </Card>
)}
```

#### 通用 EmptyState 组件

```tsx
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/8 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/5">
        <Icon className="size-7 text-zinc-500" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-zinc-300">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">{description}</p>
      {action && <Button onClick={action.onClick} className="mt-6">{action.label}</Button>}
    </div>
  );
}
```

### 8.4 功能点修复

#### Dashboard 合并

1. 保留 `/dashboard` 作为唯一运营看板
2. 删除 `/dashboard-hub` 目录
3. 在 sidebar.tsx 中删除 dashboard-hub 条目
4. 在 next.config.ts 中添加重定向：`/dashboard-hub` → `/dashboard`

#### AI 入口统一

创建 `/ai-hub` 作为统一的 AI 工作台入口页面，包含：
- AI 分析概览（今日分析量、平均置信度、模型使用分布）
- 快捷入口（开始分析 → /ai-analysis、AI 对话 → /ai-chat、模型管理 → /system/ai-models）
- 最近分析记录列表
- 模型运行状态

#### 告警聚合

后端增加 AlertGroup 模型，基于 `source_ip + alert_type` 的 hash 进行聚合：

```python
class AlertGroup(Base):
    __tablename__ = "alert_groups"
    id = Column(Integer, primary_key=True)
    group_key = Column(String(256), index=True)
    alert_count = Column(Integer, default=1)
    first_alert_at = Column(DateTime)
    last_alert_at = Column(DateTime)
    risk_level = Column(String(50))
    status = Column(String(50), default="open")
    representative_alert_id = Column(Integer, ForeignKey("alerts.id"))
```

#### 全局搜索

使用 cmdk（已安装）实现 Cmd+K 全局搜索面板：

```tsx
<Command.Dialog open={open} onOpenChange={setOpen} label="全局搜索">
  <Command.Input placeholder="搜索告警、案件、知识、用户..." />
  <Command.List>
    {results.map(result => (
      <Command.Item key={result.id} onSelect={() => { router.push(result.url); setOpen(false); }}>
        <Icon className="size-4 text-zinc-500" />
        <div>
          <span className="text-zinc-200">{result.title}</span>
          <span className="text-xs text-zinc-500">{result.subtitle}</span>
        </div>
      </Command.Item>
    ))}
  </Command.List>
</Command.Dialog>
```

后端增加统一搜索 API `/api/v1/search`，跨 alerts/documents/users 表搜索。

### 8.5 导航结构重构

#### 分组导航

```typescript
const navGroups = [
  { label: "监控中心", items: [
    { label: "运营看板", href: "/dashboard", icon: LayoutDashboard },
    { label: "态势大屏", href: "/screen", icon: Monitor },
    { label: "运营指标", href: "/metrics", icon: TrendingUp },
  ]},
  { label: "告警处置", items: [
    { label: "原始信号", href: "/signals", icon: Radio },
    { label: "智能研判", href: "/investigate", icon: GitBranch },
    { label: "响应处置", href: "/response", icon: Zap },
  ]},
  { label: "AI 能力", items: [
    { label: "AI 工作台", href: "/ai-hub", icon: Brain },
    { label: "知识库", href: "/knowledge", icon: BookOpen },
    { label: "学习中心", href: "/learning", icon: GraduationCap },
  ]},
  { label: "威胁分析", items: [
    { label: "威胁狩猎", href: "/hunting", icon: Target },
    { label: "剧本编排", href: "/workflows", icon: Workflow },
  ]},
];
```

#### 设置改为可展开子菜单

将"系统设置"从双模式切换改为主导航底部的可展开子菜单，用户无需离开当前页面即可访问设置项。

### 8.6 安全修复

#### CSP 修复

```typescript
// next.config.ts
value: [
  "default-src 'self'",
  "script-src 'self' 'nonce-{NONCE}'",  // 使用 nonce 替代 unsafe-inline
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://trae-api-cn.mchost.guru",
  "font-src 'self' data:",
  "connect-src 'self' http://localhost:8000 ws://localhost:8000",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ")
```

#### SQL 拼接修复

```python
# 修改前
db.execute(text(f"SET app.current_tenant_id = '{tenant_id}'"))

# 修改后：使用参数化查询
db.execute(
    text("SET app.current_tenant_id = :tenant_id"),
    {"tenant_id": str(tenant_id)}
)
```

#### Refresh Token Rotation

```python
@router.post("/refresh", response_model=Token)
def refresh_token(body: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_refresh_token(body.refresh_token)
    if payload is None:
        raise HTTPException(status_code=401, detail="无效的刷新令牌")
    
    user_id = payload.get("sub")
    token_version = payload.get("tv", 0)
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    # 检查 token 版本
    if token_version != user.token_version:
        user.token_version = 0  # 使所有 refresh token 失效
        db.commit()
        raise HTTPException(status_code=401, detail="令牌已被使用，请重新登录")
    
    # 递增 token 版本，使旧 refresh token 失效
    user.token_version += 1
    db.commit()
    
    access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(
        data={"sub": str(user.id), "tv": user.token_version}
    )
    
    return Token(access_token=access_token, refresh_token=new_refresh_token)
```

#### Redis 密码

```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
  expose:
    - "6379"  # 不暴露到宿主机
```

#### SECRET_KEY 强制设置

```python
# config.py
if not self.SECRET_KEY:
    raise ValueError(
        "SECRET_KEY 未设置。请通过环境变量 SECRET_KEY 或 .env 文件设置。"
        "\n生成方式: python3 -c 'import secrets; print(secrets.token_urlsafe(32))'"
    )
```

### 8.7 产品化包装

#### LICENSE 文件

在根目录创建 MIT LICENSE 文件。

#### 版本号统一

| 位置 | 当前 | 改为 |
|------|------|------|
| README badges | 2.2.0 | 2.3.0 |
| README 版本章节 | v2.2.0 | v2.3.0 |
| 产品白皮书 | v2.1.0 | v2.3.0 |
| 用户指南 | v3.0.0 | v2.3.0 |

#### 文档冗余消除

删除 `docs/guide/user-guide.md` 和 `docs/guide/release-guide.md`，在 VitePress 配置中使用路由重定向。

#### frontend README 定制

替换默认的 `create-next-app` 模板为包含项目上下文、技术栈、开发指南的定制 README。

#### AGENTS.md

在根目录和后端目录分别创建 AGENTS.md，为 AI 编程助手提供项目级指令。

### 8.8 信创改造方案

#### 分阶段实施方案

**Phase 1：ARM64 架构支持（1-2 周）**
- 修改 Dockerfile 支持多架构构建
- 使用 Docker Buildx 构建 linux/amd64 + linux/arm64 镜像

**Phase 2：国产数据库适配（2-3 周）**
- 在 database.py 中增加达梦/人大金仓/GaussDB 支持
- Alembic 迁移兼容性测试

**Phase 3：麒麟/统信操作系统适配（1-2 周）**
- 创建麒麟专用 Dockerfile
- Python 依赖 ARM64 兼容性检查
- 安装脚本适配麒麟包管理器

**Phase 4：信创认证准备（持续）**
- 麒麟软件 NeoCertify 认证
- 达梦/人大金仓数据库兼容认证
- 华为鲲鹏 Compatible 认证

### 8.9 软著申请流程

**Step 1：准备材料（1 周）**
- 软件著作权登记申请表
- 软件说明书（800-1500 字）
- 源代码文档（前 30 页 + 后 30 页）
- 用户手册
- 营业执照 + 身份证

**Step 2：在线提交（1 天）**
- 在中国版权保护中心（https://www.ccopyright.com.cn/）提交
- 普通申请约 300 元，加急约 1000 元

**Step 3：等待审查（30-60 个工作日）**

**Step 4：商标注册（并行）**
- 第 9 类：计算机软件
- 第 42 类：软件设计/安全咨询
- 第 45 类：安全服务

---

## 九、修复优先级汇总

### P0 — 必须在上线前修复（4 项，预计 3-5 天）

| # | 问题 | 涉及文件 | 工作量 |
|---|------|---------|:--:|
| 1 | **CSP unsafe-inline + unsafe-eval** | [next.config.ts](frontend/next.config.ts) | 0.5 天 |
| 2 | **SQL f-string 拼接** | [tenant_isolation.py](backend/app/middleware/tenant_isolation.py) + [tenant_rls.py](backend/app/services/tenant_rls.py) | 0.5 天 |
| 3 | **Redis 无密码 + 端口暴露** | [docker-compose.yml](backend/docker-compose.yml) + [docker-compose.yml](docker-compose.yml) | 0.5 天 |
| 4 | **添加 LICENSE 文件** | 根目录新建 LICENSE | 0.5 天 |

### P1 — 建议上线前修复（8 项，预计 5-8 天）

| # | 问题 | 涉及文件 | 工作量 |
|---|------|---------|:--:|
| 5 | Refresh Token Rotation | [auth.py](backend/app/routers/auth.py) + [auth_service.py](backend/app/services/auth_service.py) + user model | 1 天 |
| 6 | SECRET_KEY 强制设置 | [config.py](backend/app/config.py) | 0.5 天 |
| 7 | 前端 Dockerfile HEALTHCHECK + .dockerignore | [frontend/Dockerfile](frontend/Dockerfile) + [.dockerignore](frontend/.dockerignore) | 0.5 天 |
| 8 | 统一版本号（README/白皮书/用户指南） | 多个文件 | 0.5 天 |
| 9 | 合并两个 Dashboard 页面 | [sidebar.tsx](frontend/src/components/layout/sidebar.tsx) + dashboard-hub 目录 | 1 天 |
| 10 | 全局搜索功能实现 | [topbar.tsx](frontend/src/components/layout/topbar.tsx) + 新建 search router | 1.5 天 |
| 11 | 导航分组重构 | [sidebar.tsx](frontend/src/components/layout/sidebar.tsx) | 1 天 |
| 12 | 设计规范文档统一（归档旧规范 + 创建 v2） | docs/ 目录 | 0.5 天 |

### P2 — 上线后可迭代（14 项，预计 10-15 天）

| # | 问题 | 工作量 |
|---|------|:--:|
| 13 | Investigate 页面深色主题适配 | 2 天 |
| 14 | 空状态/加载态/错误态通用组件 | 1.5 天 |
| 15 | 告警聚合功能 | 2 天 |
| 16 | 通知中心增强 | 1.5 天 |
| 17 | 审计日志导出 | 1 天 |
| 18 | 报表定时发送 | 1.5 天 |
| 19 | 危险操作确认弹窗 | 0.5 天 |
| 20 | Knowledge/Learning 页面设计优化 | 1.5 天 |
| 21 | 国际化完整覆盖 | 2 天 |
| 22 | frontend README + AGENTS.md 定制 | 0.5 天 |
| 23 | 文档冗余消除 | 0.5 天 |
| 24 | 移动端基础适配 | 1 天 |
| 25 | 软著申请 | 持续 |
| 26 | 信创兼容性改造 | 持续 |

---

## 综合评估

| 维度 | 评分 | 状态 |
|------|:--:|------|
| 后台 vs 营销页设计一致性 | 4/10 | 🔴 需大幅整改 |
| 页面设计质量 | 6.5/10 | 🟡 整体可上线，部分需优化 |
| 功能完整度 | 7.5/10 | 🟢 核心功能完整 |
| 导航结构合理性 | 5.5/10 | 🟡 需调整 |
| 技术栈 | 8/10 | 🟢 先进但需修复安全问题 |
| 安全 | 5.5/10 | 🔴 4 个高危问题需修复 |
| 产品化包装 | 7.8/10 | 🟡 核心文档优秀，但缺 LICENSE 和软著 |

**总体评分：6.4/10 — 可以上线，但有多个问题需要在上线前解决。**

---

## 总工作量预估

| 优先级 | 项数 | 预估时间 |
|--------|:--:|---------|
| P0 必须修复 | 4 | 3-5 天 |
| P1 建议修复 | 8 | 5-8 天 |
| P2 迭代优化 | 14 | 10-15 天 |
| **合计** | **26** | **18-28 天** |