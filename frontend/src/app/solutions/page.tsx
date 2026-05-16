"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Sparkles,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  ArrowRight,
  Menu,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DynamicContactFormDialog } from "@/components/dynamic-imports";

const navItems = [
  { label: "首页", href: "/" },
  { label: "解决方案", href: "/solutions" },
  { label: "文档", href: "/docs" },
  { label: "定价", href: "/pricing" },
];

const solutions = [
  {
    icon: TrendingUp,
    title: "金融行业",
    description: "防御凭证攻击、内部人员威胁和APT攻击，满足合规审计要求",
    challenges: [
      "每日海量交易告警",
      "合规审计压力",
      "内部人员威胁难以发现",
    ],
    approach: [
      "AI信号推理过滤90%噪音信号",
      "攻击研判引擎自动构建证据链",
      "调查建议推荐让分析师快速决策",
    ],
    tags: ["凭证攻击防御", "内部威胁检测", "合规审计"],
    color: "blue",
    stat: { value: "87%", label: "降噪率" },
    riskBadge: { text: "风险 高", cls: "border-red-200 bg-red-50 text-red-600" },
  },
  {
    icon: Cpu,
    title: "科技企业",
    description: "保护知识产权和核心代码仓库，检测API滥用和供应链攻击",
    challenges: [
      "供应链攻击面扩大",
      "API滥用难以追踪",
      "知识产权泄露风险",
    ],
    approach: [
      "证据链自动构建关联多源信号",
      "AI研判引擎识别复杂攻击模式",
      "自动响应执行快速止损",
    ],
    tags: ["知识产权保护", "供应链安全", "API滥用检测"],
    color: "violet",
    stat: { value: "72%", label: "覆盖率" },
    riskBadge: { text: "风险 中", cls: "border-amber-200 bg-amber-50 text-amber-600" },
  },
  {
    icon: ShieldCheck,
    title: "政府机构",
    description: "国家级威胁检测与响应，关键基础设施防护",
    challenges: [
      "APT攻击隐蔽性强",
      "跨部门协同困难",
      "关键基础设施保护要求高",
    ],
    approach: [
      "七层安全决策架构确保流程合规",
      "AI推理引擎识别高级威胁",
      "调查画布支持多人协同研判",
    ],
    tags: ["国家级威胁", "基础设施防护", "情报共享"],
    color: "red",
    stat: { value: "91%", label: "检出率" },
    riskBadge: { text: "风险 极高", cls: "border-red-300 bg-red-100 text-red-700" },
  },
  {
    icon: Stethoscope,
    title: "医疗健康",
    description: "保护患者隐私数据，防御勒索软件攻击",
    challenges: [
      "勒索软件针对性强",
      "患者数据合规要求严格",
      "医疗设备安全漏洞多",
    ],
    approach: [
      "AI推理引擎优先处理高危信号",
      "自动响应执行快速隔离勒索软件",
      "证据链支持合规审计追溯",
    ],
    tags: ["患者数据保护", "勒索防御", "医疗IoT安全"],
    color: "teal",
    stat: { value: "65%", label: "响应提速" },
    riskBadge: { text: "风险 中", cls: "border-teal-200 bg-teal-50 text-teal-600" },
  },
];

const colorMap: Record<string, { border: string; bg: string; icon: string; text: string; badge: string; glow: string }> = {
  blue: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    icon: "text-blue-600",
    text: "text-blue-700",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    glow: "hover:shadow-[0_18px_34px_rgba(59,130,246,0.14)]",
  },
  violet: {
    border: "border-violet-500/30",
    bg: "bg-violet-500/10",
    icon: "text-violet-600",
    text: "text-violet-700",
    badge: "border-violet-200 bg-violet-50 text-violet-700",
    glow: "hover:shadow-[0_18px_34px_rgba(139,92,246,0.14)]",
  },
  red: {
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    icon: "text-red-600",
    text: "text-red-700",
    badge: "border-red-200 bg-red-50 text-red-700",
    glow: "hover:shadow-[0_18px_34px_rgba(239,68,68,0.14)]",
  },
  teal: {
    border: "border-teal-500/30",
    bg: "bg-teal-500/10",
    icon: "text-teal-600",
    text: "text-teal-700",
    badge: "border-teal-200 bg-teal-50 text-teal-700",
    glow: "hover:shadow-[0_18px_34px_rgba(20,184,166,0.14)]",
  },
};

function AnimateIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`transition-[opacity,transform] duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function SolutionsPage() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 shadow-[0_0_16px_rgba(6,182,212,0.3)]">
              <Shield className="size-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900 tracking-tight">
                SecMind
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/[0.08] px-2 py-0.5 text-[10px] font-medium text-cyan-600">
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
                  pathname === item.href
                    ? "text-cyan-700 bg-cyan-50"
                    : "text-slate-600 hover:text-cyan-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="w-px h-5 bg-slate-200 mx-2" />
            <Link href="/login">
              <Button
                variant="ghost"
                size="default"
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm h-9 px-5"
              >
                登录
              </Button>
            </Link>
            <Button
              size="default"
              className="rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold shadow-[0_8px_24px_rgba(6,182,212,0.28)] hover:shadow-[0_12px_30px_rgba(6,182,212,0.38)] hover:-translate-y-0.5 transition-[shadow,transform] text-sm h-9 px-5"
            >
              免费体验
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </div>

          <button
            className="md:hidden text-slate-500 hover:text-cyan-600 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="打开导航菜单"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-2xl px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`block text-sm rounded-md px-3 py-2.5 transition-colors ${
                  pathname === item.href
                    ? "text-cyan-700 bg-cyan-50"
                    : "text-slate-600 hover:text-cyan-700 hover:bg-slate-100"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-3 border-t border-slate-200 mt-2">
              <Link href="/login" className="flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  登录
                </Button>
              </Link>
              <Link href="/login" className="flex-1">
                <Button
                  size="sm"
                  className="w-full rounded-lg border border-cyan-400/20 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold shadow-[0_8px_22px_rgba(6,182,212,0.24)]"
                >
                  免费体验
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section — 对齐首页 Bento Grid 风格 */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.12)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(13,148,136,0.08)_0%,transparent_60%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <Badge className="border-cyan-500/30 bg-cyan-50 text-cyan-700 px-3 py-1 text-sm">
                🏢 行业解决方案
              </Badge>

              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-600 bg-clip-text text-transparent leading-tight">
                  解决方案
                </h1>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">
                  覆盖多行业的安全决策方案
                </h2>
                <p className="text-lg text-slate-500 max-w-lg">
                  从金融到医疗，SecMind为每个行业提供量身定制的AI安全研判能力，让安全运营从被动走向主动
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <DynamicContactFormDialog>
                  <Button
                    size="lg"
                    className="rounded-xl border border-cyan-500/20 bg-cyan-600 text-white font-semibold shadow-[0_10px_26px_rgba(6,182,212,0.28)] hover:bg-cyan-500 hover:shadow-[0_14px_32px_rgba(6,182,212,0.36)] hover:-translate-y-0.5 transition-[shadow,transform] text-base px-6 h-11"
                  >
                    联系销售
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </DynamicContactFormDialog>
                <Link href="/pricing">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-cyan-300 bg-white text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 text-base px-6 h-11"
                  >
                    查看定价
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600 tabular-nums">4</div>
                  <div className="text-xs text-slate-500 mt-1">覆盖行业</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600 tabular-nums">99%</div>
                  <div className="text-xs text-slate-500 mt-1">告警降噪</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600 tabular-nums">&lt;5min</div>
                  <div className="text-xs text-slate-500 mt-1">调查启动</div>
                </div>
              </div>
            </div>

            {/* Bento Grid — 四行业卡片 */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 grid-rows-2 gap-3">
                {solutions.map((sol) => {
                  const colors = colorMap[sol.color];
                  const Icon = sol.icon;
                  return (
                    <div
                      key={sol.title}
                      className={`group rounded-2xl border ${colors.border} bg-white p-5 shadow-[0_0_40px_rgba(0,0,0,0.06)] transition-[shadow,transform] duration-300 ${colors.glow} hover:-translate-y-0.5 cursor-pointer`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`inline-flex items-center justify-center size-10 rounded-xl ${colors.bg}`}>
                          <Icon className={`size-5 ${colors.icon}`} />
                        </div>
                        <Badge className={`text-[9px] ${sol.riskBadge.cls}`}>{sol.riskBadge.text}</Badge>
                      </div>
                      <h3 className={`text-sm font-semibold ${colors.text} mb-1`}>{sol.title}</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{sol.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex gap-1">
                          {sol.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} className={`text-[8px] ${colors.badge} px-1.5 py-0`}>{tag}</Badge>
                          ))}
                        </div>
                        <span className={`text-xs font-bold ${colors.icon}`}>{sol.stat.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="absolute -top-4 -right-4 w-24 h-24 bg-cyan-400/10 rounded-full blur-2xl" aria-hidden="true" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {/* 行业详情 — colorMap 多色系 Icon 卡片（对齐首页核心能力） */}
      <section className="relative py-24 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.05)_0%,transparent_60%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-4">
                行业深度方案
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                每个行业的SecMind定制化方案，从挑战识别到AI赋能的全链路解决路径
              </p>
            </div>
          </AnimateIn>

          <div className="grid sm:grid-cols-2 gap-6">
            {solutions.map((sol, idx) => {
              const colors = colorMap[sol.color];
              const Icon = sol.icon;
              return (
                <AnimateIn key={sol.title} delay={idx * 120}>
                  <div
                    className={`group relative rounded-2xl border ${colors.border} bg-white p-6 sm:p-8 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-[shadow,transform] duration-300 ${colors.glow} hover:-translate-y-0.5`}
                  >
                    <div className={`inline-flex items-center justify-center size-12 rounded-xl ${colors.bg} mb-4`}>
                      <Icon className={`size-6 ${colors.icon}`} />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className={`text-lg font-semibold ${colors.text}`}>{sol.title}</h3>
                      <Badge className={`text-[9px] ${sol.riskBadge.cls}`}>{sol.riskBadge.text}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">{sol.description}</p>

                    <div className="space-y-4">
                      <div className="rounded-xl border border-red-500/12 bg-red-500/[0.02] p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="size-3.5 text-red-500" />
                          <span className="text-xs font-semibold text-red-600">核心挑战</span>
                        </div>
                        <ul className="space-y-2">
                          {sol.challenges.map((challenge) => (
                            <li
                              key={challenge}
                              className="flex items-start gap-2 text-xs text-slate-600"
                            >
                              <ChevronRight className="size-3.5 text-red-400/60 mt-0.5 shrink-0" />
                              {challenge}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className={`rounded-xl border ${colors.border.replace('/30', '/12')} ${colors.bg.replace('/10', '/03')} p-4`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className={`size-3.5 ${colors.icon}`} />
                          <span className={`text-xs font-semibold ${colors.text}`}>SecMind 方案</span>
                        </div>
                        <ul className="space-y-2">
                          {sol.approach.map((item) => (
                            <li
                              key={item}
                              className="flex items-start gap-2 text-xs text-slate-600"
                            >
                              <CheckCircle2 className={`size-3.5 ${colors.icon} opacity-60 mt-0.5 shrink-0`} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {sol.tags.map((tag) => (
                          <Badge key={tag} className={`text-[9px] ${colors.badge}`}>{tag}</Badge>
                        ))}
                      </div>
                      <span className={`text-xs font-bold tabular-nums ${colors.icon}`}>{sol.stat.value} {sol.stat.label}</span>
                    </div>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA 尾区 */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-cyan-700 to-teal-800" aria-hidden="true" />
        <div className="absolute inset-0 opacity-10" aria-hidden="true" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        <div className="relative max-w-4xl mx-auto text-center px-4">
          <AnimateIn>
            <Badge className="border-white/30 bg-white/10 text-white mb-6">找到适合您的方案</Badge>
          </AnimateIn>
          <AnimateIn delay={100}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              无论您身处哪个行业<br className="sm:hidden" /> SecMind 都能为您提供量身定制的方案
            </h2>
          </AnimateIn>
          <AnimateIn delay={200}>
            <p className="text-lg text-cyan-100/80 mb-10 max-w-2xl mx-auto">
              立即联系我们的安全专家，获取针对您行业的专属安全决策方案
            </p>
          </AnimateIn>
          <AnimateIn delay={300}>
            <div className="flex flex-wrap justify-center gap-4">
              <DynamicContactFormDialog>
                <Button size="lg"
                  className="rounded-xl border border-white/50 bg-white text-cyan-700 font-semibold hover:bg-cyan-50 shadow-[0_10px_30px_rgba(255,255,255,0.24)] hover:-translate-y-0.5 transition-[shadow,transform] text-base px-8 h-12"
                >
                  联系销售
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </DynamicContactFormDialog>
              <Link href="/pricing">
                <Button size="lg" variant="outline"
                  className="rounded-xl border-white/60 bg-white text-cyan-700 hover:bg-cyan-50 text-base px-8 h-12"
                >
                  查看定价
                </Button>
              </Link>
            </div>
          </AnimateIn>
          <AnimateIn delay={400}>
            <div className="mt-14 pt-10 border-t border-white/10 flex flex-wrap justify-center gap-x-12 gap-y-4">
              {[
                { value: "金融", label: "等保合规" },
                { value: "科技", label: "供应链安全" },
                { value: "政府", label: "关基防护" },
                { value: "医疗", label: "隐私保护" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-cyan-200/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Shield className="size-6 text-cyan-600" />
                <span className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  SecMind
                </span>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed">
                AI自主安全研判平台，让安全从告警处理走向AI自主调查。
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-4">产品</h4>
              <ul className="space-y-2">
                {[
                  { label: "核心能力", href: "/" },
                  { label: "解决方案", href: "/solutions" },
                  { label: "定价", href: "/pricing" },
                  { label: "更新日志", href: "/docs" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-500 hover:text-cyan-600 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-4">资源</h4>
              <ul className="space-y-2">
                {[
                  { label: "文档", href: "/docs" },
                  { label: "API参考", href: "/docs" },
                  { label: "GitHub", href: "/docs" },
                  { label: "联系我们", href: "mailto:contact@secmind.com" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-500 hover:text-cyan-600 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-4">关于</h4>
              <p className="text-sm text-slate-500">
                SecMind 团队致力于打造下一代AI安全运营平台
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © 2026 SecMind. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {[
                { label: "隐私政策", href: "/privacy" },
                { label: "服务条款", href: "/terms" },
                { label: "Cookie设置", href: "/cookies" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-xs text-slate-500 hover:text-cyan-600 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
