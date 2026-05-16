"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DynamicContactFormDialog } from "@/components/dynamic-imports";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

const navItems = [
  { label: "首页", href: "/" },
  { label: "解决方案", href: "/solutions" },
  { label: "文档", href: "/docs" },
  { label: "定价", href: "/pricing" },
];

type TierKey = "trial" | "professional" | "enterprise";

const tiers = [
  {
    key: "trial" as TierKey,
    name: "免费试用",
    plan: "free",
    price: "免费",
    period: "14天",
    features: [
      "5个用户",
      "100条告警/天",
      "基础AI分析",
      "社区支持",
    ],
    cta: "开始试用",
    highlighted: false,
  },
  {
    key: "professional" as TierKey,
    name: "专业版",
    plan: "professional",
    price: "¥2,999",
    period: "/月",
    features: [
      "20个用户",
      "无限告警",
      "高级AI分析",
      "处置自动化",
      "AI信号推理 + 自定义规则",
      "攻击研判引擎 + MITRE映射",
      "7x12技术支持",
    ],
    cta: "开始试用",
    highlighted: true,
  },
  {
    key: "enterprise" as TierKey,
    name: "企业版",
    plan: "enterprise",
    price: "¥9,999",
    period: "/月",
    features: [
      "无限用户",
      "无限告警",
      "全部功能",
      "专属支持",
      "私有化部署",
      "定制AI模型",
      "AI处置策略定制",
      "7x24专属支持 + SLA保障",
    ],
    cta: "联系销售",
    highlighted: false,
  },
];

function getTrialRemainingDays(): number {
  if (typeof window === "undefined") return 14
  try {
    const trialStart = localStorage.getItem("secmind-trial-start")
    if (!trialStart) {
      const now = Date.now()
      localStorage.setItem("secmind-trial-start", String(now))
      return 14
    }
    const elapsed = Date.now() - Number(trialStart)
    const daysElapsed = Math.floor(elapsed / (1000 * 60 * 60 * 24))
    return Math.max(0, 14 - daysElapsed)
  } catch {
    return 14
  }
}

const comparisonFeatures = [
  { name: "基础AI分析", free: true, pro: true, enterprise: true },
  { name: "AI信号推理", free: true, pro: true, enterprise: true },
  { name: "攻击研判引擎", free: true, pro: true, enterprise: true },
  { name: "高级AI分析", free: false, pro: true, enterprise: true },
  { name: "处置自动化", free: false, pro: true, enterprise: true },
  { name: "自定义推理规则", free: false, pro: true, enterprise: true },
  { name: "MITRE ATT&CK映射", free: false, pro: true, enterprise: true },
  { name: "证据链自动构建", free: false, pro: true, enterprise: true },
  { name: "私有化部署", free: false, pro: false, enterprise: true },
  { name: "定制AI模型", free: false, pro: false, enterprise: true },
  { name: "AI处置策略定制", free: false, pro: false, enterprise: true },
  { name: "7x24专属支持 + SLA", free: false, pro: false, enterprise: true },
];

