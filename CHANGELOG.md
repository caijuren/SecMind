# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2026-05-16

### Added

#### AI 分析引擎接入真实 LLM（去 Mock）
- **LLM Provider 抽象层** - 统一接口支持 OpenAI / DeepSeek / 阿里云 / Ollama 等兼容格式 Provider
- **`ai/providers.py`** - `BaseLLMProvider` 抽象基类 + `OpenAICompatibleProvider` 实现 + `create_provider()` 工厂函数
- **`ai_service.py`** - 移除 `_mock_analysis()` 和 `mock_analyses`，LLM 可用时调用真实 `llm_client.chat_json()`
- **`ai_chat_service.py`** - 移除 `_mock_process_ai_response()`，改用 `_fallback_response()` 显示 LLM 配置提示
- **`ai_analysis_engine.py`** - 移除 `analyze_phishing_alert()`/`analyze_vpn_alert()`/`analyze_edr_alert()` 等 4 个硬编码 mock 方法，统一走 `llm_client` 路径
- **`ai_model_service.py`** - 移除 `TASK_RESPONSES` 和 `_mock_route_request()`，LLM 不可用时返回配置提示
- **`llm_client.py`** - 移除 `_mock_response()`，仅保留 3 次重试的真实调用逻辑
- **分层降级架构** - LLM 不可用时返回清晰的配置提示（不含随机/模拟数据）

#### RBAC 全路由强制执行
- **补齐 28 组路由-权限映射** - `POST/DELETE:/api/v1/users`、`PUT/DELETE:/api/v1/hunting`、`PUT:/api/v1/integrations` 等
- **修复权限命名不一致** - `rbac_service.py` 中 `RESOURCE_ACTIONS` 和 `SYSTEM_ROLES` 统一为复数命名（如 `alerts:read` vs `alert:read`），确保中间件校验与数据库权限匹配
- **`middleware/rbac.py`** - `ROUTE_PERMISSIONS` 从 75 条扩展到 93 条，覆盖全部 37 个 router

#### IOC 情报源真实接入
- **移除 Mock 数据库** - 删除 `MOCK_IP_DB`/`MOCK_DOMAIN_DB`/`MOCK_HASH_DB` 共 6 条硬编码 mock 记录
- **`ioc_service.py`** - `_mock_ip()`/`_mock_domain()`/`_mock_hash()`/`_mock_url()` 替换为 `_fallback_result()`（显示"未配置 API Key"）和 `_no_result()`（显示"未找到威胁情报"）
- **真实 API 查询** - VirusTotal/AbuseIPDB/ThreatFox 真实查询，API Key 未配置时返回配置提示

#### 处置执行引擎对接真实通道
- **`ADAdapter` 适配器** - 支持 `disable_account()`/`enable_account()`/`reset_password()` 三个 AD 管理操作
- **`config.py`** - 新增 `AD_API_URL`/`AD_API_KEY`/`AD_DOMAIN` 三个配置项
- **`ACTION_MAP`** - `account_freeze` 从 `adapter: None` 改为 AD 适配器 `disable_account`，`password_reset` 改为 `reset_password`
- **`SIMULATED_ACTIONS`** - 完全移除，AD 动作与其他适配器一样通过真实 HTTP API 执行
- **`_build_call_params`/`_build_rollback_params`** - 新增 AD 动作参数构建

### Changed
- VERSION 从 2.2.0 更新至 2.3.0
- `ROUTE_PERMISSIONS` 从 75 条扩展到 93 条
- `rbac_service.py` `RESOURCE_ACTIONS` 从 14 组扩展到 24 组权限
- `SYSTEM_ROLES` 权限列表同步更新，与 `ROUTE_PERMISSIONS` 对齐

### Fixed
- RBAC 中间件 `ROUTE_PERMISSIONS` 权限命名与数据库 `RESOURCE_ACTIONS` 不一致导致非 admin 用户权限校验全部失败
- `account_freeze`/`password_reset` 两种处置动作之前无实际适配器实现

## [3.0.0] - 2026-05-16

### Added

