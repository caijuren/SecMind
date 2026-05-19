"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  X,
  ChevronRight,
  ArrowRight,
  Tag,
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
import { AnimateIn } from "@/components/common/animate-in";
import { startDemoSession } from "@/lib/demo-session";
import { useAuthStore } from "@/store/auth-store";

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
  const router = useRouter();
  const subscribing = null as TierKey | null;
  const error = "";
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const successPlan = "";
  const [trialDays, setTrialDays] = useState(14);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  useEffect(() => {
    const nextTrialDays = getTrialRemainingDays();
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => setTrialDays(nextTrialDays));
    } else {
      Promise.resolve().then(() => setTrialDays(nextTrialDays));
    }
  }, []);

  const handleSubscribe = async (tier: (typeof tiers)[number]) => {
    if (tier.cta === "联系销售") return;

    startDemoSession();
    router.push("/investigate");
    return;
  };

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    router.push("/dashboard");
  };

  return (
    <>
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="border-white/10 bg-[#131316] text-zinc-200 sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <CheckCircle2 className="size-7 text-emerald-500" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center text-xl text-zinc-200">订阅成功！</DialogTitle>
              <DialogDescription className="text-center text-zinc-400">
                您已成功订阅 {successPlan}，正在跳转至工作台...
              </DialogDescription>
            </DialogHeader>
            <Button
              className="mt-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-[0_10px_26px_rgba(59,130,246,0.3)]"
              onClick={handleSuccessClose}
            >
              进入工作台
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <section className="relative pt-32 pb-16 overflow-hidden">
        <AnimateIn>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.08)_0%,transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.06)_0%,transparent_60%)]" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-5 gap-12 items-center">
              <div className="lg:col-span-3">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter bg-gradient-to-r from-blue-400 via-blue-300 to-violet-400 bg-clip-text text-transparent leading-tight mb-4">
                  定价
                </h1>
                <p className="text-lg text-zinc-400 max-w-xl mb-8">
                  选择适合您团队的方案，所有方案均提供14天免费试用
                </p>

                {trialDays > 0 && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-xl border border-blue-500/20 bg-blue-500/10">
                    <Clock className="size-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-300">
                      试用剩余 <strong>{trialDays}</strong> 天
                    </span>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400 mb-6 max-w-md">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  {isAuthenticated ? (
                    <Button
                      size="lg"
                      className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold shadow-[0_10px_26px_rgba(59,130,246,0.3)] hover:shadow-[0_14px_32px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 transition-[shadow,transform] text-base px-6 h-11"
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
                        className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold shadow-[0_10px_26px_rgba(59,130,246,0.3)] hover:shadow-[0_14px_32px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 transition-[shadow,transform] text-base px-6 h-11"
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
                      className="rounded-xl border-white/10 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-zinc-100 text-base px-6 h-11 flex items-center"
                    >
                      联系销售
                      <ArrowRight className="size-4 ml-1" />
                    </Button>
                  </DynamicContactFormDialog>
                </div>
              </div>

              <div className="lg:col-span-2 hidden lg:block">
                <div className="rounded-xl border border-blue-500/20 bg-[#131316] overflow-hidden shadow-[0_14px_30px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
                    <Tag className="size-4 text-blue-400" />
                    <span className="text-sm font-semibold text-zinc-200">方案概览</span>
                  </div>

                  <div className="divide-y divide-white/5">
                    <div className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                      <span className="text-sm text-zinc-200">免费试用</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-zinc-200 tabular-nums">免费/14天</span>
                        <ChevronRight className="size-4 text-zinc-500" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-5 py-4 border-l-2 border-l-blue-400 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-200">专业版</span>
                        <Badge className="bg-gradient-to-r from-blue-500 to-violet-500 text-white border-0 px-1.5 py-0 text-[10px] font-semibold">
                          推荐
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-blue-400">¥2,999/月</span>
                        <ChevronRight className="size-4 text-blue-400" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                      <span className="text-sm text-zinc-200">企业版</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-zinc-200 tabular-nums">¥9,999/月</span>
                        <ChevronRight className="size-4 text-zinc-500" />
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-white/5">
                    <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-xs">
                      14天免费试用
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimateIn>
      </section>

      <section className="relative pb-24">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn delay={100}>
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl p-8 transition-[shadow,transform] duration-300 hover:-translate-y-0.5 ${
                  tier.highlighted
                    ? "border border-blue-500/40 bg-[#131316] shadow-[0_18px_40px_rgba(59,130,246,0.16)] md:z-10"
                    : "border border-white/6 bg-[#131316] shadow-[0_12px_26px_rgba(0,0,0,0.3)]"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-500 to-violet-500 text-white border-0 px-3 py-1 text-xs font-semibold shadow-[0_10px_18px_rgba(59,130,246,0.3)]">
                      推荐
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-zinc-200 mb-2">
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-extrabold tabular-nums ${
                        tier.highlighted
                          ? "bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent"
                          : "text-zinc-200"
                      }`}
                    >
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className="text-sm text-zinc-500">
                        {tier.period}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-zinc-400"
                    >
                      <CheckCircle2
                        className={`size-4 mt-0.5 shrink-0 ${
                          tier.highlighted ? "text-blue-400" : "text-violet-400"
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">

                {tier.cta === "联系销售" ? (
                  <DynamicContactFormDialog>
                    <Button
                      className={`w-full h-11 text-sm font-semibold transition-[shadow,transform] ${
                        tier.highlighted
                          ? "bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-[0_10px_26px_rgba(59,130,246,0.3)] hover:shadow-[0_14px_32px_rgba(59,130,246,0.38)] hover:-translate-y-0.5"
                          : "border border-blue-500/30 text-blue-400 bg-transparent hover:bg-blue-500/10 hover:text-blue-300"
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
                        ? "bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-[0_10px_26px_rgba(59,130,246,0.3)] hover:shadow-[0_14px_32px_rgba(59,130,246,0.38)] hover:-translate-y-0.5"
                        : "border border-blue-500/30 text-blue-400 bg-transparent hover:bg-blue-500/10 hover:text-blue-300"
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
              </div>
            ))}
          </div>
          </AnimateIn>
        </div>
      </section>

      <section className="relative py-24">
        <AnimateIn delay={200}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.05)_0%,transparent_60%)]" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent mb-4">
                功能对比
              </h2>
              <p className="text-zinc-400">
                详细了解各方案的功能差异
              </p>
            </div>

            <div className="rounded-2xl border border-white/6 bg-[#131316] overflow-hidden shadow-[0_12px_28px_rgba(0,0,0,0.3)]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-sm font-semibold text-zinc-300 px-6 py-4">
                        功能
                      </th>
                      <th className="text-center text-sm font-semibold text-zinc-300 px-6 py-4">
                        免费试用
                      </th>
                      <th className="text-center text-sm font-semibold text-blue-400 px-6 py-4 bg-blue-500/5">
                        专业版
                      </th>
                      <th className="text-center text-sm font-semibold text-zinc-300 px-6 py-4">
                        企业版
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((feature, index) => (
                      <tr
                        key={feature.name}
                        className={`border-b border-white/5 ${
                          index % 2 === 0 ? "bg-white/[0.01]" : ""
                        }`}
                      >
                        <td className="text-sm text-zinc-400 px-6 py-4">
                          {feature.name}
                        </td>
                        <td className="text-center px-6 py-4">
                          {feature.free ? (
                            <Check className="size-5 text-blue-400 mx-auto" />
                          ) : (
                            <X className="size-5 text-zinc-600 mx-auto" />
                          )}
                        </td>
                        <td className="text-center px-6 py-4 bg-blue-500/[0.02]">
                          {feature.pro ? (
                            <Check className="size-5 text-blue-400 mx-auto" />
                          ) : (
                            <X className="size-5 text-zinc-600 mx-auto" />
                          )}
                        </td>
                        <td className="text-center px-6 py-4">
                          {feature.enterprise ? (
                            <Check className="size-5 text-blue-400 mx-auto" />
                          ) : (
                            <X className="size-5 text-zinc-600 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </AnimateIn>
      </section>

      <section className="relative py-24">
        <AnimateIn delay={300}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06)_0%,transparent_60%)]" />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-200 mb-4">
              准备好开始了吗？
            </h2>
            <p className="text-zinc-400 mb-8">
              立即体验AI自主安全研判平台
            </p>
            <div className="flex items-center justify-center gap-4">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold shadow-[0_10px_26px_rgba(59,130,246,0.3)] hover:shadow-[0_14px_32px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 transition-[shadow,transform] text-base px-6 h-11"
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
                    className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold shadow-[0_10px_26px_rgba(59,130,246,0.3)] hover:shadow-[0_14px_32px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 transition-[shadow,transform] text-base px-6 h-11"
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
                  className="rounded-xl border-white/10 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-zinc-100 text-base px-6 h-11 flex items-center"
                >
                  联系销售
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </DynamicContactFormDialog>
            </div>
          </div>
        </AnimateIn>
      </section>
    </>
  );
}
