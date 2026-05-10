"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Sparkles,
  Check,
  X,
  ChevronRight,
  ArrowRight,
  Tag,
  Menu,
  X as XIcon,
  CheckCircle2,
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

const tiers = [
  {
    name: "团队版",
    price: "¥2,999",
    period: "/月",
    features: [
      "最多5个分析师",
      "每日1,000条信号处理",
      "AI信号推理",
      "攻击研判引擎",
      "AI自主调查",
      "邮件支持",
    ],
    cta: "开始试用",
    highlighted: false,
  },
  {
    name: "专业版",
    price: "¥9,999",
    period: "/月",
    features: [
      "最多20个分析师",
      "每日10,000条信号处理",
      "AI信号推理 + 自定义规则",
      "攻击研判引擎 + MITRE映射",
      "AI自主调查 + 优先级排序",
      "证据链自动构建",
      "自动响应执行",
      "7x12技术支持",
    ],
    cta: "开始试用",
    highlighted: true,
  },
  {
    name: "企业版",
    price: "联系销售",
    period: "",
    features: [
      "不限分析师数量",
      "不限信号处理量",
      "全部专业版功能",
      "私有化部署",
      "定制AI模型",
      "AI处置策略定制",
      "7x24专属支持",
      "SLA保障",
    ],
    cta: "联系销售",
    highlighted: false,
  },
];

const comparisonFeatures = [
  { name: "AI信号推理", team: true, pro: true, enterprise: true },
  { name: "攻击研判引擎", team: true, pro: true, enterprise: true },
  { name: "AI自主调查", team: true, pro: true, enterprise: true },
  { name: "证据链自动构建", team: false, pro: true, enterprise: true },
  { name: "自动响应执行", team: false, pro: true, enterprise: true },
  { name: "MITRE ATT&CK映射", team: false, pro: true, enterprise: true },
  { name: "自定义推理规则", team: false, pro: true, enterprise: true },
  { name: "私有化部署", team: false, pro: false, enterprise: true },
  { name: "定制AI模型", team: false, pro: false, enterprise: true },
  { name: "AI处置策略定制", team: false, pro: false, enterprise: true },
  { name: "SLA保障", team: false, pro: false, enterprise: true },
];

const faqs = [
  {
    question: "是否支持免费试用？",
    answer: "是的，所有方案均提供14天免费试用，无需信用卡。",
  },
  {
    question: "可以随时升级方案吗？",
    answer: "可以，您可以随时升级到更高级别的方案，差价按剩余天数计算。",
  },
  {
    question: "数据存储在哪里？",
    answer:
      "团队版和专业版使用云端加密存储，企业版支持私有化部署到您的基础设施。",
  },
  {
    question: "如何获取技术支持？",
    answer:
      "团队版提供邮件支持，专业版提供7x12技术支持，企业版提供7x24专属支持。",
  },
];

