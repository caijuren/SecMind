"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Shield,
  Sparkles,
  Brain,
  Crosshair,
  Eye,
  Link2,
  Zap,
  ArrowRight,
  Menu,
  X,
  CheckCircle2,
  Users,
  Globe,
  Lock,
  TrendingUp,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  { label: "首页", href: "/" },
  { label: "解决方案", href: "/solutions" },
  { label: "文档", href: "/docs" },
  { label: "定价", href: "/pricing" },
]

const features = [
  {
    icon: Brain,
    title: "AI 智能推理",
    desc: "大语言模型驱动，自动分析安全信号，推理攻击意图，识别真正威胁",
    color: "cyan",
  },
  {
    icon: Crosshair,
    title: "攻击研判引擎",
    desc: "基于 MITRE ATT&CK 框架，自动构建攻击假设，映射完整攻击链",
    color: "red",
  },
  {
    icon: Eye,
    title: "自主调查",
    desc: "AI 自主完成深度调查，生成攻击链与推理结论，分析师仅需复核",
    color: "amber",
  },
  {
    icon: Link2,
    title: "证据链构建",
    desc: "跨数据源自动关联，构建完整攻击证据链，研判有据可依",
    color: "teal",
  },
  {
    icon: Shield,
    title: "案件研判闭环",
    desc: "从调查到案件到处置的完整闭环，确保每个威胁都可追溯可响应",
    color: "purple",
  },
  {
    icon: Zap,
    title: "AI 自动处置",
    desc: "基于置信度的自动处置策略，从研判到响应分钟级闭环",
    color: "emerald",
  },
]

const stats = [
  { value: "99%", label: "告警降噪率" },
  { value: "85%", label: "自动化处置率" },
  { value: "10x", label: "运营效率提升" },
  { value: "24/7", label: "AI 持续监控" },
]

const steps = [
  {
    step: "01",
    title: "信号接入",
    desc: "无缝对接 EDR、VPN、防火墙、邮件网关等安全设备，实时接收告警信号",
  },
  {
    step: "02",
    title: "AI 预处理",
    desc: "自动去噪、聚合、上下文补全，将海量告警转化为可操作情报",
  },
  {
    step: "03",
    title: "智能调查",
    desc: "AI 自动进行多源关联分析，还原攻击链，生成研判结论",
  },
  {
    step: "04",
    title: "自动处置",
    desc: "高置信度动作自动执行，低置信度动作人工审批，平衡效率与安全",
  },
]

export default function DocsPage() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
                AI 驱动
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`relative px-4 py-2 text-sm transition-all duration-200 rounded-lg ${
                  pathname === item.href
                    ? "text-cyan-300 bg-white/[0.04]"
                    : "text-slate-400 hover:text-cyan-300 hover:bg-white/[0.04]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="w-px h-5 bg-white/[0.06] mx-2" />
            <Link href="/login">
              <Button
                variant="ghost"
                size="default"
                className="text-slate-400 hover:text-white hover:bg-white/[0.04] text-sm h-9 px-5"
              >
                登录
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="default"
                className="bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] font-semibold shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] hover:brightness-110 transition-all text-sm h-9 px-5"
              >
                免费体验
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden text-slate-400 hover:text-cyan-400 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
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
                  pathname === item.href
                    ? "text-cyan-300 bg-white/[0.04]"
                    : "text-slate-400 hover:text-cyan-300 hover:bg-white/[0.04]"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-1.5 text-sm text-cyan-400 mb-6">
              <Sparkles className="size-4" />
              AI 驱动的智能安全运营平台
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                SecMind
              </span>
              <br />
              <span className="text-white/90">让安全运营更智能</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 leading-relaxed mb-10 max-w-2xl mx-auto">
              将大语言模型与安全运营深度融合，实现从威胁检测、AI 调查到自动处置的全链路智能化，
              让安全分析师从繁重的告警中解放出来，专注于真正的威胁。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] font-bold shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:shadow-[0_0_50px_rgba(0,212,255,0.6)] hover:brightness-110 transition-all w-full sm:w-auto"
                >
                  免费试用
                  <ArrowRight className="size-5 ml-2" />
                </Button>
              </Link>
              <Link href="/docs/guide">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400/50 w-full sm:w-auto"
                >
                  查看使用文档
                  <ChevronRight className="size-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm"
              >
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mb-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                六大核心能力
              </span>
            </h2>
            <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
              SecMind 平台提供完整的安全运营智能化解决方案，覆盖从检测到响应的全流程
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => {
                const colorMap: Record<string, string> = {
                  cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20",
                  red: "from-red-500/20 to-red-500/5 border-red-500/20",
                  amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20",
                  teal: "from-teal-500/20 to-teal-500/5 border-teal-500/20",
                  purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20",
                  emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20",
                }
                const iconColorMap: Record<string, string> = {
                  cyan: "text-cyan-400",
                  red: "text-red-400",
                  amber: "text-amber-400",
                  teal: "text-teal-400",
                  purple: "text-purple-400",
                  emerald: "text-emerald-400",
                }
                return (
                  <div
                    key={feature.title}
                    className={`p-6 rounded-xl border bg-gradient-to-br ${colorMap[feature.color]} backdrop-blur-sm group hover:scale-[1.02] transition-all`}
                  >
                    <div className={`inline-flex p-3 rounded-lg bg-white/5 mb-4 ${iconColorMap[feature.color]}`}>
                      <feature.icon className="size-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mb-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                如何工作
              </span>
            </h2>
            <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
              简单四步，实现智能化安全运营
            </p>
            <div className="grid md:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <div key={step.step} className="relative">
                  <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm h-full">
                    <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400/30 to-teal-400/30 bg-clip-text text-transparent mb-4">
                      {step.step}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                      <ArrowRight className="size-5 text-cyan-400/30" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-transparent to-teal-500/10 p-8 sm:p-12 text-center backdrop-blur-sm">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              准备好体验 AI 驱动的安全运营了吗？
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              立即开始免费试用，让 SecMind 成为您安全团队的智能助手
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] font-bold shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:shadow-[0_0_50px_rgba(0,212,255,0.6)] hover:brightness-110 transition-all w-full sm:w-auto"
                >
                  立即开始
                  <ArrowRight className="size-5 ml-2" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/5 w-full sm:w-auto"
                >
                  查看定价
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative border-t border-white/[0.04] bg-[#020a1a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="size-5 text-cyan-400" />
              <span className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                SecMind
              </span>
            </Link>
            <p className="text-xs text-gray-600">© 2026 SecMind. All rights reserved.</p>
            <div className="flex items-center gap-6">
              {["隐私政策", "服务条款"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-xs text-gray-600 hover:text-cyan-400 transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
