# AGENTS.md — SecMind Frontend

## 项目概述

SecMind 是 AI 自主安全运营平台，前端基于 Next.js 16 App Router + Tailwind CSS v4 + shadcn/ui。

## 技术栈关键信息

- **框架**: Next.js 16 (App Router)
- **样式**: Tailwind CSS v4（`@import "tailwindcss"` 方式，非 v3 配置）
- **组件库**: shadcn/ui（组件位于 `src/components/ui/`）
- **语言**: TypeScript（strict 模式）
- **状态管理**: Zustand（`src/store/`）
- **国际化**: 自定义方案（`src/i18n/`，使用 `useLocaleStore().t(key)`）
- **图表**: ECharts + echarts-for-react
- **流程图**: @xyflow/react

## 关键约定

### 设计系统
- **深色主题优先**：页面背景 `#09090b`，卡片 `#131316`，边框 `border-white/6`
- **文本层级**：一级 `text-white`，二级 `text-zinc-200`，正文 `text-zinc-300/400`，辅助 `text-zinc-500`
- **品牌色**：主交互 `blue-500`，AI 模块 `violet-500`
- **禁止使用**：`bg-white` 纯白背景、`text-slate-*` 深色文本、浅色输入框样式
- 设计规范文档：`docs/admin-ui-guidelines-v2.md`

### 组件使用
- 所有 UI 组件优先使用 shadcn/ui（`src/components/ui/`）
- 通用业务组件位于 `src/components/common/`（EmptyState、LoadingState、ErrorState、ConfirmDialog、GlobalSearch 等）
- 页面布局使用 `src/components/layout/`（sidebar、topbar、page-header）

### 代码风格
- 组件文件使用 `"use client"` 指令（需要时）
- 使用 `cn()` 工具函数合并 className（来自 `@/lib/utils`）
- 使用 `pageCardClass`、`softCardClass`、`inputClass` 等快捷类（来自 `@/lib/admin-ui`）
- 设计令牌使用 `@/lib/design-system.ts` 中的 COLORS、CARD、TYPOGRAPHY 等

### 国际化
- 页面组件中解构 `const { t } = useLocaleStore()`
- UI 文本使用 `t("namespace.key")` 格式
- 翻译字典位于 `src/i18n/translations/index.ts`
- 新增 key 需同时提供 `en` 和 `zh-CN` 翻译

### 文件结构
- 页面路由：`src/app/(dashboard)/{page-name}/page.tsx`
- 布局组件：`src/components/layout/`
- 通用组件：`src/components/common/`
- 工具库：`src/lib/`
- 状态管理：`src/store/`

## 常用命令

```bash
npm run dev               # 开发服务器
npm run build             # 生产构建
npm run lint              # ESLint 检查
npm run ui:check          # UI 深色主题规范检查
npm run ui:check:fix      # UI 规范检查（含修复建议）
```

## 注意事项

- 所有删除/危险操作必须使用 `ConfirmDialog` 组件确认
- 空状态使用 `EmptyState` 组件，加载态使用 `LoadingState`，错误态使用 `ErrorState`
- 全局搜索使用 Cmd+K 快捷键（`GlobalSearch` 组件）
- 导航侧边栏使用 4 分组 + 可展开设置子菜单结构