export default function PricingPage() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
                className={`relative px-4 py-2 text-sm transition-all duration-200 rounded-lg hover:bg-white/[0.04] ${
                  pathname === item.href
                    ? "text-cyan-300 bg-white/[0.04]"
                    : "text-slate-400 hover:text-cyan-300"
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
            <Link href="/register">
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
            {mobileMenuOpen ? (
              <XIcon className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
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
              <Link href="/register" className="flex-1">
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
            <div className="lg:col-span-3">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent leading-tight mb-4">
                定价
              </h1>
              <p className="text-lg text-gray-400 max-w-xl mb-8">
                选择适合您团队的方案，所有方案均提供14天免费试用
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] font-semibold shadow-[0_0_24px_rgba(0,212,255,0.4)] hover:shadow-[0_0_36px_rgba(0,212,255,0.6)] hover:brightness-110 transition-all text-base px-6 h-11"
                  >
                    免费试用
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                </Link>
                <ContactFormDialog>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 text-base px-6 h-11"
                  >
                    联系销售
                  </Button>
                </ContactFormDialog>
              </div>
            </div>

            <div className="lg:col-span-2 hidden lg:block">
              <div className="rounded-xl border border-cyan-500/20 bg-[#0a1628]/80 backdrop-blur-xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
                  <Tag className="size-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-white">方案概览</span>
                </div>

                <div className="divide-y divide-white/[0.04]">
                  <div className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.04] transition-colors cursor-pointer">
                    <span className="text-sm text-white">团队版</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">¥2,999/月</span>
                      <ChevronRight className="size-4 text-gray-500" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-5 py-4 border-l-2 border-l-cyan-400 bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">专业版</span>
                      <Badge className="bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] border-0 px-1.5 py-0 text-[10px] font-semibold">
                        推荐
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-cyan-300">¥9,999/月</span>
                      <ChevronRight className="size-4 text-cyan-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.04] transition-colors cursor-pointer">
                    <span className="text-sm text-white">企业版</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">联系销售</span>
                      <ChevronRight className="size-4 text-gray-500" />
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-white/[0.06]">
                  <Badge variant="outline" className="border-cyan-400/30 text-cyan-400 text-xs">
                    14天免费试用
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative pb-24">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl backdrop-blur-xl p-8 transition-all duration-300 ${
                  tier.highlighted
                    ? "border border-cyan-400/50 bg-[#0a1628]/90 shadow-[0_0_40px_rgba(0,212,255,0.15)] md:z-10"
                    : "border border-white/[0.06] bg-[#0a1628]/60 shadow-[0_0_20px_rgba(0,0,0,0.3)]"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] border-0 px-3 py-1 text-xs font-semibold shadow-[0_0_12px_rgba(0,212,255,0.4)]">
                      推荐
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-extrabold ${
                        tier.highlighted
                          ? "bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent"
                          : "text-white"
                      }`}
                    >
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className="text-sm text-gray-500">
                        {tier.period}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-gray-300"
                    >
                      <CheckCircle2
                        className={`size-4 mt-0.5 shrink-0 ${
                          tier.highlighted ? "text-cyan-400" : "text-teal-400"
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                {tier.cta === "联系销售" ? (
                  <ContactFormDialog>
                    <Button
                      className={`w-full h-11 text-sm font-semibold transition-all ${
                        tier.highlighted
                          ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] shadow-[0_0_24px_rgba(0,212,255,0.4)] hover:shadow-[0_0_36px_rgba(0,212,255,0.6)] hover:brightness-110"
                          : "border border-cyan-500/30 text-cyan-400 bg-transparent hover:bg-cyan-500/10 hover:text-cyan-300"
                      }`}
                      variant={tier.highlighted ? "default" : "outline"}
                    >
                      {tier.cta}
                      <ChevronRight className="size-4 ml-1" />
                    </Button>
                  </ContactFormDialog>
                ) : (
                  <Link href="/register" className="mt-auto">
                    <Button
                      className={`w-full h-11 text-sm font-semibold transition-all ${
                        tier.highlighted
                          ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] shadow-[0_0_24px_rgba(0,212,255,0.4)] hover:shadow-[0_0_36px_rgba(0,212,255,0.6)] hover:brightness-110"
                          : "border border-cyan-500/30 text-cyan-400 bg-transparent hover:bg-cyan-500/10 hover:text-cyan-300"
                      }`}
                      variant={tier.highlighted ? "default" : "outline"}
                    >
                      {tier.cta}
                      <ChevronRight className="size-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,212,255,0.05)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-4">
              功能对比
            </h2>
            <p className="text-gray-400">
              详细了解各方案的功能差异
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-[#0a1628]/60 backdrop-blur-xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-sm font-semibold text-gray-300 px-6 py-4">
                      功能
                    </th>
                    <th className="text-center text-sm font-semibold text-gray-300 px-6 py-4">
                      团队版
                    </th>
                    <th className="text-center text-sm font-semibold text-cyan-300 px-6 py-4 bg-cyan-400/[0.04]">
                      专业版
                    </th>
                    <th className="text-center text-sm font-semibold text-gray-300 px-6 py-4">
                      企业版
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <tr
                      key={feature.name}
                      className={`border-b border-white/[0.04] ${
                        index % 2 === 0 ? "bg-white/[0.01]" : ""
                      }`}
                    >
                      <td className="text-sm text-gray-300 px-6 py-4">
                        {feature.name}
                      </td>
                      <td className="text-center px-6 py-4">
                        {feature.team ? (
                          <Check className="size-5 text-cyan-400 mx-auto" />
                        ) : (
                          <X className="size-5 text-gray-600 mx-auto" />
                        )}
                      </td>
                      <td className="text-center px-6 py-4 bg-cyan-400/[0.02]">
                        {feature.pro ? (
                          <Check className="size-5 text-cyan-400 mx-auto" />
                        ) : (
                          <X className="size-5 text-gray-600 mx-auto" />
                        )}
                      </td>
                      <td className="text-center px-6 py-4">
                        {feature.enterprise ? (
                          <Check className="size-5 text-cyan-400 mx-auto" />
                        ) : (
                          <X className="size-5 text-gray-600 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-4">
              常见问题
            </h2>
            <p className="text-gray-400">
              了解更多关于SecMind的常见问题
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl border border-white/[0.06] bg-[#0a1628]/60 backdrop-blur-xl overflow-hidden transition-all duration-300"
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                >
                  <span className="text-sm font-medium text-gray-200">
                    {faq.question}
                  </span>
                  <ChevronRight
                    className={`size-4 text-gray-500 shrink-0 ml-4 transition-transform duration-300 ${
                      openFaq === index ? "rotate-90" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === index
                      ? "max-h-40 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="px-6 pb-5 text-sm text-gray-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.06)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            准备好开始了吗？
          </h2>
          <p className="text-gray-400 mb-8">
            立即体验AI自主安全研判平台
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] font-semibold shadow-[0_0_24px_rgba(0,212,255,0.4)] hover:shadow-[0_0_36px_rgba(0,212,255,0.6)] hover:brightness-110 transition-all text-base px-6 h-11"
              >
                免费试用
                <ArrowRight className="size-4 ml-1" />
              </Button>
            </Link>
            <ContactFormDialog>
              <Button
                variant="outline"
                size="lg"
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 text-base px-6 h-11"
              >
                联系销售
              </Button>
            </ContactFormDialog>
          </div>
        </div>
      </section>

      <footer className="relative border-t border-white/[0.04] bg-[#020a1a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
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
              <h4 className="text-sm font-semibold text-gray-300 mb-4">
                产品
              </h4>
              <ul className="space-y-2">
                {[
                  { label: "核心能力", href: "/solutions" },
                  { label: "解决方案", href: "/solutions" },
                  { label: "定价", href: "/pricing" },
                  { label: "更新日志", href: "/docs" },
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
              <h4 className="text-sm font-semibold text-gray-300 mb-4">
                资源
              </h4>
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
                      className="text-sm text-gray-500 hover:text-cyan-400 transition-colors"
                    >
                      {item.label}
                    </Link>
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