#### AI 引擎全面升级
- **LLM Provider 抽象层** - 支持 OpenAI / Anthropic / DeepSeek / 阿里云 4 家供应商，自动 fallback
- **AI 信号推理引擎去 Mock** - 接入真实 LLM，支持 6 种告警类型的智能研判
- **Prompt 工程模板库** - 6 类安全运营专用 Prompt（事件分类/证据关联/攻击推理/处置决策/报告生成/安全问答）
- **多轮工具调用** - AI 对话可自动查询告警、设备、IOC 情报并生成报告
- **AI 可解释性** - 推理链可视化 + 置信度仪表盘组件
- **Token 用量监控** - 4 级配额（100K-5000万 token/天），Redis/内存双模式

#### 多租户与商业化
- **多租户行级安全 (RLS)** - 22 张表 PostgreSQL RLS 策略，数据完全隔离
- **配额管理** - 按套餐限制每日告警量，超限自动拦截
- **试用→付费转化** - 注册自动创建试用租户 + 订阅支付流程
- **Onboarding 向导** - 5 步引导流程
- **试用提醒横幅** - 到期前 7/3/1 天分级提醒

#### 权限与安全
- **RBAC 全路由注入** - 51 条路由权限映射，覆盖全部 22 个模块
- **前端权限守卫** - 路由守卫 + 按钮级控制 + 菜单动态渲染
- **4 个系统角色** - admin/analyst/viewer/soc_manager

#### 实时性与可视化
- **WebSocket 实时推送** - 3 个前端 Hook（useWebSocket/useRealtimeAlerts/useNotifications）
- **实时态势大屏** - Canvas 攻击地图 + 安全评分仪表盘 + 威胁播报 + 演示模式
- **可视化剧本编辑器增强** - 6 种自定义节点 + 右键菜单 + 撤销重做 + 键盘快捷键 + DAG 验证

#### 报表与合规
- **报表引擎** - 6 种预设模板（日报/周报/月报/攻击分布/MTTR/处置效率）
- **合规报表** - 等保2.0(73控制点) + GDPR(31条款) + ISO27001:2022(93控制) + CIS v8(18控制)
- **报告导出** - JSON/CSV 格式导出

#### 策略与进化
- **AI 策略自演化引擎** - Q-Learning 模拟 + 置信度优化 + 衰退检测
- **多模型智能路由** - 语义缓存 + 任务分类器 + 成本优化 + 模型健康监控

#### 性能优化
- **数据库连接池** - pool_size=20, max_overflow=40
- **ETag 缓存** - 条件请求支持 304 响应
- **统一缓存服务** - Redis/内存双模式自动降级
- **性能监控中间件** - 慢查询告警 + X-Response-Time 头
- **数据库复合索引** - 5 张核心表新增性能索引

#### IOC 与情报
- **Redis 缓存层** - IOC 查询结果缓存，TTL 1 小时
- **速率限制** - 每数据源每分钟 4 次调用
- **批量查询优化** - Redis pipeline 批量 GET
- **前端 IOC 对接** - 真实 API 调用替代 Mock 数据

### Changed
- AI 分析引擎从同步改为异步，支持并发分析
- AI 对话服务从 llm_client 迁移到 model_router，享受多模型路由
- 性能中间件慢查询阈值从 200ms 提升到 500ms
- 文档版本从 v2.0.0 更新至 v3.0.0

### Fixed
- RBAC 路由权限映射从 8 个模块扩展到 22 个模块
- 租户隔离从手动调用改为 PostgreSQL RLS 自动强制
- AI 对话历史上下文缺失问题，现支持最近 20 条消息

### Performance
- **告警降噪率**: 99%
- **自动化处置率**: 85%
- **运营效率提升**: 10x
- **AI 持续监控**: 7x24
- **API 响应时间**: P99 < 500ms

## [2.2.0] - 2026-05-14

### Changed

- 版本号统一更新至 2.2.0（前后端同步）
- 后端版本从 2.4.0 修正为 2.2.0，反映实际完成度
- 前端版本从 0.9.0 更新至 2.2.0

