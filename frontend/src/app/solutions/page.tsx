"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Sparkles,
  Landmark,
  Building2,
  Server,
  HeartPulse,
  ChevronRight,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContactFormDialog } from "@/components/contact-form-dialog";

const navItems = [
  { label: "首页", href: "/" },
  { label: "解决方案", href: "/solutions" },
  { label: "文档", href: "/docs" },
  { label: "定价", href: "/pricing" },
];

const solutions = [
  {
    icon: Landmark,
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
  },
  {
    icon: Building2,
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
  },
  {
    icon: Server,
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
  },
  {
    icon: HeartPulse,
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
  },
];

export default function SolutionsPage() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#020a1a] text-white overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020a1a]/70 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 shadow-[0_0_16px_rgba(0,212,255,0.3)]">
              <Shield className="size-4 text-[#020a1a]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tracking-tight">
                SecMind
              </span>
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
            <div className="flex gap-2 pt-3 border-t border-white/[0.04] mt-2">
              <Link href="/login" className="flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-slate-400 hover:text-white hover:bg-white/[0.04]"
                >
                  登录
                </Button>
              </Link>
              <Link href="/login" className="flex-1">
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] font-semibold shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                >
                  免费体验
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,212,255,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,180,180,0.06)_0%,transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3 space-y-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent leading-tight">
                解决方案
              </h1>
              <p className="text-lg text-gray-400 max-w-xl">
                覆盖多行业安全决策需求，从金融到医疗的智能防护
              </p>
              <div className="flex items-center gap-4 pt-2">
                <ContactFormDialog>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:text-cyan-200 transition-all text-base px-6 h-11"
                  >
                    联系销售
                  </Button>
                </ContactFormDialog>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] font-semibold shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] hover:brightness-110 transition-all text-base px-6 h-11"
                  >
                    查看定价
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 hidden lg:block">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5 shadow-[0_0_40px_rgba(0,212,255,0.06)]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4 space-y-2">
                    <span className="text-2xl">🏦</span>
                    <p className="text-sm text-white font-medium">金融行业</p>
                    <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-xs">风险 87</Badge>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4 space-y-2">
                    <span className="text-2xl">💻</span>
                    <p className="text-sm text-white font-medium">科技企业</p>
                    <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/20 text-xs">风险 72</Badge>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4 space-y-2">
                    <span className="text-2xl">🏛️</span>
                    <p className="text-sm text-white font-medium">政府机构</p>
                    <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-xs">风险 91</Badge>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4 space-y-2">
                    <span className="text-2xl">🏥</span>
                    <p className="text-sm text-white font-medium">医疗健康</p>
                    <Badge className="bg-teal-500/15 text-teal-400 border-teal-500/20 text-xs">风险 65</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,212,255,0.05)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8">
            {solutions.map((solution) => {
              const Icon = solution.icon;
              return (
                <div
                  key={solution.title}
                  className="group rounded-2xl border border-cyan-500/20 bg-[#0a1628]/80 backdrop-blur-xl p-8 sm:p-10 shadow-[0_0_40px_rgba(0,212,255,0.06)] hover:border-cyan-500/40 hover:shadow-[0_0_60px_rgba(0,212,255,0.1)] transition-all duration-300"
                >
                  <div className="grid lg:grid-cols-[1fr_2fr] gap-8 lg:gap-12">
                    <div className="space-y-5">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/20 shadow-[0_0_20px_rgba(0,212,255,0.1)]">
                          <Icon className="size-6 text-cyan-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">
                          {solution.title}
                        </h3>
                      </div>
                      <p className="text-gray-400 leading-relaxed">
                        {solution.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {solution.tags.map((tag) => (
                          <Badge
                            key={tag}
                            className="border-cyan-500/20 bg-cyan-500/[0.06] text-cyan-300 text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="rounded-xl border border-red-500/15 bg-red-500/[0.03] p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="size-2 rounded-full bg-red-400" />
                          <span className="text-sm font-semibold text-red-300">
                            核心挑战
                          </span>
                        </div>
                        <ul className="space-y-3">
                          {solution.challenges.map((challenge) => (
                            <li
                              key={challenge}
                              className="flex items-start gap-2 text-sm text-gray-300"
                            >
                              <ChevronRight className="size-4 text-red-400/60 mt-0.5 shrink-0" />
                              {challenge}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/[0.03] p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="size-4 text-cyan-400" />
                          <span className="text-sm font-semibold text-cyan-300">
                            SecMind方案
                          </span>
                        </div>
                        <ul className="space-y-3">
                          {solution.approach.map((item) => (
                            <li
                              key={item}
                              className="flex items-start gap-2 text-sm text-gray-300"
                            >
                              <ChevronRight className="size-4 text-cyan-400/60 mt-0.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.06)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-4">
            找到适合您的方案
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-8">
            无论您身处哪个行业，SecMind都能为您提供量身定制的安全决策方案
          </p>
          <ContactFormDialog>
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] font-semibold shadow-[0_0_24px_rgba(0,212,255,0.4)] hover:shadow-[0_0_36px_rgba(0,212,255,0.6)] hover:brightness-110 transition-all text-base px-8 h-12"
            >
              联系销售
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </ContactFormDialog>
        </div>
      </section>

      <footer className="relative border-t border-white/[0.04] bg-[#020a1a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Shield className="size-6 text-cyan-400" />
                <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  SecMind
                </span>
              </Link>
              <p className="text-sm text-gray-500 leading-relaxed">
                AI自主安全研判平台，让安全从告警处理走向AI自主调查。
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-4">产品</h4>
              <ul className="space-y-2">
                {[
                  { label: "核心能力", href: "/product" },
                  { label: "解决方案", href: "/solutions" },
                  { label: "定价", href: "/pricing" },
                  { label: "更新日志", href: "#" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-500 hover:text-cyan-400 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-4">资源</h4>
              <ul className="space-y-2">
                {[
                  { label: "文档", href: "/docs" },
                  { label: "API参考", href: "/docs" },
                  { label: "GitHub", href: "#" },
                  { label: "联系我们", href: "#" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-500 hover:text-cyan-400 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-4">关于</h4>
              <ul className="space-y-2">
                {["团队", "博客", "招聘", "合作伙伴"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-gray-500 hover:text-cyan-400 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">
              © 2026 SecMind. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["隐私政策", "服务条款", "Cookie设置"].map((item) => (
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
  );
}
