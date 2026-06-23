"use client"

import { memo } from "react"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  Sparkles,
  FileText,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useLocaleStore } from "@/store/locale-store"
import { SecurityScoreGauge } from "./SecurityScoreGauge"

interface KPIData {
  icon: React.ElementType
  label: string
  value: string | number
  unit?: string
  color: string
  trend?: string
  trendGood?: boolean
  sparkline?: number[]
  href?: string
}

interface DashboardHeroProps {
  securityScore: number
  previousScore: number
  kpis: KPIData[]
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 48
  const h = 20
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ")

  return (
    <svg width={w} height={h} className="opacity-40 group-hover:opacity-70 transition-opacity">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MiniKPICard({ icon: Icon, label, value, unit, color, trend, trendGood, sparkline, href }: KPIData) {
  const trendUp = trend?.startsWith("+")
  const isGood = trendGood ?? true

  const card = (
    <div className="group relative flex items-center gap-3 rounded-lg border border-border/50 bg-card/40 px-4 py-3 hover:border-primary/20 hover:bg-card/80 transition-colors duration-200 cursor-pointer overflow-hidden">
      {/* 悬停氛围光 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,212,255,0.04)_0%,transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div
        className="flex size-9 items-center justify-center rounded-lg shrink-0 relative"
        style={{ backgroundColor: `${color}12`, border: `1px solid ${color}25` }}
      >
        <Icon className="size-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0 relative">
        <div className="text-[11px] font-medium text-muted-foreground truncate">{label}</div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-lg font-bold tabular-nums tracking-tight text-foreground font-[family-name:var(--font-space-grotesk)]">
            {value}
          </span>
          {unit && <span className="text-[10px] text-muted-foreground/60">{unit}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 relative">
        {trend && (
          <div className={cn(
            "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            trendUp
              ? (isGood ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")
              : (isGood ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500")
          )}>
            {trendUp ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
            {trend}
          </div>
        )}
        {sparkline && <MiniSparkline data={sparkline} color={color} />}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{card}</Link>
  }
  return card
}

const AI_SUGGESTIONS = [
  { id: "s1", priority: "critical", text: "建议立即处理 ALT004 — Cobalt Strike Beacon 关联 3 个核心资产", icon: Zap },
  { id: "s2", priority: "high", text: "VPN 异常登录 ALT003 关联用户存在横向移动痕迹，建议启动 AI 调查", icon: Sparkles },
  { id: "s3", priority: "medium", text: "过去 24h 钓鱼攻击上升 35%，建议加强邮件网关规则", icon: FileText },
]

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: "#ff2d55", label: "紧急" },
  high: { color: "#ff9500", label: "重要" },
  medium: { color: "#00d4ff", label: "建议" },
} as const

const QUICK_ACTIONS = [
  { label: "创建案件", icon: FileText, href: "/cases", desc: "关联告警组建调查" },
  { label: "AI调查", icon: Sparkles, href: "/investigate", desc: "智能分析安全事件" },
  { label: "查看报告", icon: FileText, href: "/reports", desc: "安全态势周报" },
]

export const DashboardHero = memo(function DashboardHero({
  securityScore,
  previousScore,
  kpis,
}: DashboardHeroProps) {
  const { t } = useLocaleStore()
  const scoreDiff = securityScore - previousScore
  const scoreTrend = scoreDiff > 0 ? "up" : scoreDiff < 0 ? "down" : "stable"

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card ">
      {/* 赛博背景光效 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,102,255,0.08)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,212,255,0.05)_0%,transparent_50%)]" />
      <div className="dark:absolute dark:inset-0 dark:bg-[radial-gradient(ellipse_at_top_right,rgba(0,212,255,0.06)_0%,transparent_50%)]" />

      <div className="relative p-5">
        {/* 标题行 */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
              <ShieldCheck className="size-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-foreground font-[family-name:var(--font-space-grotesk)]">
              {t("dashboard.securityPosture")}
            </h1>
          </div>
          {/* 快速操作 */}
          <div className="flex items-center gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                title={action.desc}
                className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/50 bg-background/40 text-[11px] font-medium text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-colors duration-200"
              >
                <action.icon className="size-3" />
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch gap-5">
          {/* 左侧：安全评分 + 趋势 + 快速操作 */}
          <div className="flex flex-col items-center lg:items-start gap-3 shrink-0">
            <SecurityScoreGauge score={securityScore} previousScore={previousScore} size={140} />
            <div className="flex items-center gap-3">
              <div className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                scoreTrend === "up"
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/25"
                  : scoreTrend === "down"
                  ? "bg-red-500/10 text-red-500 border border-red-500/25"
                  : "bg-muted text-muted-foreground border border-border"
              )}>
                {scoreTrend === "up" ? <TrendingUp className="size-3" /> : scoreTrend === "down" ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
                {scoreTrend === "up" ? t("dashboard.scoreImproved") : scoreTrend === "down" ? t("dashboard.scoreDeclined") : t("dashboard.scoreStable")}
                {scoreDiff !== 0 && <span className="ml-0.5">{scoreDiff > 0 ? "+" : ""}{scoreDiff}</span>}
              </div>
            </div>
          </div>

          {/* 中间：AI 安全建议 — 命令终端风格 */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/8 border border-primary/15">
                <Sparkles className="size-3 text-primary" />
                <span className="text-[10px] font-semibold text-primary tracking-wider font-[family-name:var(--font-space-grotesk)]">
                  AI 安全建议
                </span>
              </span>
              <span className="text-[9px] font-mono text-muted-foreground/70">基于实时威胁情报</span>
            </div>
            {AI_SUGGESTIONS.map((suggestion, idx) => {
              const SIcon = suggestion.icon
              const pCfg = PRIORITY_CONFIG[suggestion.priority]
              return (
                <div
                  key={suggestion.id}
                  className="group relative flex items-start gap-3 rounded-lg border border-border/60 bg-background/30 px-3 py-2.5 hover:border-primary/15 hover:bg-background/50 transition-colors duration-200 cursor-pointer"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* 优先级指示条 */}
                  <div
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: pCfg.color, boxShadow: `0 0 6px ${pCfg.color}40` }}
                  />
                  {/* 优先级标签 */}
                  <div className="flex items-start gap-2.5 flex-1 min-w-0 pl-2.5">
                    <div
                      className="flex size-6 items-center justify-center rounded-md shrink-0 mt-0.5"
                      style={{ backgroundColor: `${pCfg.color}10`, border: `1px solid ${pCfg.color}20` }}
                    >
                      <SIcon className="size-3" style={{ color: pCfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-[9px] font-bold tracking-wider uppercase"
                          style={{ color: pCfg.color }}
                        >
                          [{pCfg.label}]
                        </span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-muted-foreground/90 group-hover:text-foreground transition-colors">
                        {suggestion.text}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* KPI 行 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5">
          {kpis.map((kpi) => (
            <MiniKPICard key={kpi.label} {...kpi} />
          ))}
        </div>
      </div>
    </div>
  )
})