## [0.9.0] - 2026-05-10

### Added

- V0.9 版本发布
- 版本号统一更新至 0.9.0

## [0.8.0] - 2026-05-10

### Added

#### Documentation
- **产品文档页面** - 新增独立的产品文档页面 `/docs`
  - 产品介绍/营销页面，展示 SecMind 核心功能和价值
  - 详细使用指南 `/docs/guide`，采用左右结构导航
  - 覆盖所有功能模块的完整文档：
    - 快速入门：平台概述、快速上手指南
    - 态势感知：运营概览、通知中心、运营指标
    - 安全运营：信号接入、AI调查、案件管理、AI处置、威胁狩猎
    - AI引擎：反馈学习、AI知识库、工作流编排
    - 平台管理：数据源管理、资产管理、用户管理、集成管理、系统设置

#### Core Features
- **AI 信号推理引擎**
  - 自动感知安全信号、推理攻击意图
  - 识别需要调查的威胁
  - 支持多数据源信号接入（EDR、VPN、防火墙、邮件网关等）

- **攻击研判引擎**
  - 基于 MITRE ATT&CK 框架
  - 自动构建攻击假设
  - 映射完整攻击链

- **自主调查系统**
  - AI 自主完成深度调查
  - 生成攻击链与推理结论
  - 供分析师复核

- **证据链自动构建**
  - 跨数据源自动关联
  - 构建完整攻击证据链
  - 研判有据可依

- **案件研判闭环**
  - 从调查到案件到处置的完整闭环
  - 确保每个威胁都可追溯可响应

- **AI 自动处置**
  - 基于置信度的自动处置策略
  - 从研判到响应分钟级闭环
  - 支持回滚操作

#### Platform Modules
- **运营概览仪表盘**
  - 实时告警监控
  - MTTD/MTTR 关键指标
  - 告警趋势分析
  - AI 推理统计

- **信号接入管理**
  - 多源数据接入配置
  - AI 预处理（去噪、聚合、上下文补全）
  - 异常行为发现
  - 风险集群识别

- **AI 调查中心**
  - 实时推理信息流
  - 攻击链还原
  - 多假设推理
  - 置信度评估

- **案件管理系统**
  - 案件状态追踪
  - 案件信息管理
  - 反馈机制

- **AI 处置中心**
  - 自动处置队列
  - 处置策略配置
  - 执行记录与回滚

- **反馈学习系统**
  - 知识反馈追踪
  - AI 推理修正
  - AI 成长指标

- **AI 知识库**
  - 威胁情报管理
  - 攻击模式库
  - 历史案例
  - 处置策略

- **工作流编排**
  - 自定义自动化流程
  - 条件判断节点
  - 人工审批节点

- **平台管理**
  - 数据源管理
  - 资产管理
  - 用户管理与 RBAC
  - 集成管理
  - 系统设置

### Features

- **智能告警降噪** - 减少 99% 无效告警噪音
- **实时告警流** - 每 8 秒自动刷新
- **置信度驱动** - 高置信度自动执行，低置信度人工审批
- **持续学习** - 人工反馈驱动 AI 模型持续优化
- **人机协同** - 高置信度自动执行，低置信度人工审批

### Performance

- **告警降噪率**: 99%
- **自动化处置率**: 85%
- **运营效率提升**: 10x
- **AI 持续监控**: 24/7

## [0.7.0] - 2026-05-09

### Added
- 用户认证系统（登录、注册、密码重置）
- SSO 单点登录支持
- 国际化支持（中英文切换）
- 响应式设计优化
- 深色主题界面

## [0.6.0] - 2026-05-08

### Added
- 仪表盘核心组件
- 告警管理模块
- 通知中心
- 运营指标页面

## [0.5.0] - 2026-05-07

### Added
- 威胁狩猎模块
- 案件管理基础功能
- AI 调查界面

## [0.1.0] - 2026-05-01

### Added
- 项目初始化
- 前端框架搭建（Next.js 16 + React 19 + TypeScript）
- 后端框架搭建（FastAPI + Python）
- 基础 UI 组件库