export default function PricingPage() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscribing, setSubscribing] = useState<TierKey | null>(null);
  const [error, setError] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successPlan, setSuccessPlan] = useState("");
  const [trialDays, setTrialDays] = useState(14);

  useEffect(() => {
    setTrialDays(getTrialRemainingDays());
  }, []);

  const handleSubscribe = async (tier: (typeof tiers)[number]) => {
    if (tier.cta === "联系销售") return;

    setError("");
    setSubscribing(tier.key);

    try {
      await api.post("/billing/orders", {
        plan: tier.plan,
        payment_method: "alipay",
      });

      if (!isAuthenticated) {
        localStorage.setItem("secmind-intent-plan", tier.plan);
        router.push("/register");
        return;
      }

      setSuccessPlan(tier.name);
      setShowSuccessDialog(true);
    } catch (err: any) {
      const message = err?.response?.data?.detail || "订阅请求失败，请稍后重试";
      setError(message);
    } finally {
      setSubscribing(null);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="border-slate-200 bg-white text-slate-900 sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <CheckCircle2 className="size-7 text-emerald-500" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center text-xl text-slate-900">订阅成功！</DialogTitle>
              <DialogDescription className="text-center text-slate-500">
                您已成功订阅 {successPlan}，正在跳转至工作台...
              </DialogDescription>
            </DialogHeader>
            <Button
              className="mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-[0_10px_26px_rgba(6,182,212,0.30)]"
              onClick={handleSuccessClose}
            >
              进入工作台
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-b border-slate-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 shadow-[0_0_16px_rgba(0,212,255,0.3)]">
              <Shield className="size-4 text-slate-900" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900 tracking-tight">
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
                className={`relative px-4 py-2 text-sm transition-colors duration-200 rounded-lg hover:bg-slate-50 ${
                  pathname === item.href
                    ? "text-cyan-700 bg-cyan-50"
                    : "text-slate-600 hover:text-cyan-700"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="w-px h-5 bg-slate-200 mx-2" />
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="default"
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm h-9 px-5"
                >
                  工作台
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="default"
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm h-9 px-5"
                >
                  登录
                </Button>
              </Link>
            )}
            {!isAuthenticated && (
              <Link href="/register">
                <Button
                  size="default"
                  className="rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold shadow-[0_8px_24px_rgba(6,182,212,0.28)] hover:shadow-[0_12px_30px_rgba(6,182,212,0.38)] hover:-translate-y-0.5 transition-[shadow,transform] text-sm h-9 px-5"
                >
                  免费体验
                  <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </Link>
            )}
          </div>

          <button
            className="md:hidden text-slate-500 hover:text-cyan-600 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="打开导航菜单"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <XIcon className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
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
              <Link href="/register" className="flex-1">
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

      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,212,255,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,180,180,0.06)_0%,transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent leading-tight mb-4">
                定价
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mb-8">
                选择适合您团队的方案，所有方案均提供14天免费试用
              </p>

              {trialDays > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-xl border border-cyan-200 bg-cyan-50/70">
                  <Clock className="size-4 text-cyan-500" />
                  <span className="text-sm font-medium text-cyan-700">
                    试用剩余 <strong>{trialDays}</strong> 天
                  </span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 mb-6 max-w-md">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                {isAuthenticated ? (
                  <Button
                    size="lg"
                    className="rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold shadow-[0_10px_26px_rgba(6,182,212,0.28)] hover:shadow-[0_14px_32px_rgba(6,182,212,0.36)] hover:-translate-y-0.5 transition-[shadow,transform] text-base px-6 h-11"
                    onClick={() => handleSubscribe(tiers[0])}
                    disabled={subscribing === "trial"}
                  >
                    {subscribing === "trial" ? (
                      <Loader2 className="size-4 animate-spin mr-1" />
                    ) : (
                      <ArrowRight className="size-4 mr-1" />
                    )}
                    开始试用
                  </Button>
                ) : (
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold shadow-[0_10px_26px_rgba(6,182,212,0.28)] hover:shadow-[0_14px_32px_rgba(6,182,212,0.36)] hover:-translate-y-0.5 transition-[shadow,transform] text-base px-6 h-11"
                    >
                      免费试用
                      <ArrowRight className="size-4 ml-1" />
                    </Button>
                  </Link>
                )}
                <DynamicContactFormDialog>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-cyan-300 bg-white text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 text-base px-6 h-11"
                  >
                    联系销售
                  </Button>
                </DynamicContactFormDialog>
              </div>
            </div>

            <div className="lg:col-span-2 hidden lg:block">
              <div className="rounded-xl border border-cyan-500/20 bg-white backdrop-blur-xl overflow-hidden shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200">
                  <Tag className="size-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-slate-900">方案概览</span>
                </div>

                <div className="divide-y divide-white/[0.04]">
                  <div className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
                    <span className="text-sm text-slate-900">免费试用</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">免费/14天</span>
                      <ChevronRight className="size-4 text-slate-500" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-5 py-4 border-l-2 border-l-cyan-400 bg-slate-50 hover:bg-white/[0.06] transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-900">专业版</span>
                      <Badge className="bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-900 border-0 px-1.5 py-0 text-[10px] font-semibold">
                        推荐
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-cyan-700">¥2,999/月</span>
                      <ChevronRight className="size-4 text-cyan-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
                    <span className="text-sm text-slate-900">企业版</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">¥9,999/月</span>
                      <ChevronRight className="size-4 text-slate-500" />
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-slate-200">
                  <Badge variant="outline" className="border-cyan-300 text-cyan-700 text-xs">
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
                className={`relative flex flex-col rounded-2xl backdrop-blur-xl p-8 transition-[shadow,transform] duration-300 hover:-translate-y-0.5 ${
                  tier.highlighted
                    ? "border border-cyan-400/50 bg-white shadow-[0_18px_40px_rgba(6,182,212,0.16)] md:z-10"
                    : "border border-slate-200 bg-white shadow-[0_12px_26px_rgba(15,23,42,0.08)]"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white border-0 px-3 py-1 text-xs font-semibold shadow-[0_10px_18px_rgba(6,182,212,0.30)]">
                      推荐
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-extrabold tabular-nums ${
                        tier.highlighted
                          ? "bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent"
                          : "text-slate-900"
                      }`}
                    >
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className="text-sm text-slate-500">
                        {tier.period}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-slate-700"
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
                  <DynamicContactFormDialog>
                    <Button
                      className={`w-full h-11 text-sm font-semibold transition-[shadow,transform] ${
                        tier.highlighted
                          ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-[0_10px_26px_rgba(6,182,212,0.30)] hover:shadow-[0_14px_32px_rgba(6,182,212,0.38)] hover:-translate-y-0.5"
                          : "border border-cyan-500/30 text-cyan-700 bg-white hover:bg-cyan-50 hover:text-cyan-800"
                      }`}
                      variant={tier.highlighted ? "default" : "outline"}
                    >
                      {tier.cta}
                      <ChevronRight className="size-4 ml-1" />
                    </Button>
                  </DynamicContactFormDialog>
                ) : (
                  <Button
                    className={`w-full h-11 text-sm font-semibold transition-[shadow,transform] ${
                      tier.highlighted
                        ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-[0_10px_26px_rgba(6,182,212,0.30)] hover:shadow-[0_14px_32px_rgba(6,182,212,0.38)] hover:-translate-y-0.5"
                        : "border border-cyan-500/30 text-cyan-700 bg-white hover:bg-cyan-50 hover:text-cyan-800"
                    }`}
                    variant={tier.highlighted ? "default" : "outline"}
                    onClick={() => handleSubscribe(tier)}
                    disabled={subscribing === tier.key}
                  >
                    {subscribing === tier.key ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-1" />
                        处理中...
                      </>
                    ) : (
                      <>
                        {tier.cta}
                        <ChevronRight className="size-4 ml-1" />
                      </>
                    )}
                  </Button>
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
            <p className="text-slate-500">
              详细了解各方案的功能差异
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white backdrop-blur-xl overflow-hidden shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-sm font-semibold text-slate-700 px-6 py-4">
                      功能
                    </th>
                    <th className="text-center text-sm font-semibold text-slate-700 px-6 py-4">
                      免费试用
                    </th>
                    <th className="text-center text-sm font-semibold text-cyan-700 px-6 py-4 bg-cyan-50">
                      专业版
                    </th>
                    <th className="text-center text-sm font-semibold text-slate-700 px-6 py-4">
                      企业版
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <tr
                      key={feature.name}
                      className={`border-b border-slate-200 ${
                        index % 2 === 0 ? "bg-slate-50" : ""
                      }`}
                    >
                      <td className="text-sm text-slate-700 px-6 py-4">
                        {feature.name}
                      </td>
                      <td className="text-center px-6 py-4">
                        {feature.free ? (
                          <Check className="size-5 text-cyan-400 mx-auto" />
                        ) : (
                          <X className="size-5 text-slate-400 mx-auto" />
                        )}
                      </td>
                      <td className="text-center px-6 py-4 bg-cyan-400/[0.02]">
                        {feature.pro ? (
                          <Check className="size-5 text-cyan-400 mx-auto" />
                        ) : (
                          <X className="size-5 text-slate-400 mx-auto" />
                        )}
                      </td>
                      <td className="text-center px-6 py-4">
                        {feature.enterprise ? (
                          <Check className="size-5 text-cyan-400 mx-auto" />
                        ) : (
                          <X className="size-5 text-slate-400 mx-auto" />
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.06)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            准备好开始了吗？
          </h2>
          <p className="text-slate-500 mb-8">
            立即体验AI自主安全研判平台
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {isAuthenticated ? (
              <Button
                size="lg"
                className="rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold shadow-[0_10px_26px_rgba(6,182,212,0.28)] hover:shadow-[0_14px_32px_rgba(6,182,212,0.36)] hover:-translate-y-0.5 transition-[shadow,transform] text-base px-6 h-11"
                onClick={() => handleSubscribe(tiers[0])}
                disabled={subscribing === "trial"}
              >
                {subscribing === "trial" ? (
                  <Loader2 className="size-4 animate-spin mr-1" />
                ) : null}
                免费试用
              </Button>
            ) : (
              <Link href="/register">
                <Button
                  size="lg"
                  className="rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold shadow-[0_10px_26px_rgba(6,182,212,0.28)] hover:shadow-[0_14px_32px_rgba(6,182,212,0.36)] hover:-translate-y-0.5 transition-[shadow,transform] text-base px-6 h-11"
                >
                  免费试用
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </Link>
            )}
            <DynamicContactFormDialog>
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl border-cyan-300 bg-white text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 text-base px-6 h-11"
              >
                联系销售
              </Button>
            </DynamicContactFormDialog>
          </div>
        </div>
      </section>

      <footer className="relative border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Shield className="size-6 text-cyan-400" />
                <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  SecMind
                </span>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed">
                AI自主安全研判平台，让安全从告警处理走向AI自主调查。
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-4">
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
                      className="text-sm text-slate-500 hover:text-cyan-700 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-4">
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
                      className="text-sm text-slate-500 hover:text-cyan-700 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
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
                  className="text-xs text-slate-500 hover:text-cyan-700 transition-colors"
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
