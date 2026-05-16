"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Shield,
  Sparkles,
  BookOpen,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Menu,
  X,
  LayoutDashboard,
  Radio,
  Crosshair,
  Inbox,
  Zap,
  GraduationCap,
  Database,
  Monitor,
  Bell,
  TrendingUp,
  Target,
  Workflow,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Server,
  Users,
  Plug,
  Settings,
  FileText,
  Hexagon,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  { label: "首页", href: "/" },
  { label: "解决方案", href: "/solutions" },
  { label: "文档", href: "/docs" },
  { label: "定价", href: "/pricing" },
]

interface DocSection {
  id: string
  title: string
  icon: React.ElementType
  content: React.ReactNode
}

interface DocGroup {
  label: string
  icon: React.ElementType
  accent: string
  sections: DocSection[]
}

function DocCallout({
  type = "info",
  title,
  children,
}: {
  type?: "info" | "warning" | "tip" | "danger"
  title?: string
  children: React.ReactNode
}) {
  const config = {
    info: { color: "#22d3ee", bg: "rgba(34,211,238,0.06)", border: "rgba(34,211,238,0.2)", icon: Sparkles },
    warning: { color: "#faad14", bg: "rgba(250,173,20,0.06)", border: "rgba(250,173,20,0.2)", icon: AlertTriangle },
    tip: { color: "#22c55e", bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.2)", icon: CheckCircle2 },
    danger: { color: "#ff4d4f", bg: "rgba(255,77,79,0.06)", border: "rgba(255,77,79,0.2)", icon: AlertTriangle },
  }
  const c = config[type]
  const Icon = c.icon
  return (
    <div className="rounded-lg border p-4 my-4" style={{ borderColor: c.border, backgroundColor: c.bg }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" style={{ color: c.color }} />
        {title && <span className="text-sm font-semibold" style={{ color: c.color }}>{title}</span>}
      </div>
      <div className="text-sm text-gray-300 leading-relaxed">{children}</div>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color = "#22d3ee",
}: {
  icon: React.ElementType
  title: string
  description: string
  color?: string
}) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: `${color}20`, backgroundColor: `${color}06` }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  )
}

function StepItem({ step, title, description, color = "#22d3ee" }: { step: number; title: string; description: string; color?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{ backgroundColor: `${color}20`, border: `1.5px solid ${color}`, color, boxShadow: `0 0 6px ${color}30` }}
      >
        {step}
      </div>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-gray-400 leading-relaxed mt-0.5">{description}</p>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
      {children}
    </h2>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-3 mt-6">
      {children}
    </h3>
  )
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-400 leading-relaxed mb-3">{children}</p>
}

