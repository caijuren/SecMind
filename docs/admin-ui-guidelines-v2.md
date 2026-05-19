# SecMind 后台 UI 统一规范 v2

版本：v2.0
适用范围：`frontend/src/app/(dashboard)` 全部后台页面
目标：统一深色主题视觉语言、提升 B 端精致感、满足上线标准
基准页：`/dashboard` 运营概览页、`/investigate` AI 研判页
取代：admin-ui-guidelines-v1.md（已归档至 docs/archive/）

---

## 1. 规范目标

这份规范解决三个问题：

1. 全站后台页面必须说同一种设计语言。
2. 页面要体现 B 端产品应有的专业、可信、克制、耐看。
3. 设计输出必须达到上线可交付标准，而不是"开发中可用状态"。

当前后台统一采用：

- 深色工作台风格（Dark-First）
- "在黑暗中看见威胁" — 深邃暗色为画布，电光蓝紫渐变作为视觉锚点
- 受 Linear / Vercel / Arc Browser 启发
- 高对比度、低疲劳、长时间使用不刺眼
- AI 模块允许有识别度，但不能独立成另一套 UI

---

## 2. 设计总原则

### 2.1 核心原则

1. 先可读，再精致。
2. 先结构清晰，再做视觉强调。
3. 先统一组件，再做页面个性。
4. 颜色服务于状态，不服务于装饰。
5. 深色背景上信息必须高对比度、低视觉噪音。

### 2.2 B 端审美原则

后台"好看"的标准不是炫，而是：

- 信息主次清楚
- 操作路径清楚
- 状态表达稳定
- 阅读不费力
- 长时间使用不疲劳

深色模式下特别注意：

- 文字对比度必须 ≥ 4.5:1（正文）
- 避免纯白文字大面积使用（用 zinc-100/200 替代）
- 卡片层级通过亮度和边框区分，不依赖阴影
- 暗色背景下禁用高饱和大面积色块

---

## 3. 视觉语言

### 3.1 整体气质

SecMind 后台应传达：

- 专业
- 冷静
- 可控
- 高效
- 可信

关键词：

- `Cinematic`
- `Precise`
- `Low-noise`
- `Dark-first`
- `Operational`

允许：

- 克制的玻璃态效果（侧边栏、弹窗背景）
- 微光效用于状态强调（告警等级 glow）
- 蓝紫渐变作为品牌识别锚点
- 透明叠层用于层级表达

禁止：

- 浅色大面积背景（#fafafa / #ffffff 作为页面主背景）
- 高饱和度霓虹泛滥
- 一页同时出现多种"主视觉主角"
- 浅色模式下对比度不足的文本

---

## 4. 色彩系统

### 4.1 基础暗色背景

后台统一使用 Zinc 系深色阶。

