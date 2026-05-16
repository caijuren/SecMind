# SecMind UI Guidelines 自动化防护工具

## 📋 概述

本工具集用于**自动检测和防止** `admin-ui-guidelines-v1.md` 第19章规定的 UI 规范违规代码进入代码库。

### 包含的组件

| 组件 | 文件 | 用途 |
|------|------|------|
| **ESLint 插件** | `eslint-plugins/ui-guidelines.js` | 实时编辑器检测 + CI 检查 |
| **独立检查脚本** | `scripts/check-ui-guidelines.js` | 手动运行 / CI/CD / Git Hook |
| **Pre-commit Hook** | `.husky/pre-commit` | 提交前自动拦截违规代码 |
| **配置文件** | `eslint.config.mjs` (已更新) | 启用自定义规则 |

---

## 🚀 快速开始

### 1. 安装依赖（已完成）

```bash
npm install husky --save-dev
npx husky init  # 已创建 .husky 目录
```

### 2. 使用方式

#### 方式 A：手动运行检查脚本

```bash
# 基础检查（显示错误和警告）
npm run ui:check

# 显示修复建议
npm run ui:check:fix

# 输出 JSON 格式报告（用于 CI/CD）
npm run ui:check:json
```

**输出示例**：
```
╔══════════════════════════════════════════════════════════╗
║     🎯 SecMind UI Guidelines Compliance Check            ║
╚══════════════════════════════════════════════════════════╝

📄 response/page.tsx
──────────────────────────────────────────────────────────────
  ❌ [ERROR] Line 1234: 透明度背景
     找到: "bg-white/[0.04]"
     说明: 禁止使用 bg-white/[0.02] 或 [0.04] (第19章禁用项)
     🔧 修复: 替换为 "bg-white" 或 "bg-slate-50"

📊 统计汇总
   检查文件数: 21
   问题文件数: 2
   ❌ 错误 (Error): 3
   ⚠️  警告 (Warn): 15

🎉 所有检查项通过！UI 规范 100% 合规！
```

#### 方式 B：ESLint 编辑器实时检测

当你使用 VSCode 或其他支持 ESLint 的编辑器时：

1. **打开任意 `.tsx` 文件**
2. **编写或修改 className**
3. **如果违反规则**：
   - 编辑器会立即显示红色波浪线（Error）或黄色波浪线（Warn）
   - 鼠标悬停可查看详细说明和修复建议

**支持的规则**：

| 规则 ID | 级别 | 检测内容 |
|---------|:----:|---------|
| `ui-guidelines/no-transparent-bg` | ❌ Error | `bg-white/[0.02]`, `[0.04]` 等 |
| `ui-guidelines/no-backdrop-blur` | ❌ Error | `backdrop-blur-xl/lg/md` |
| `ui-guidelines/no-glow-shadow` | ❌ Error | `shadow-[0_0_...]` 自定义发光阴影 |
| `ui-guidelines/no-violet-primary-color` | ⚠️ Warn | `text-violet-*`, `bg-violet-*` (非 MITRE) |
| `ui-guidelines/no-light-text-on-light-bg` | ⚠️ Warn | `text-cyan-300/400`, `text-slate-300/400` |
| `ui-guidelines/no-decorative-gradient` | ⚠️ Warn | 高饱和装饰性渐变 |

#### 方式 C：Pre-commit Hook 自动拦截（推荐）

**已自动启用！** 当你执行 `git commit` 时：

```bash
git add .
git commit -m "feat: add new feature"
```

**Hook 会自动**：
1. ✅ 扫描所有修改的文件中的 dashboard 页面
2. ✅ 检查是否有 UI 规范违规
3. ✅ 如果发现 **Error 级别违规 → 阻止提交**
4. ✅ 如果只有 **Warn 级别 → 允许提交但显示警告**
5. ✅ 如果全部通过 → 正常提交

---

## 📖 详细使用指南

### ESLint 插件详解

#### Rule 1: `no-transparent-bg` (Error)

**检测目标**：透明度背景  
**违规模式**：
- `bg-white/[0.02]`
- `bg-white/[0.04]`
- `bg-white/[0.06]`

**正确用法**：
```tsx
// ❌ 违规
<div className="bg-white/[0.04] backdrop-blur-xl">

// ✅ 正确
<div className="bg-white">
<div className="bg-slate-50">
```

**修复建议**：替换为实底色 `bg-white` 或浅灰底色 `bg-slate-50`

---

#### Rule 2: `no-backdrop-blur` (Error)

**检测目标**：毛玻璃模糊效果  
**违规模式**：
- `backdrop-blur-xl`
- `backdrop-blur-lg`
- `backdrop-blur-md`

**正确用法**：
```tsx
// ❌ 违规
<div className="backdrop-blur-xl bg-white/[0.04]">

// ✅ 正确 - 使用实底背景
<div className="bg-white">
<div className="bg-slate-50 border border-slate-200">
```

**修复建议**：移除 backdrop-blur，改用实底背景 + 轻边框

---