const docGroups: DocGroup[] = [
  {
    label: "快速入门",
    icon: BookOpen,
    accent: "#22d3ee",
    sections: [
      {
        id: "overview",
        title: "平台概述",
        icon: Hexagon,
        content: (
          <div>
            <SectionTitle><Hexagon className="h-5 w-5 text-cyan-400" /> SecMind 平台概述</SectionTitle>
            <Paragraph>SecMind 是一款 AI 驱动的智能安全运营平台，将大语言模型与安全运营深度结合，实现从信号接入、AI调查、案件研判到自动处置的全链路智能化安全运营。平台以"AI为主、人工为辅"的设计理念，大幅缩短威胁检测与响应时间，提升安全运营效率。</Paragraph>
            <DocCallout type="info" title="核心理念">SecMind 采用 AI 优先的安全运营模式——AI 引擎自动完成信号降噪、关联分析、攻击链还原和处置建议，安全分析师只需审核 AI 研判结果并做出关键决策，从而将 MTTD（平均检测时间）和 MTTR（平均响应时间）从小时级压缩到分钟级。</DocCallout>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 核心能力</SubTitle>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-6">
              <FeatureCard icon={Brain} title="AI 自动推理" description="AI引擎自动完成信号关联、攻击链还原、威胁研判，输出置信度和处置建议" color="#22d3ee" />
              <FeatureCard icon={Zap} title="自动处置" description="基于置信度阈值自动执行冻结账号、隔离设备、封禁IP等遏制动作" color="#f97316" />
              <FeatureCard icon={GraduationCap} title="持续学习" description="人工反馈驱动AI模型持续优化，准确率随使用不断提升" color="#a78bfa" />
              <FeatureCard icon={Shield} title="人机协同" description="高置信度自动执行，低置信度人工审批，确保安全可控" color="#22c55e" />
            </div>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 工作流程</SubTitle>
            <div className="space-y-3 mb-6">
              <StepItem step={1} title="信号接入" description="安全设备（EDR、VPN、防火墙、邮件网关等）实时推送原始告警信号" color="#22d3ee" />
              <StepItem step={2} title="AI 预处理" description="AI引擎自动去噪、聚合、上下文补全和风险评分，过滤99%无效告警" color="#06b6d4" />
              <StepItem step={3} title="AI 调查" description="多源证据关联分析，还原完整攻击链，生成多假设研判" color="#a78bfa" />
              <StepItem step={4} title="案件研判" description="AI生成案件，安全分析师审核AI结论，确认或驳回" color="#f59e0b" />
              <StepItem step={5} title="AI 处置" description="基于置信度自动或人工审批执行处置动作" color="#f97316" />
              <StepItem step={6} title="反馈学习" description="人工反馈驱动AI模型权重调整，持续提升准确率" color="#22c55e" />
            </div>
          </div>
        ),
      },
      {
        id: "quick-start",
        title: "快速上手",
        icon: Sparkles,
        content: (
          <div>
            <SectionTitle><Sparkles className="h-5 w-5 text-cyan-400" /> 快速上手指南</SectionTitle>
            <Paragraph>本指南将帮助你快速了解 SecMind 平台的基本使用流程，从登录到完成第一次安全事件处置。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 第一步：查看运营概览</SubTitle>
            <Paragraph>登录后首先进入「运营概览」页面，这里展示了今日告警数、待处理案件、MTTD/MTTR 等关键指标，以及实时告警流。通过概览页面可以快速了解当前安全态势。</Paragraph>
            <DocCallout type="tip" title="提示">关注右上角的实时告警流，它会每8秒自动刷新，帮助你第一时间发现新的安全事件。严重和高危告警会以红色和橙色标识，优先处理。</DocCallout>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 第二步：关注信号接入</SubTitle>
            <Paragraph>切换到「信号接入」页面，查看 AI 引擎实时处理的原始信号。这里可以看到 AI 如何将原始告警去噪、聚合、补全上下文并评分。重点关注高风险集群，它们代表 AI 已识别的潜在攻击行为。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 第三步：审核 AI 调查结果</SubTitle>
            <Paragraph>在「AI 调查」页面，AI 引擎会自动对高风险事件进行深度调查，包括多源证据关联、攻击链还原和假设推理。你可以查看 AI 的推理过程和置信度，对高置信度结论直接确认，对低置信度结论进行人工补充调查。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 第四步：处理案件</SubTitle>
            <Paragraph>在「案件管理」页面审核 AI 生成的案件。每个案件包含 AI 结论、置信度、攻击画像、涉及资产和账号等信息。你可以对案件进行确认或驳回，并提交反馈帮助 AI 学习。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 第五步：执行处置</SubTitle>
            <Paragraph>在「AI 处置」页面查看和执行 AI 建议的处置动作。高置信度（≥85%）的处置动作会自动执行，低置信度的动作需要人工审批。你可以批准、拒绝或取消处置动作。</Paragraph>
            <DocCallout type="warning" title="注意">冻结账号、隔离设备等关键操作会影响业务运行，请务必在审核 AI 推理链后再批准执行。系统支持回滚操作，但建议谨慎审批。</DocCallout>
          </div>
        ),
      },
    ],
  },
  {
    label: "态势感知",
    icon: Monitor,
    accent: "#22d3ee",
    sections: [
      {
        id: "dashboard",
        title: "运营概览",
        icon: LayoutDashboard,
        content: (
          <div>
            <SectionTitle><LayoutDashboard className="h-5 w-5 text-cyan-400" /> 运营概览</SectionTitle>
            <Paragraph>运营概览是平台的核心仪表盘，提供安全运营的全局视角，帮助你快速掌握当前安全态势和运营效率。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 关键指标卡片</SubTitle>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-6">
              <FeatureCard icon={Bell} title="今日告警数" description="今日接入的告警总数，包含所有级别的告警。趋势箭头表示与昨日对比的变化方向" color="#ef4444" />
              <FeatureCard icon={Inbox} title="待处理案件" description="当前需要安全分析师审核处理的案件数量，包括AI推理中和待审核的案件" color="#f97316" />
              <FeatureCard icon={Monitor} title="MTTD（平均检测时间）" description="从威胁发生到被检测到的平均时间，数值越短说明检测能力越强" color="#06b6d4" />
              <FeatureCard icon={Zap} title="MTTR（平均响应时间）" description="从威胁检测到完成处置的平均时间，数值越短说明响应效率越高" color="#a855f7" />
            </div>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 告警趋势图</SubTitle>
            <Paragraph>展示近7天的告警数量趋势，通过柱状图和连线可以直观看到告警量的变化规律。工作日告警量通常高于周末，如果某天告警量异常飙升，可能意味着正在遭受攻击。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 告警级别分布</SubTitle>
            <Paragraph>以环形图展示 P0（严重）、P1（高危）、P2（中危）、P3（低危）四个级别的告警占比。P0 和 P1 级别的告警需要优先处理。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> AI 推理统计</SubTitle>
            <Paragraph>展示 AI 引擎的运行指标：今日推理次数、准确率、知识引用次数、学习更新数。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 实时告警流</SubTitle>
            <Paragraph>实时展示最新的安全告警，每8秒自动刷新。每条告警包含时间戳、来源设备、风险级别和描述信息。</Paragraph>
            <DocCallout type="tip" title="使用建议">建议每天上班后首先查看运营概览，重点关注：1）待处理案件数是否异常增多；2）MTTD/MTTR 是否在正常范围；3）实时告警流中是否有严重级别的告警。</DocCallout>
          </div>
        ),
      },
      {
        id: "notifications",
        title: "通知中心",
        icon: Bell,
        content: (
          <div>
            <SectionTitle><Bell className="h-5 w-5 text-cyan-400" /> 通知中心</SectionTitle>
            <Paragraph>通知中心汇聚了平台所有重要事件的推送通知，包括新案件生成、处置动作完成、审批请求、AI学习更新等。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 通知类型</SubTitle>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-red-400" /><span className="text-white font-medium">严重告警通知</span> — P0级别安全事件，需立即处理</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-orange-400" /><span className="text-white font-medium">审批请求</span> — AI处置动作需要人工审批</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-cyan-400" /><span className="text-white font-medium">案件更新</span> — 案件状态变更通知</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-purple-400" /><span className="text-white font-medium">AI学习通知</span> — AI模型权重更新和学习里程碑</div>
            </div>
          </div>
        ),
      },
      {
        id: "metrics",
        title: "运营指标",
        icon: TrendingUp,
        content: (
          <div>
            <SectionTitle><TrendingUp className="h-5 w-5 text-cyan-400" /> 运营指标</SectionTitle>
            <Paragraph>运营指标页面提供安全运营的深度数据分析，包括告警趋势、处置效率、AI准确率等关键指标的历史趋势和对比分析，帮助安全团队评估运营效果和发现改进空间。</Paragraph>
          </div>
        ),
      },
    ],
  },
  {
    label: "安全运营",
    icon: Shield,
    accent: "#f97316",
    sections: [
      {
        id: "signals",
        title: "信号接入",
        icon: Radio,
        content: (
          <div>
            <SectionTitle><Radio className="h-5 w-5 text-cyan-400" /> 信号接入</SectionTitle>
            <Paragraph>信号接入是安全运营的第一道关口，负责接收来自各种安全设备的原始告警信号，并通过 AI 引擎进行实时预处理，将海量原始告警转化为可操作的安全情报。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 信号来源</SubTitle>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-6">
              <FeatureCard icon={Monitor} title="EDR 终端检测" description="终端行为检测，包括进程异常、文件操作、注册表修改等" color="#22d3ee" />
              <FeatureCard icon={Shield} title="VPN 网关" description="VPN登录行为，包括异地登录、不可能旅行、异常时间登录等" color="#3b82f6" />
              <FeatureCard icon={Settings} title="IAM 身份管理" description="权限变更、异常提权、服务账号滥用等身份相关事件" color="#a855f7" />
              <FeatureCard icon={Bell} title="邮件网关" description="钓鱼邮件检测、恶意附件、异常转发规则等邮件安全事件" color="#f59e0b" />
              <FeatureCard icon={Shield} title="防火墙" description="网络流量异常、C2通信检测、数据外传等网络安全事件" color="#ef4444" />
              <FeatureCard icon={Target} title="DNS 解析" description="DGA域名检测、DNS隧道、异常解析请求等DNS安全事件" color="#22c55e" />
            </div>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> AI 预处理流程</SubTitle>
            <div className="space-y-3 mb-6">
              <StepItem step={1} title="去噪" description="过滤重复告警、已知误报和低价值日志，减少99%的无效告警噪音" color="#22d3ee" />
              <StepItem step={2} title="聚合" description="将同一攻击行为的多个相关告警合并为一个事件，避免告警疲劳" color="#f59e0b" />
              <StepItem step={3} title="上下文补全" description="补充用户画像、资产信息、历史行为基线等上下文，丰富告警信息" color="#a78bfa" />
              <StepItem step={4} title="风险评分" description="基于多维度特征计算风险评分，确定告警优先级" color="#ef4444" />
            </div>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 异常行为发现</SubTitle>
            <Paragraph>AI引擎会自动识别偏离基线的异常行为，包括异常登录模式、异常文件访问、异常网络通信等。每个异常行为都附带AI评估和推理说明。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 风险集群</SubTitle>
            <Paragraph>当多个相关信号指向同一攻击行为时，AI会自动将它们聚合为风险集群。风险集群展示了关联信号数量、综合风险评分、涉及实体和AI评估结论。</Paragraph>
            <DocCallout type="tip" title="使用建议">重点关注"风险集群"区域，AI已经帮你完成了信号关联，风险集群代表的是完整的攻击行为而非孤立告警。</DocCallout>
          </div>
        ),
      },
      {
        id: "investigate",
        title: "AI 调查",
        icon: Crosshair,
        content: (
          <div>
            <SectionTitle><Crosshair className="h-5 w-5 text-cyan-400" /> AI 调查</SectionTitle>
            <Paragraph>AI调查是平台的核心能力，AI引擎自动对高风险事件进行深度调查，包括多源证据关联、攻击链还原、多假设推理和置信度评估。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> AI 推理信息流</SubTitle>
            <Paragraph>AI推理信息流实时展示AI引擎的调查过程：</Paragraph>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-cyan-400" /><span className="text-white font-medium">发现</span> — AI发现新的攻击线索或异常行为</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-purple-400" /><span className="text-white font-medium">关联</span> — AI将多个证据进行时序和因果关联</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-amber-400" /><span className="text-white font-medium">研判</span> — AI基于关联证据做出威胁判断</div>
            </div>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 攻击链还原</SubTitle>
            <Paragraph>AI引擎基于MITRE ATT&CK框架自动还原攻击链路：</Paragraph>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#22d3ee" }} /><span className="font-medium text-white">初始访问</span> — 攻击者进入内网的方式</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#a78bfa" }} /><span className="font-medium text-white">执行</span> — 攻击者执行恶意代码</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#f472b6" }} /><span className="font-medium text-white">持久化</span> — 攻击者建立持续访问</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#fb923c" }} /><span className="font-medium text-white">横向移动</span> — 攻击者在内网扩散</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#ff4d4f" }} /><span className="font-medium text-white">数据外泄</span> — 攻击者窃取数据</div>
            </div>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 多假设推理</SubTitle>
            <Paragraph>AI引擎会对同一事件生成多个假设（如"账号被盗"、"内部威胁"、"误报"），并为每个假设计算置信度。这种多假设机制避免了单一判断的偏差。</Paragraph>
            <DocCallout type="info" title="关于置信度">置信度是AI对判断的确信程度，范围0-100%。≥80%为高置信度，AI会自动执行处置；50-80%为中置信度，需要人工审核；&lt;50%为低置信度，AI会持续监控收集更多证据。</DocCallout>
          </div>
        ),
      },
      {
        id: "cases",
        title: "案件管理",
        icon: Inbox,
        content: (
          <div>
            <SectionTitle><Inbox className="h-5 w-5 text-amber-400" /> 案件管理</SectionTitle>
            <Paragraph>案件管理是安全分析师日常工作的核心页面。AI引擎完成调查后会自动生成案件，每个案件包含完整的AI结论、攻击画像、置信度、涉及资产和账号、处置建议等信息。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 案件状态</SubTitle>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" /><span className="text-white font-medium">AI 推理中</span> — AI引擎正在分析</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-amber-400" /><span className="text-white font-medium">待审核</span> — 等待安全分析师审核</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-white font-medium">已确认</span> — 安全分析师确认AI判断正确</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-red-400" /><span className="text-white font-medium">已驳回</span> — 安全分析师认为AI判断有误</div>
            </div>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 案件信息</SubTitle>
            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2 text-sm text-gray-300"><span className="text-cyan-400 font-mono shrink-0">ID</span>案件唯一标识，如 CASE-2026-0042</div>
              <div className="flex items-start gap-2 text-sm text-gray-300"><span className="text-cyan-400 font-mono shrink-0">攻击画像</span>攻击类型分类，如凭证盗用、C2通信、钓鱼攻击等</div>
              <div className="flex items-start gap-2 text-sm text-gray-300"><span className="text-cyan-400 font-mono shrink-0">风险级别</span>严重/高危/中危/低危</div>
              <div className="flex items-start gap-2 text-sm text-gray-300"><span className="text-cyan-400 font-mono shrink-0">置信度</span>AI判断的确信程度，0-100%</div>
              <div className="flex items-start gap-2 text-sm text-gray-300"><span className="text-cyan-400 font-mono shrink-0">AI 结论</span>AI对攻击行为的总结性判断</div>
              <div className="flex items-start gap-2 text-sm text-gray-300"><span className="text-cyan-400 font-mono shrink-0">处置建议</span>AI建议的处置动作</div>
              <div className="flex items-start gap-2 text-sm text-gray-300"><span className="text-cyan-400 font-mono shrink-0">涉及资产/账号</span>受影响的设备和用户账号列表</div>
            </div>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 反馈机制</SubTitle>
            <Paragraph>每个案件卡片底部有 👍/👎 反馈按钮。点击后可选择反馈类型（调查正确/调查有误/判断正确/判断有误/处置有效/处置无效）并添加评论。这些反馈会驱动AI模型持续学习优化。</Paragraph>
            <DocCallout type="tip" title="最佳实践">即使AI判断正确，也建议添加评论说明确认依据。对于AI判断有误的案件，务必详细说明原因，这是AI改进的最重要输入。</DocCallout>
          </div>
        ),
      },
      {
        id: "response",
        title: "AI 处置",
        icon: Zap,
        content: (
          <div>
            <SectionTitle><Zap className="h-5 w-5 text-orange-400" /> AI 处置</SectionTitle>
            <Paragraph>AI处置页面管理AI引擎建议和执行的安全响应动作。平台采用"置信度驱动"的自动化处置策略——高置信度的动作自动执行，低置信度的动作需要人工审批。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 处置动作类型</SubTitle>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-red-400" /><span className="text-white font-medium">冻结账号</span> — 立即禁用被盗用的用户账号</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-orange-400" /><span className="text-white font-medium">隔离设备</span> — 将受控设备从网络中隔离</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-amber-400" /><span className="text-white font-medium">封禁IP</span> — 在防火墙封禁攻击源IP</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-cyan-400" /><span className="text-white font-medium">重置凭证</span> — 重置VPN密码、MFA令牌等</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-purple-400" /><span className="text-white font-medium">通知安全团队</span> — 发送告警通知</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-white font-medium">保全取证数据</span> — 远程采集内存镜像和日志</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-2 w-2 rounded-full bg-blue-400" /><span className="text-white font-medium">监控用户活动</span> — 增强行为监控</div>
            </div>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> AI 推理链</SubTitle>
            <Paragraph>每个处置动作都附带完整的AI推理链，展示AI如何从事件发现到处置决策的全过程。推理链中包含每一步的证据来源、时间戳和方向（支持/反对/中性）。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 处置策略</SubTitle>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">账号失陷</span> — 置信度 ≥ 85% 触发冻结→重置→隔离</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">C2通信</span> — 置信度 ≥ 90% 触发封禁→隔离→通知</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">暴力破解</span> — 失败次数 ≥ 50 触发封禁→锁定→启用MFA</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">数据外泄</span> — 外传数据 ≥ 100MB 触发阻断→取证→通知</div>
            </div>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 回滚机制</SubTitle>
            <Paragraph>如果处置动作执行后发现误判，系统支持回滚操作，包括解冻账号、解除IP封禁等。所有回滚操作都会记录在执行日志中。</Paragraph>
            <DocCallout type="danger" title="安全提示">自动处置动作会直接影响生产环境。建议初期将自动处置阈值设置较高（如90%），随着AI准确率提升再逐步降低阈值。</DocCallout>
          </div>
        ),
      },
      {
        id: "hunting",
        title: "威胁狩猎",
        icon: Target,
        content: (
          <div>
            <SectionTitle><Target className="h-5 w-5 text-purple-400" /> 威胁狩猎</SectionTitle>
            <Paragraph>威胁狩猎是主动安全防御功能，允许安全分析师基于威胁情报和假设主动搜索内网中的潜在威胁。与被动等待告警不同，威胁狩猎是主动出击，寻找可能绕过现有检测规则的隐蔽攻击。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 狩猎模式</SubTitle>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">假设驱动</span> — 基于威胁情报和经验假设主动搜索</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">IOC 驱动</span> — 基于威胁情报中的IOC搜索匹配</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">异常驱动</span> — 基于统计异常和基线偏离发现未知威胁</div>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    label: "AI 引擎",
    icon: GraduationCap,
    accent: "#a78bfa",
    sections: [
      {
        id: "learning",
        title: "反馈学习",
        icon: GraduationCap,
        content: (
          <div>
            <SectionTitle><GraduationCap className="h-5 w-5 text-purple-400" /> 反馈学习</SectionTitle>
            <Paragraph>反馈学习是 SecMind 平台持续进化的核心机制。安全分析师的每一次反馈都会驱动AI模型调整权重、优化推理规则，使平台的检测和研判准确率随使用不断提升。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 反馈流程</SubTitle>
            <div className="space-y-3 mb-6">
              <StepItem step={1} title="人工确认/驳回" description="安全分析师在案件管理页面审核AI结论，给出反馈" color="#f59e0b" />
              <StepItem step={2} title="AI 更新权重" description="AI引擎根据反馈调整相关推理规则的权重" color="#22d3ee" />
              <StepItem step={3} title="未来更准确" description="调整后的模型在未来遇到类似场景时做出更准确的判断" color="#22c55e" />
            </div>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> AI 成长指标</SubTitle>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">准确率趋势</span> — AI研判准确率的历史变化曲线</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">误报率趋势</span> — AI误报率的历史变化（持续下降）</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">能力雷达图</span> — 攻击识别、关联推理、攻击链还原、处置建议、误报识别五个维度</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">学习里程碑</span> — AI能力提升的关键节点</div>
            </div>
            <DocCallout type="tip" title="持续反馈的重要性">AI的准确率提升是一个渐进过程，需要持续的人工反馈。建议安全团队将反馈作为日常工作的一部分，每次审核案件时都给出反馈。</DocCallout>
          </div>
        ),
      },
      {
        id: "knowledge",
        title: "AI 知识库",
        icon: BookOpen,
        content: (
          <div>
            <SectionTitle><BookOpen className="h-5 w-5 text-indigo-400" /> AI 知识库</SectionTitle>
            <Paragraph>AI知识库是AI引擎的知识基础，包含威胁情报、攻击模式、MITRE ATT&CK映射、历史案例等知识。AI在推理过程中会引用知识库中的内容，确保研判有据可依。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 知识类型</SubTitle>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">威胁情报</span> — 已知恶意IP、域名、文件哈希等IOC指标</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">攻击模式库</span> — 基于MITRE ATT&CK的攻击技术映射</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">历史案例</span> — 过往安全事件的处置经验和教训</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">处置策略</span> — 不同攻击类型的标准处置流程</div>
            </div>
          </div>
        ),
      },
      {
        id: "workflows",
        title: "工作流编排",
        icon: Workflow,
        content: (
          <div>
            <SectionTitle><Workflow className="h-5 w-5 text-amber-400" /> 工作流编排</SectionTitle>
            <Paragraph>工作流编排允许安全团队自定义安全运营的自动化流程。你可以定义从信号检测到处置完成的完整工作流，包括条件判断、人工审批节点和自动执行动作。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 工作流要素</SubTitle>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">触发条件</span> — 什么事件启动工作流</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">判断节点</span> — 基于条件分支选择不同的处理路径</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">审批节点</span> — 需要人工审批后才能继续</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">执行动作</span> — 自动执行的安全响应动作</div>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    label: "平台管理",
    icon: Settings,
    accent: "#64748b",
    sections: [
      {
        id: "datasource",
        title: "数据源管理",
        icon: Database,
        content: (
          <div>
            <SectionTitle><Database className="h-5 w-5 text-emerald-400" /> 数据源管理</SectionTitle>
            <Paragraph>数据源管理页面用于配置和管理接入平台的安全数据源。支持 EDR、VPN、防火墙、邮件网关、DNS 服务器、IAM 等数据源类型。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 配置步骤</SubTitle>
            <div className="space-y-3 mb-6">
              <StepItem step={1} title="添加数据源" description="选择数据源类型，填写连接信息" color="#22c55e" />
              <StepItem step={2} title="测试连接" description="验证数据源连接是否正常" color="#22d3ee" />
              <StepItem step={3} title="配置采集规则" description="设置需要采集的日志类型和过滤条件" color="#f59e0b" />
              <StepItem step={4} title="启用数据源" description="确认配置无误后启用，开始实时采集" color="#a78bfa" />
            </div>
          </div>
        ),
      },
      {
        id: "assets",
        title: "资产管理",
        icon: Server,
        content: (
          <div>
            <SectionTitle><Server className="h-5 w-5 text-cyan-400" /> 资产管理</SectionTitle>
            <Paragraph>资产管理页面维护企业内网的所有资产信息，包括服务器、终端设备、网络设备等。准确的资产信息是AI引擎进行关联分析和影响评估的基础。</Paragraph>
          </div>
        ),
      },
      {
        id: "users",
        title: "用户管理",
        icon: Users,
        content: (
          <div>
            <SectionTitle><Users className="h-5 w-5 text-blue-400" /> 用户管理</SectionTitle>
            <Paragraph>用户管理页面管理平台的用户账号和权限。支持基于角色的访问控制（RBAC）。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 角色类型</SubTitle>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">超级管理员</span> — 拥有所有权限</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">安全分析师</span> — 可审核案件、执行处置、提交反馈</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">只读用户</span> — 只能查看数据，不能执行操作</div>
            </div>
          </div>
        ),
      },
      {
        id: "integrations",
        title: "集成管理",
        icon: Plug,
        content: (
          <div>
            <SectionTitle><Plug className="h-5 w-5 text-teal-400" /> 集成管理</SectionTitle>
            <Paragraph>集成管理页面管理平台与第三方系统的集成，包括SIEM、SOAR、工单系统、通知渠道等。通过集成可以将SecMind的AI能力嵌入到现有的安全运营体系中。</Paragraph>
          </div>
        ),
      },
      {
        id: "system",
        title: "系统设置",
        icon: Settings,
        content: (
          <div>
            <SectionTitle><Settings className="h-5 w-5 text-slate-400" /> 系统设置</SectionTitle>
            <Paragraph>系统设置页面提供平台的全局配置，包括AI引擎参数、通知策略、数据保留策略、安全策略等。</Paragraph>
            <SubTitle><Sparkles className="h-4 w-4 text-cyan-400" /> 关键配置项</SubTitle>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">自动处置阈值</span> — 触发自动处置的置信度阈值（建议≥85%）</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">数据保留期限</span> — 原始日志和案件的保留时间</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">通知策略</span> — 告警通知的触发条件和发送渠道</div>
              <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-white font-medium">语言设置</span> — 平台界面语言（中文/英文）</div>
            </div>
          </div>
        ),
      },
    ],
  },
]

export default function DocsGuidePage() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("overview")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "快速入门": true,
    "态势感知": false,
    "安全运营": false,
    "AI 引擎": false,
    "平台管理": false,
  })
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [activeSection])

  const activeContent = docGroups
    .flatMap((g) => g.sections)
    .find((s) => s.id === activeSection)?.content

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <div className="min-h-screen bg-[#020a1a] text-white overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020a1a]/70 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 shadow-[0_0_16px_rgba(0,212,255,0.3)]">
              <Shield className="size-4 text-[#020a1a]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tracking-tight">SecMind</span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-2 py-0.5 text-[10px] font-medium text-cyan-400">
                <Sparkles className="size-2.5" />
                AI研判平台
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`relative px-4 py-2 text-sm transition-colors duration-200 rounded-lg ${
                  pathname === item.href ? "text-cyan-300 bg-white/[0.04]" : "text-slate-400 hover:text-cyan-300 hover:bg-white/[0.04]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="w-px h-5 bg-white/[0.06] mx-2" />
            <Link href="/login">
              <Button variant="ghost" size="default" className="text-slate-400 hover:text-white hover:bg-white/[0.04] text-sm h-9 px-5">
                登录
              </Button>
            </Link>
            <Link href="/login">
              <Button size="default" className="bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] font-semibold shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] hover:brightness-110 transition-colors text-sm h-9 px-5">
                免费体验
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <button className="md:hidden text-slate-400 hover:text-cyan-400 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="打开导航菜单" aria-expanded={mobileMenuOpen}>
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.04] bg-[#020a1a]/95 backdrop-blur-2xl px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`block text-sm rounded-md px-3 py-2.5 transition-colors ${
                  pathname === item.href ? "text-cyan-300 bg-white/[0.04]" : "text-slate-400 hover:text-cyan-300 hover:bg-white/[0.04]"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="pt-20 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent mb-2">
              使用指南
            </h1>
            <p className="text-gray-400">了解 SecMind 平台的每个功能，快速上手智能安全运营</p>
          </div>

          <div className="flex gap-6 min-h-[calc(100vh-220px)]">
            <nav aria-label="文档导航" className="w-56 shrink-0 rounded-xl border border-cyan-500/10 bg-[#0a1628]/60 backdrop-blur-xl overflow-y-auto sticky top-24 self-start scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
              <div className="p-3 space-y-1">
                {docGroups.map((group) => {
                  const isExpanded = expandedGroups[group.label] !== false
                  const GroupIcon = group.icon
                  const isGroupActive = group.sections.some((s) => s.id === activeSection)
                  return (
                    <div key={group.label}>
                      <button
                        onClick={() => toggleGroup(group.label)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                          isGroupActive ? "text-white/80" : "text-white/40 hover:text-white/60"
                        }`}
                        aria-expanded={isExpanded}
                      >
                        <GroupIcon className="h-3.5 w-3.5 shrink-0" style={{ color: isGroupActive ? group.accent : undefined }} />
                        <span className="truncate flex-1 text-left">{group.label}</span>
                        {isExpanded ? <ChevronDown className="h-3 w-3 shrink-0 text-white/20" /> : <ChevronRight className="h-3 w-3 shrink-0 text-white/20" />}
                      </button>
                      {isExpanded && (
                        <div className="ml-2 pl-3 border-l border-white/[0.06] space-y-0.5 mt-0.5">
                          {group.sections.map((section) => {
                            const isActive = activeSection === section.id
                            const SectionIcon = section.icon
                            return (
                              <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                                  isActive
                                    ? "text-white bg-cyan-500/10 border border-cyan-500/20"
                                    : "text-white/40 hover:text-white/60 hover:bg-white/[0.03] border border-transparent"
                                }`}
                              >
                                <SectionIcon className="h-3 w-3 shrink-0" style={{ color: isActive ? "#22d3ee" : undefined }} />
                                <span className="truncate">{section.title}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </nav>

            <div
              ref={contentRef}
              className="flex-1 min-w-0 rounded-xl border border-cyan-500/10 bg-[#0a1628]/60 backdrop-blur-xl p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent"
            >
              {activeContent}
            </div>
          </div>
        </div>
      </div>

      <footer className="relative border-t border-white/[0.04] bg-[#020a1a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="size-5 text-cyan-400" />
              <span className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">SecMind</span>
            </Link>
            <p className="text-xs text-gray-600">© 2026 SecMind. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-xs text-gray-600 hover:text-cyan-400 transition-colors">隐私政策</Link>
              <Link href="/terms" className="text-xs text-gray-600 hover:text-cyan-400 transition-colors">服务条款</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