- 页面主背景：`#09090b`（bg-[#09090b] 或 zinc-950）
- 主卡片背景：`#131316`（bg-[#131316]）
- 次级卡片：`#18181b`（bg-[#18181b]）
- 悬浮层：`#1f1f24`
- 主边框：`border-white/6`（rgba(255,255,255,0.06)）
- 弱边框：`border-white/4`（rgba(255,255,255,0.04)）

### 4.2 文本颜色

深色背景下的文本层级：

- 一级标题 / 核心数字：`text-white` 或 `text-zinc-100`
- 二级标题 / 重要标签：`text-zinc-200`
- 正文：`text-zinc-300` ~ `text-zinc-400`
- 辅助说明 / 时间 / Meta：`text-zinc-500`
- 禁用 / 占位：`text-zinc-600`

禁止在深色背景正文中使用：

- `text-zinc-700` 及更深（对比度不足）
- `text-slate-*` 系列（使用 zinc 替代）

### 4.3 品牌强调色

品牌主色：**电光蓝（Electric Blue）→ 紫罗兰（Violet）渐变系**

- 主交互 / 高亮 / 链接：`blue-500`（#3b82f6）
- 主按钮：`bg-primary text-white`（shadcn primary）
- 强调色：`violet-500`（#8b5cf6，用于 AI 模块）
- Focus 环：`ring-blue-500/20`

推荐：

- 主交互文字：`text-blue-400`
- 主交互浅底：`bg-blue-500/10`
- 主交互边框：`border-blue-500/20`
- 主按钮：使用 shadcn/ui Button variant="default"

允许：

- 蓝紫渐变作为品牌装饰（如标题下划线、数据高亮）
- violet 用于 AI 分析模块识别

### 4.4 状态色

状态色必须跨页面一致（暗色优化版）：

- 严重 / 高风险：`red-400` 文字 + `red-500/10` 背景 + `red-500/20` 边框
- 警示 / 待处理：`orange-400` 文字 + `orange-500/10` 背景 + `orange-500/20` 边框
- 注意 / 中等：`yellow-400` 文字 + `yellow-500/10` 背景 + `yellow-500/20` 边框
- 成功 / 已闭环：`emerald-400` 文字 + `emerald-500/10` 背景 + `emerald-500/20` 边框
- 信息 / 处理中：`blue-400` 文字 + `blue-500/10` 背景 + `blue-500/20` 边框
- 中性 / 停用 / 归档：`zinc-400` 文字 + `zinc-500/10` 背景 + `zinc-500/20` 边框

状态色允许使用 glow 微光效，但仅限 Badge 和告警指示器，不允许大面积使用。

### 4.5 模块 Accent 色

不同模块使用独立的 Accent 色用于导航图标和页面识别：

| 模块 | 颜色 | 用途 |
|------|------|------|
| 运营概览 | `blue-500` | Dashboard 主色 |
| 告警处置 | `amber-500` | 信号/研判/响应 |
| AI 能力 | `violet-500` | AI 分析/聊天/知识库 |
| 威胁分析 | `pink-500` | 狩猎/工作流 |
| 系统设置 | `zinc-500` | 统一灰色 |

---

## 5. 页面结构规范

后台页面统一使用 4 层结构：

1. `Page Header`
2. `Summary / Filters`
3. `Primary Content`
4. `Secondary Content / Detail`

### 5.1 Page Header

用于承载：

- 页面名称
- 页面副标题
- 页面级动作

禁止在 Header 中塞入：

- 复杂筛选器
- 大量统计卡
- 页面内二级状态

Header 只解决"这是哪一页"和"这里的顶级动作是什么"。

深色模式下 Header 推荐：

- 页面标题：`text-2xl font-bold text-white`
- 副标题：`text-sm text-zinc-400`
- 无独立背景，与页面背景融为一体

### 5.2 Summary 区

用于承载：

- 全局统计
- 当前工作状态
- 高层摘要

Summary 区必须回答：

- 当前总量是多少
- 当前最需要关注什么
- 这些数字之间是什么关系

深色模式下统计卡推荐：

- 使用 `bg-[#131316] border border-white/6 rounded-xl`
- 数字使用 `text-2xl font-bold text-white`
- 标签使用 `text-xs text-zinc-500 uppercase tracking-wider`

### 5.3 Filters 区

用于承载：

- 搜索
- 状态筛选
- 时间范围
- 来源筛选

深色模式下筛选器推荐：

- 输入框：`border-white/8 bg-white/5 text-zinc-200 placeholder:text-zinc-500`
- 选中态：`bg-white/10 border-white/15 text-white`
- 未选中：`border-white/6 text-zinc-400 hover:text-white hover:border-white/10`

### 5.4 Primary Content

页面主内容只能有一个主角：

- 表格
- 案件池
- 工作流画布
- 证据链详情
- 统计图

深色模式下的表格推荐：

- 表头：`text-xs font-medium text-zinc-500 uppercase tracking-wider`
- 表行：`border-b border-white/4`
- hover：`bg-white/[0.02]`
- 选中：`bg-white/[0.04]`

### 5.5 Secondary Content

用于承载：

- 详情
- 侧边摘要
- 阅读提示
- 辅助数据

深色模式下侧边栏推荐：

- 背景：`bg-[#0c0c10]/85 backdrop-blur-xl border-r border-white/5`

---

## 6. 卡片系统

后台卡片保留 4 类（深色优化版）。

### 6.1 Base Card（基础表面卡）

用途：

- 页面主容器
- 核心详情
- 表格容器

样式：

- `bg-[#131316]`
- `border border-white/6`
- `rounded-xl`
- 无阴影或极轻阴影

对应代码：`CARD.base`

### 6.2 Elevated Card（悬浮强调卡）

用途：

- KPI 统计卡
- 重点信息突出

样式：

- `bg-[#18181b]`
- `border border-white/8`
- `rounded-xl shadow-lg shadow-black/20`

对应代码：`CARD.elevated`

### 6.3 Glass Card（玻璃态卡）

用途：

- 侧边栏
- 弹窗背景
- 悬浮面板

样式：

- `bg-white/5 backdrop-blur-xl`
- `border border-white/6`
- `rounded-xl`

对应代码：`CARD.glass`

### 6.4 Ghost Card（幽灵卡）

用途：

- 次级信息区
- hover 交互区

样式：

- `bg-white/[0.02]`
- `border border-white/5`
- `rounded-xl`
- `hover:bg-white/[0.04] hover:border-white/8`

对应代码：`CARD.ghost`

---

## 7. 统计卡规范

统计卡必须满足：

1. 数字有解释
2. 统计之间有关系
3. 同一页数字风格一致

### 7.1 统计卡结构

统一结构：

- Label（`text-xs text-zinc-500 uppercase tracking-wider`）
- Value（`text-2xl font-bold text-white`）
- Optional Hint（`text-xs text-zinc-500`）

可选：

- 图标
- 环比 / 状态说明

### 7.2 数字闭环要求

如果页面展示多个状态统计：

- 全部 = 各状态求和
- 建议在"全部"卡片内直接给出解释提示

禁止：

- 数字独立摆放但互相解释不清
- "总数"与"状态数"来自不同口径

---

## 8. 表单与筛选器规范

### 8.1 输入框

统一要求：

- 高度固定（h-9 或 h-10）
- 文本对比足够
- 深色底 + 微弱边框

推荐样式（对应 `inputClass`）：

```
border-white/8 bg-white/5 text-foreground
placeholder:text-zinc-500
focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20
```

### 8.2 搜索 + 筛选组合

推荐顺序：

1. 搜索
2. 状态筛选
3. 来源 / 时间 / 类型
4. 清除筛选

禁止：

- 把搜索框做成主视觉
- 筛选器视觉比主内容更强
- 过多同权重筛选器平铺

---

## 9. 表格规范

### 9.1 表格头

- 统一使用 `text-xs font-medium text-zinc-500 uppercase tracking-wider`
- 统一行高
- 统一左对齐逻辑
- 背景：`bg-[#0c0c10]/50`

### 9.2 表格行

- 行 hover：`bg-white/[0.02]`
- 不可出现高饱和整行染色
- 高风险行可以极轻提示底色（`bg-red-500/5`），但不能影响阅读

### 9.3 表格内标签

- 标签是辅助，不应比正文更强
- 表格中的 badge 要比卡片中的 badge 更克制

---

## 10. Badge / 状态标签规范

状态 Badge 统一要求：

- 高度统一（h-5 或 h-6）
- 文字字号统一（text-xs）
- 内边距统一（px-2 py-0.5）
- 边框明确

### 10.1 Badge 分类

1. `Status Badge` — 业务状态：已确认、处理中、已闭环
2. `Type Badge` — 类型：EDR、告警级别、资产类型
3. `Tag Badge` — 普通标签、实体名、附加说明

### 10.2 使用原则

- 状态 Badge 强于 Type Badge
- Type Badge 强于普通 Tag
- 深色模式下 Badge 使用半透明背景 + 彩色文字

---

## 11. 按钮规范

### 11.1 层级

后台按钮只保留三层（使用 shadcn/ui Button）：

1. Primary（default）— 主动作
2. Secondary（outline）— 次动作
3. Tertiary / Ghost — 行内辅助动作

### 11.2 深色模式特别注意

- Primary 按钮使用 shadcn 默认 primary 色
- Outline 按钮：`border-white/10 text-zinc-300 hover:bg-white/5`
- Ghost 按钮：`text-zinc-400 hover:text-white hover:bg-white/5`
- 危险操作按钮：`variant="destructive"`

---

## 12. 空状态规范

空状态必须包含：

1. 图标（使用 `text-zinc-600` 颜色）
2. 主句（`text-zinc-300`）
3. 解释句（`text-zinc-500`）
4. 下一步建议（可选，使用 Primary 按钮）

空状态不能只是"暂无数据"。
必须说明：

- 为什么为空
- 用户下一步可以做什么

推荐使用统一的 EmptyState 组件。

---

## 13. Dialog 规范

### 13.1 结构

- 标题
- 说明
- 表单 / 内容
- Footer

### 13.2 深色模式 Dialog

- 背景：`bg-[#18181b] border border-white/8`
- 标题：`text-lg font-semibold text-white`
- 说明：`text-sm text-zinc-400`
- 遮罩：`bg-black/60 backdrop-blur-sm`

### 13.3 Footer

统一规则：

- 左侧留空或辅助说明
- 右侧为取消 + 确认
- 主按钮永远在最右侧
- 危险操作确认弹窗使用 Destructive 按钮

---

## 14. AI 模块专属规范

AI 模块必须有识别度，但不能成为另一套主题。

### 14.1 可用表达

- 轻 violet 强调（`text-violet-400`、`border-violet-500/20`）
- 专属标题图标
- AI 摘要块（`bg-violet-500/5 border-violet-500/10`）
- 推理链模块
- 步骤导航

### 14.2 禁止表达

- 把 AI 模块做成完全不同的配色体系
- 大面积未来科技感渐变
- AI 模块脱离整体深色主题

---

## 15. 导航规范

### 15.1 侧边栏

- 背景：`bg-[#0c0c10]/85 backdrop-blur-xl border-r border-white/5`
- 分组标签：`text-[11px] font-medium text-zinc-600 uppercase tracking-widest`
- 导航项默认：`text-zinc-400 hover:text-white hover:bg-white/[0.04]`
- 导航项激活：`bg-white/[0.06] text-white`
- 导航项图标：`text-zinc-500`（激活时跟随模块 Accent 色）

### 15.2 导航分组

4 个功能分组 + 设置子菜单：

1. 监控中心：Dashboard / 态势大屏 / 指标监控
2. 告警处置：信号中心 / AI 研判 / 应急响应
3. AI 能力：AI 分析 / AI 聊天 / 知识库 / 学习中心
4. 威胁分析：威胁狩猎 / 工作流

设置（底部可展开子菜单）：系统设置 / 用户管理 / 审计日志 / 计费 / 合规

### 15.3 顶栏

- 背景：`bg-[#0c0c10]/80 backdrop-blur-xl border-b border-white/5`
- 搜索框：使用 Cmd+K 全局搜索
- 通知图标：带未读红点
- 用户头像：带头像 + 下拉菜单

---

## 16. 命名规范

页面内区块命名必须业务清晰。

### 16.1 推荐命名

- 总览
- 筛选与状态
- 案件池
- 详情预览
- 完整证据链
- AI 建议
- 闭环结论

### 16.2 禁止命名

- 工作台控制台
- 智能引擎中枢
- 协同决策矩阵
- 其他只听起来高级但用户不知道是什么意思的词

---

## 17. 动效规范

动效只能辅助状态，不可主导页面。

允许：

- 轻 hover 阴影/边框变化（`transition-all duration-200`）
- 轻位移（`hover:-translate-y-0.5`）
- loading（骨架屏 / spinner）
- pulse 点状状态提示
- 页面入场动画（`animate-fadeInUp`、`animate-slideInLeft`）
- 交错子元素动画（`stagger-children`）

禁止：

- 大面积 glow 动画循环
- 高频闪动
- 多模块同时做运动
- 动画时长超过 500ms 的主交互

注意：需适配 `prefers-reduced-motion`。

---

## 18. 上线验收标准

上线前每个后台页面必须通过以下检查：

### 18.1 视觉一致性

- 是否符合深色主题统一页面结构
- 卡片是否只用 4 类之一
- 状态色是否符合全站规则
- 搜索 / 筛选器高度是否统一
- 空状态是否统一
- 无浅色主题残留（bg-white、text-slate-* 等）

### 18.2 业务逻辑一致性

- 数字是否闭环
- 状态是否可解释
- 板块关系是否清楚
- 是否存在无意义空白区域

### 18.3 可读性

- 主次是否明确
- 深色背景下对比度是否足够
- 长内容是否可分步阅读
- 表格是否清楚
- Badge 是否过多

### 18.4 交互完成度

- 默认态是否合理
- 加载态是否存在
- 空态是否存在
- 错误态是否存在
- 成功态是否存在
- 危险操作是否有确认弹窗

### 18.5 细节完整度

- 无明显换行挤压
- 无孤立无解释数字
- 无奇怪命名
- 无浅色主题风格残留

---

## 19. 当前版本的禁用项

从现在开始，后台页面禁止：

1. 使用 `bg-white`、`bg-slate-50`、`#fafafa` 作为页面或主卡片背景
2. 使用 `text-slate-900/800/700` 作为正文颜色（深色背景对比度不足）
3. 使用浅色表格样式（白底 + slate 边框）
4. 同页使用多种主风格卡片
5. 没解释关系的统计数字
6. 大块空白仅为了"留设计感"
7. 输入框使用浅色主题样式

---

## 20. 设计令牌引用

所有页面应优先使用以下设计令牌来源：

1. `@/lib/design-system.ts` — COLORS / CARD / TYPOGRAPHY / SHADOWS 等
2. `@/lib/admin-ui.ts` — pageCardClass / softCardClass / inputClass / subtleTextClass
3. `globals.css` — CSS 变量（--background, --foreground, --card 等）+ 工具类
4. shadcn/ui 组件 — Button, Input, Badge, Dialog, Table 等

---

## 21. 最终目标

SecMind 后台最终应达到：

- 第一眼像成熟 B 端产品（深色专业风格）
- 第二眼能看出 AI 能力是核心差异点
- 长时间使用不累（深色模式护眼）
- 页面之间像一个系统，而不是一组页面
- 在深色画布上，用蓝紫光效精准表达安全态势

这份规范是后续全部页面设计与实现的唯一后台标准基线。