#### Rule 3: `no-glow-shadow` (Error)

**检测目标**：发光阴影效果  
**违规模式**：
- `shadow-[0_0_8px_rgba(239,68,68,0.3)]`
- `shadow-[0_0_12px_rgba(6,182,212,0.5)]`
- 其他自定义 boxShadow glow

**正确用法**：
```tsx
// ❌ 违规
<div className="shadow-[0_0_20px_rgba(0,212,255,0.3)]">

// ✅ 正确 - 使用 Tailwind 标准阴影
<div className="shadow-sm">
<div className="shadow-md">
<div className="shadow-lg">

// ✅ 正确 - 无阴影
<div className="">
```

**修复建议**：使用标准阴影类或完全移除阴影

---

#### Rule 4: `no-violet-primary-color` (Warn)

**检测目标**：violet/purple 作为主交互色  
**违规模式**：
- `text-violet-600` (标题/按钮)
- `bg-violet-500` (主按钮背景)
- `border-violet-400` (主要边框)

**允许的场景**（需注释说明）：
```tsx
{/* MITRE 攻击技术映射 - 允许使用 violet */}
<span className="text-violet-600">{technique.name}</span>
```

**正确用法**：
```tsx
// ❌ 违规 - 作为主交互色
<button className="bg-violet-600 text-white">提交</button>

// ⚠️ 警告 - 如确需使用，添加 MITRE 注释
{/* 辅助分析模块 - IOC 类型分类 */}
<Badge className="text-violet-700 bg-violet-50">域名</Badge>

// ✅ 推荐使用 cyan 系列
<button className="bg-cyan-600 text-white">提交</button>
<Badge className="text-indigo-600 bg-indigo-50">域名</Badge>  // indigo 替代 violet
```

**修复建议**：
- 主交互色统一改为 **cyan** 系列
- 辅助分析场景可用 **indigo** 替代 violet
- 必须在 MITRE 映射场景时添加注释

---

#### Rule 5: `no-light-text-on-light-bg` (Warn)

**检测目标**：浅色背景上的过浅文本  
**违规模式**：
- `text-cyan-300` / `text-cyan-400` (白底上)
- `text-slate-300` / `text-slate-400` (作为正文)

**正确用法**：
```tsx
// ❌ 违规 - 对比度不足，难以阅读
<p className="text-cyan-400">这是正文内容</p>
<span className="text-slate-300">辅助信息</span>

// ✅ 正确 - 符合 WCAG AA 标准
<p className="text-slate-600">这是正文内容</p>      // 正文
<span className="text-slate-500">辅助信息</span>       // Meta 信息
<strong className="text-cyan-700">强调文字</strong>    // 强调

// 标题层级
<h1 className="text-slate-900 font-semibold">一级标题</h1>
<h2 className="text-slate-800 font-semibold">二级标题</h2>
```

**文本颜色规范速查表**：

| 用途 | 推荐颜色 | 对比度 |
|------|---------|-------|
| 一级标题/核心数字 | `text-slate-950` / `text-slate-900` | ★★★★★ |
| 二级标题 | `text-slate-800` / `text-slate-700` | ★★★★☆ |
| **正文内容** | **`text-slate-600`** | **★★★★☆ (必需)** |
| 辅助说明/Meta | `text-slate-500` | ★★★☆☆ |
| 禁用状态 | `text-slate-400` | ★★☆☆☆ (仅限禁用态) |

---

#### Rule 6: `no-decorative-gradient` (Warn)

**检测目标**：高饱和度装饰性渐变  
**违规模式**：
- `bg-gradient-to-r from-cyan-500 to-teal-500` (按钮/卡片)
- `bg-gradient-to-b from-cyan-500/25 via-purple-500/15` (大面积)

**允许的场景**：
- 极轻微渐变（opacity < 0.1）
- 图表内部配置（echarts）

**正确用法**：
```tsx
// ❌ 违规 - 高饱和装饰渐变
<button className="bg-gradient-to-r from-cyan-500 to-teal-500 ... shadow-[0_0_20px_rgba(...)]">
  提交
</button>

// ✅ 正确 - 标准实心按钮
<button className="bg-cyan-600 hover:bg-cyan-700 text-white">
  提交
</button>

// ✅ 正确 - 轻量底色（AI 模块识别度）
<div className="bg-cyan-50 border-cyan-200 rounded-xl p-4">
  AI 分析结果区域
</div>
```

**修复建议**：B端产品保持克制，使用纯色或极轻量底色

---

## 🔧 配置与定制

### 修改规则级别

在 `eslint.config.mjs` 中调整：

```javascript
rules: {
  // 将某个 warn 规则升级为 error（更严格）
  'ui-guidelines/no-violet-primary-color': 'error',  // 原 'warn'
  
  // 将某个 error 规则降级为 warn（更宽松）
  'ui-guidelines/no-glow-shadow': 'warn',  // 原 'error'
  
  // 完全禁用某条规则（不推荐）
  'ui-guidelines/no-decorative-gradient': 'off',
}
```

