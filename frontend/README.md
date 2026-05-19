# SecMind Frontend

AI 安全运营平台前端应用 — 信号感知、攻击推理、案件研判、自动处置。

## 技术栈

- **框架**: Next.js 16 (App Router)
- **样式**: Tailwind CSS v4
- **组件库**: shadcn/ui
- **语言**: TypeScript
- **状态管理**: Zustand
- **国际化**: i18next + react-i18next
- **图表**: ECharts + echarts-for-react
- **流程图**: @xyflow/react

## 快速开始

```bash
npm install && npm run dev
```

启动后访问 [http://localhost:3000](http://localhost:3000)。

## 构建

```bash
npm run build
npm start
```

## 关键目录

| 目录 | 说明 |
|------|------|
| `src/app` | Next.js App Router 页面路由 |
| `src/components` | 可复用 UI 组件（layout、ui、ai、auth 等） |
| `src/lib` | 工具函数和 API 客户端 |
| `src/i18n` | 国际化翻译配置与语言包 |
| `src/store` | Zustand 全局状态（auth、alert、dashboard、locale） |
| `src/hooks` | 自定义 React Hooks |
| `src/types` | TypeScript 类型定义 |
| `src/core` | 核心业务逻辑（假设引擎、评分器等） |
| `src/data` | Mock 数据和知识库数据 |

## 设计系统

项目采用 **Dark Theme v2** 设计系统，以深色主题为主（浅色模式为辅）。

设计规范参考：[admin-ui-guidelines-v2.md](../docs/admin-ui-guidelines-v2.md)

核心设计原则：
- 深色基调 `#09090b`，配合毛玻璃卡片效果
- Electric Blue (`#3b82f6`) 为主强调色
- 统一使用 shadcn/ui 组件体系
- 支持亮色/暗色主题切换

## 代码规范检查

```bash
npm run ui:check          # UI 规范检查
npm run ui:check:fix      # UI 规范自动修复
npm run lint              # ESLint 代码检查
```