### 添加新的检测模式

编辑 `eslint-plugins/ui-guidelines.js`：

```javascript
// 在 rules 对象中添加新规则
'no-custom-pattern': {
  meta: {
    type: 'problem',  // 'problem' | 'suggestion' | 'layout'
    docs: { description: '...', recommended: 'error' },
    messages: { noCustomPattern: '...' },
    schema: [],
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === 'string') {
          const pattern = /your-regex-here/;
          if (pattern.test(node.value)) {
            context.report({ node, messageId: 'noCustomPattern' });
          }
        }
      },
    };
  },
},
```

然后在 `eslint.config.mjs` 中注册：

```javascript
rules: {
  'ui-guidelines/no-custom-pattern': 'error',
}
```

---

## 🔄 CI/CD 集成

### GitHub Actions 示例

```yaml
name: UI Guidelines Check

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  ui-check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Run UI Guidelines Check
        working-directory: frontend
        run: npm run ui:check:json
      
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: ui-guidelines-report
          path: frontend/ui-guidelines-report.json
```

### GitLab CI 示例

```yaml
ui-guidelines-check:
  stage: test
  image: node:20-alpine
  
  script:
    - cd frontend
    - npm ci
    - npm run ui:check
  
  artifacts:
    when: always
    paths:
      - frontend/ui-guidelines-report.json
    reports:
      junit: frontend/ui-guidelines-report.json
```

---

## 🐛 故障排除

### 问题 1：ESLint 不生效

**症状**：编辑器不显示错误提示

**解决方案**：
1. 确保 VSCode 安装了 ESLint 扩展
2. 重启 VSCode
3. 检查 `.vscode/settings.json` 是否启用了 ESLint：

```json
{
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  "eslint.run": "onType"
}
```

### 问题 2：Pre-commit hook 不触发

**症状**：`git commit` 不运行检查脚本

**解决方案**：
1. 确认 husky 已安装：`npm ls husky`
2. 确认 hook 有执行权限：`ls -la .husky/pre-commit`
3. 手动测试 hook：`.husky/pre-commit`

### 问题 3：误报太多

**症状**：大量不相关的警告

**解决方案**：
1. 检查是否需要调整规则级别（Error → Warn → Off）
2. 对于特殊页面（如 screen 大屏页），可以在文件顶部添加注释：

```tsx
/* eslint-disable ui-guidelines/no-decorative-gradient */
// 此页面允许使用渐变效果（大屏展示特殊需求）
```

### 问题 4：性能问题

**症状**：ESLint 检查很慢

**解决方案**：
1. 在 `eslint.config.mjs` 中限制检查范围：

```javascript
{
  files: ['src/app/(dashboard)/**/*.tsx'],
  plugins: { 'ui-guidelines': uiGuidelinesPlugin },
  rules: { /* ... */ }
}
```

2. 只对暂存的文件运行检查（配合 lint-staged）：

```json
// package.json
"lint-staged": {
  "*.tsx": [
    "node scripts/check-ui-guidelines.js"
  ]
}
```

---

## 📊 当前检查结果摘要

**最后运行时间**: 2026-05-12

| 检测项 | 发现数量 | 状态 |
|--------|:-------:|:----:|
| 透明度背景 (`bg-white/[0.xx]`) | **0** | ✅ 全部清除 |
| 毛玻璃效果 (`backdrop-blur`) | **0** | ✅ 全部清除 |
| 发光阴影 (`shadow-[0_0_...])`) | **0** | ✅ 全部清除 |
| Violet 主色 | **2** | ⚠️ 需确认是否为 MITRE 场景 |
| 浅色文本 (`text-*-300/400`) | **264** | ⚠️ 建议后续优化 |
| 装饰渐变 | **0** | ✅ 全部清除 |

**总体评级**: 
- 🔴 **Error 级别违规**: **0 处** ✅
- 🟡 **Warn 级别警告**: **266 处** （主要是历史遗留的浅色文本问题）

---

## 🎯 后续行动项

### 立即可做
- [ ] 测试 pre-commit hook：尝试提交一个包含违规代码的文件
- [ ] 在编辑器中打开一个页面文件，验证 ESLint 实时检测

### 本周内完成
- [ ] 修复剩余的 **2 个 violet 相关问题**（如非 MITRE 场景）
- [ ] 评估 **264 个浅色文本警告**的优先级，分批修复

### 本月内规划
- [ ] 集成到 GitHub Actions CI 流水线
- [ ] 团队培训：如何解读和使用这些工具
- [ ] 收集反馈，迭代优化规则

---

## 📞 支持

遇到问题？查看：
1. **规范文档**: `docs/admin-ui-guidelines-v1.md`
2. **ESLint 配置**: `eslint.config.mjs`
3. **插件源码**: `eslint-plugins/ui-guidelines.js`
4. **检查脚本**: `scripts/check-ui-guidelines.js`

---

**版本**: 1.0.0  
**创建日期**: 2026-05-12  
**维护者**: SecMind Frontend Team
