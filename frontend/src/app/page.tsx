"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  Sparkles,
  Crosshair,
  Brain,
  Zap,
  Eye,
  Link2,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Target,
  Building2,
  Server,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { useLocaleStore } from "@/store/locale-store";
import type { Locale } from "@/i18n/types";
import { localeNames } from "@/i18n/types";
import { DynamicContactFormDialog } from "@/components/dynamic-imports";

const locales: Locale[] = ["zh-CN", "en"];

function useCountUp(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const startTime = performance.now();
    function step(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
}

function AnimatedSuggestionCount() {
  const count = useCountUp(47, 2000);
  return <span>{count}</span>;
}

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

const accentMap: Record<string, { border: string; bg: string; icon: string; text: string }> = {
  blue: { border: "border-blue-500/20", bg: "bg-blue-500/10", icon: "text-blue-400", text: "text-blue-300" },
  violet: { border: "border-violet-500/20", bg: "bg-violet-500/10", icon: "text-violet-400", text: "text-violet-300" },
  amber: { border: "border-amber-500/20", bg: "bg-amber-500/10", icon: "text-amber-400", text: "text-amber-300" },
  teal: { border: "border-teal-500/20", bg: "bg-teal-500/10", icon: "text-teal-400", text: "text-teal-300" },
  red: { border: "border-red-500/20", bg: "bg-red-500/10", icon: "text-red-400", text: "text-red-300" },
  emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/10", icon: "text-emerald-400", text: "text-emerald-300" },
};

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const { locale, setLocale, t } = useLocaleStore();

  const stat87 = useCountUp(87, 1500);
  const stat3x = useCountUp(3, 1500);

  const navItems = [
    { label: t("marketing.nav.home"), href: "/" },
    { label: t("marketing.nav.solutions"), href: "/solutions" },
    { label: t("marketing.nav.docs"), href: "/docs" },
    { label: t("marketing.nav.pricing"), href: "/pricing" },
  ];

  const capabilities = [
    { icon: Brain, title: t("landing.capabilities.signalReasoning"), desc: t("landing.capabilities.signalReasoningDesc"), color: "blue" },
    { icon: Crosshair, title: t("landing.capabilities.attackAssessment"), desc: t("landing.capabilities.attackAssessmentDesc"), color: "red" },
    { icon: Eye, title: t("landing.capabilities.autonomousInvestigation"), desc: t("landing.capabilities.autonomousInvestigationDesc"), color: "amber" },
    { icon: Link2, title: t("landing.capabilities.evidenceChain"), desc: t("landing.capabilities.evidenceChainDesc"), color: "teal" },
    { icon: Shield, title: t("landing.capabilities.assessmentLoop"), desc: t("landing.capabilities.assessmentLoopDesc"), color: "violet" },
    { icon: Zap, title: t("landing.capabilities.autoResponse"), desc: t("landing.capabilities.autoResponseDesc"), color: "emerald" },
  ];

  const handleDemoExperience = async () => {
    login(
      {
        id: 'DEMO001',
        name: t("landing.demoUser"),
        email: 'demo@secmind.com',
        role: 'viewer',
        isDemo: true,
        isNewUser: true,
      },
      'mock-jwt-token-demo'
    );
    router.push('/investigate');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 overflow-x-hidden">
      {/* ========== Navigation ========== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/80 backdrop-bl-2xl border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 shadow-[0_0_16px_rgba(59,130,246,0.3)]">
              <Shield className="size-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-zinc-100 tracking-tight">
                SecMind
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                <Sparkles className="size-2.5" />
                {t("marketing.nav.aiPlatform")}
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
                    ? "text-blue-400 bg-blue-500/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="w-px h-5 bg-white/10 mx-2" />
            <button
              onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-colors"
            >
              <Globe className="size-4" />
              <span>{locale === "zh-CN" ? "EN" : "中"}</span>
            </button>
            <Link href="/login">
              <Button
                variant="ghost"
                size="default"
                className="text-zinc-400 hover:text-zinc-200 hover:bg-white/5 text-sm h-9 px-5"
              >
                {t("marketing.nav.login")}
              </Button>
            </Link>
            <Button
              size="default"
              className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold shadow-[0_8px_24px_rgba(59,130,246,0.3)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 transition-[shadow,transform] text-sm h-9 px-5"
              onClick={handleDemoExperience}
            >
              {t("marketing.nav.freeTrial")}
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </div>

          <button
            className="md:hidden text-zinc-400 hover:text-blue-400 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="打开导航菜单"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#09090b]/95 backdrop-blur-2xl px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`block text-sm rounded-md px-3 py-2.5 transition-colors ${
                  pathname === item.href
                    ? "text-blue-400 bg-blue-500/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 pt-3 border-t border-white/5 mt-2">
              <button
                onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-400 hover:text-blue-400 hover:bg-white/5 rounded-md transition-colors"
              >
                <Globe className="size-4" />
                {localeNames[locale === "zh-CN" ? "en" : "zh-CN"]}
              </button>
            </div>
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                >
                  {t("marketing.nav.login")}
                </Button>
              </Link>
              <Button
                size="sm"
                className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold"
                onClick={handleDemoExperience}
              >
                {t("marketing.nav.freeTrial")}
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* ========== Hero Section ========== */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.1)_0%,transparent_50%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-breathe" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" style={{ animation: 'breathe 10s ease-in-out 2s infinite' }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-400 px-3 py-1 text-sm">
                {t("landing.hero.badge")}
              </Badge>

              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter bg-gradient-to-r from-blue-400 via-blue-300 to-violet-400 bg-clip-text text-transparent leading-tight">
                  {t("landing.hero.title")}
                </h1>
                <h2 className="text-xl sm:text-2xl font-semibold text-zinc-200">
                  {t("landing.hero.subtitle")}
                </h2>
                <p className="text-lg text-zinc-400 max-w-lg">
                  {t("landing.hero.description")}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold shadow-[0_10px_26px_rgba(59,130,246,0.3)] hover:shadow-[0_14px_32px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 transition-[shadow,transform] text-base px-6 h-11"
                  onClick={handleDemoExperience}
                >
                  {t("landing.hero.freeTrial")}
                  <ChevronRight className="size-4 ml-1" />
                </Button>
                <DynamicContactFormDialog>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-white/10 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-zinc-100 text-base px-6 h-11"
                  >
                    {t("landing.hero.bookDemo")}
                  </Button>
                </DynamicContactFormDialog>
              </div>

              <div className="flex flex-wrap gap-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 tabular-nums">{stat87}%</div>
                  <div className="text-xs text-zinc-500 mt-1">{t("landing.hero.statAccuracy")}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 tabular-nums">&lt;5min</div>
                  <div className="text-xs text-zinc-500 mt-1">{t("landing.hero.statInvestigation")}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 tabular-nums">{stat3x}x</div>
                  <div className="text-xs text-zinc-500 mt-1">{t("landing.hero.statEfficiency")}</div>
                </div>
              </div>
            </div>

            {/* Bento Grid */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 grid-rows-2 gap-3">
                <div className="col-span-1 row-span-1 rounded-2xl border border-white/6 bg-[#131316] p-5 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-blue-400" />
                      <span className="text-sm font-medium text-zinc-200">{t("landing.bento.aiCenter")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs text-emerald-400">{t("landing.bento.online")}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-center">
                      <div className="text-xl font-bold text-amber-400"><AnimatedSuggestionCount /></div>
                      <div className="text-[10px] text-amber-400/60 mt-0.5">{t("landing.bento.pendingReview")}</div>
                    </div>
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-center">
                      <div className="text-xl font-bold text-blue-400">23</div>
                      <div className="text-[10px] text-blue-400/60 mt-0.5">{t("landing.bento.investigating")}</div>
                    </div>
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
                      <div className="text-xl font-bold text-emerald-400">156</div>
                      <div className="text-[10px] text-emerald-400/60 mt-0.5">{t("landing.bento.assessed")}</div>
                    </div>
                  </div>
                </div>

                <div className="col-span-1 row-span-1 rounded-2xl border border-white/6 bg-[#131316] p-5 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                  <div className="text-xs text-zinc-500 mb-3 font-medium uppercase tracking-wider">{t("landing.bento.attackDistribution")}</div>
                  <div className="space-y-2.5">
                    {[
                      { label: t("landing.bento.accountCompromise"), pct: 35, color: "bg-red-500" },
                      { label: t("landing.bento.credentialTheft"), pct: 28, color: "bg-amber-500" },
                      { label: t("landing.bento.c2Communication"), pct: 22, color: "bg-blue-500" },
                      { label: t("landing.bento.other"), pct: 15, color: "bg-violet-500" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-zinc-400">{item.label}</span>
                          <span className="text-[10px] text-zinc-500">{item.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className={`h-full rounded-full ${item.color} transition-[width] duration-1000`} style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-1 row-span-1 rounded-2xl border border-white/6 bg-[#131316] p-5 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                  <div className="text-xs text-zinc-500 mb-3 font-medium uppercase tracking-wider">{t("landing.bento.latestConclusions")}</div>
                  <div className="space-y-2">
                    {[
                      { name: t("landing.bento.accountCompromise"), risk: 87, accent: "#ef4444" },
                      { name: t("landing.bento.credentialTheft"), risk: 78, accent: "#f59e0b" },
                      { name: t("landing.bento.lateralMovement"), risk: 65, accent: "#3b82f6" },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                        <span className="size-1.5 rounded-full" style={{ backgroundColor: item.accent }} />
                        <span className="text-xs text-zinc-300 flex-1">{item.name}</span>
                        <Badge variant="outline" className="text-[9px] border-white/10 text-zinc-400">
                          {t("landing.bento.risk")} {item.risk}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-1 row-span-1 rounded-2xl border border-white/6 bg-gradient-to-br from-[#131316] to-blue-950/20 p-5 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">{t("landing.bento.systemStatus")}</div>
                    <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px]">{t("landing.bento.healthy")}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5">
                      <div className="text-[10px] text-zinc-500">{t("landing.bento.avgResponse")}</div>
                      <div className="text-sm font-bold text-blue-400 mt-0.5">1.2s</div>
                    </div>
                    <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-2.5">
                      <div className="text-[10px] text-zinc-500">{t("landing.bento.todayAssessments")}</div>
                      <div className="text-sm font-bold text-violet-400 mt-0.5">226</div>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                        <span>{t("landing.bento.aiEngineLoad")}</span>
                        <span className="font-semibold text-zinc-300">64%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">{t("landing.bento.modelVersion")}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">v3.2.1</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ========== Social Proof ========== */}
      <section className="relative py-20 bg-[#0c0c10]">
        <AnimateIn>
          <div className="text-center mb-12">
            <p className="text-sm text-zinc-500 mb-8">{t("landing.social.servedClients")}</p>
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
              {[
                { name: t("landing.social.company1Name"), mark: t("landing.social.company1Mark"), tone: "from-red-500 to-rose-500" },
                { name: t("landing.social.company2Name"), mark: t("landing.social.company2Mark"), tone: "from-blue-500 to-violet-500" },
                { name: t("landing.social.company3Name"), mark: t("landing.social.company3Mark"), tone: "from-emerald-500 to-teal-500" },
                { name: t("landing.social.company4Name"), mark: t("landing.social.company4Mark"), tone: "from-sky-500 to-indigo-500" },
                { name: t("landing.social.company5Name"), mark: t("landing.social.company5Mark"), tone: "from-amber-500 to-orange-500" },
                { name: t("landing.social.company6Name"), mark: t("landing.social.company6Mark"), tone: "from-rose-500 to-pink-500" },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-2 rounded-full border border-white/6 bg-white/[0.02] px-4 py-2">
                  <span className={`flex size-6 items-center justify-center rounded-full bg-gradient-to-br ${item.tone} text-white text-xs font-bold`}>
                    {item.mark}
                  </span>
                  <span className="text-sm font-semibold text-zinc-300">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </AnimateIn>

        <AnimateIn delay={200}>
          <div className="max-w-4xl mx-auto mt-16 grid md:grid-cols-3 gap-6 px-4 sm:px-6 lg:px-8">
            {[
              { quote: t("landing.social.t1Quote"), company: t("landing.social.t1Company"), role: t("landing.social.t1Role") },
              { quote: t("landing.social.t2Quote"), company: t("landing.social.t2Company"), role: t("landing.social.t2Role") },
              { quote: t("landing.social.t3Quote"), company: t("landing.social.t3Company"), role: t("landing.social.t3Role") },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl border border-white/6 bg-[#131316] p-6 hover:border-white/10 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-200">
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">&ldquo;{item.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm">
                    {item.company[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-200">{item.role}</div>
                    <div className="text-xs text-zinc-500">{item.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnimateIn>
      </section>

      {/* ========== AI Reasoning Demo ========== */}
      <section className="relative py-24 bg-[#09090b]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.06)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent mb-4">
                {t("landing.demo.title")}
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                {t("landing.demo.subtitle")}
              </p>
            </div>
          </AnimateIn>

          <AnimateIn delay={150}>
            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-white/6 bg-[#131316] overflow-hidden shadow-[0_14px_34px_rgba(0,0,0,0.3)]">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                  <div className="size-2 rounded-full bg-red-400" />
                  <div className="size-2 rounded-full bg-yellow-400" />
                  <div className="size-2 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs text-zinc-500">
                    {t("landing.demo.engineTitle")}
                  </span>
                </div>

                <div className="p-6 space-y-5">
                  <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                    <AlertTriangle className="size-5 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-amber-300">
                        {t("landing.demo.signalReceived")}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {t("landing.demo.signalSource")}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="size-4 text-blue-400" />
                      <span className="text-sm font-medium text-zinc-200">
                        {t("landing.demo.aiReasoning")}
                      </span>
                    </div>
                    <div className="font-mono text-xs leading-relaxed text-blue-400/80">
                      <span className="text-blue-400/60">{"> "}</span>
                      {t("landing.demo.reasoningText")}
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="size-4 text-blue-400" />
                      <span className="text-sm font-medium text-zinc-200">
                        {t("landing.demo.attackConclusion")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="destructive" className="text-xs">
                        {t("landing.demo.accountCompromise")}
                      </Badge>
                      <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs">
                        {t("landing.demo.confidence")}
                      </Badge>
                      <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-400 text-xs">
                        {t("landing.demo.riskScore")}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {t("landing.demo.attackChain")}
                    </p>
                  </div>

                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="size-4 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-300">
                        {t("landing.demo.investigationConclusion")}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {[
                        t("landing.demo.rec1"),
                        t("landing.demo.rec2"),
                        t("landing.demo.rec3"),
                        t("landing.demo.rec4"),
                        t("landing.demo.rec5"),
                      ].map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-blue-500/20 bg-blue-500/10 text-[10px] text-blue-400">
                            {i + 1}
                          </span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ========== Core Capabilities ========== */}
      <section className="relative py-24 bg-[#0c0c10]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.05)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent mb-4">
                {t("landing.capabilities.title")}
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                {t("landing.capabilities.subtitle")}
              </p>
            </div>
          </AnimateIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap, idx) => {
              const colors = accentMap[cap.color];
              return (
                <AnimateIn key={cap.title} delay={idx * 100}>
                  <div
                    className={`group relative rounded-2xl border border-white/6 bg-[#131316] p-6 transition-all duration-300 hover:border-white/10 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5`}
                  >
                    <div className={`inline-flex items-center justify-center size-12 rounded-xl ${colors.bg} mb-4`}>
                      <cap.icon className={`size-6 ${colors.icon}`} />
                    </div>
                    <h3 className={`text-lg font-semibold ${colors.text} mb-2`}>
                      {cap.title}
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {cap.desc}
                    </p>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== Use Cases ========== */}
      <section className="relative py-24 bg-[#09090b]">
        <AnimateIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent mb-4">{t("landing.scenarios.title")}</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">{t("landing.scenarios.subtitle")}</p>
          </div>
        </AnimateIn>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {[
            { icon: Building2, title: t("landing.scenarios.finance"), desc: t("landing.scenarios.financeDesc"), accent: "#3b82f6" },
            { icon: Server, title: t("landing.scenarios.government"), desc: t("landing.scenarios.governmentDesc"), accent: "#ef4444" },
            { icon: Globe, title: t("landing.scenarios.internet"), desc: t("landing.scenarios.internetDesc"), accent: "#8b5cf6" },
            { icon: Zap, title: t("landing.scenarios.energy"), desc: t("landing.scenarios.energyDesc"), accent: "#f59e0b" },
          ].map((scene, idx) => (
            <AnimateIn key={scene.title} delay={idx * 100}>
              <div className="group rounded-2xl border border-white/6 bg-[#131316] p-6 hover:border-white/10 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-300">
                <scene.icon className="size-8 mb-4" style={{ color: scene.accent }} />
                <h3 className="font-semibold text-zinc-200 mb-2">{scene.title}</h3>
                <p className="text-sm text-zinc-400">{scene.desc}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-violet-800" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        <div className="relative max-w-4xl mx-auto text-center px-4">
          <AnimateIn>
            <Badge className="border-white/20 bg-white/10 text-white mb-6">{t("landing.cta.badge")}</Badge>
          </AnimateIn>
          <AnimateIn delay={100}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {t("landing.cta.title")}
            </h2>
          </AnimateIn>
          <AnimateIn delay={200}>
            <p className="text-lg text-blue-200/80 mb-10 max-w-2xl mx-auto">
              {t("landing.cta.subtitle")}
            </p>
          </AnimateIn>
          <AnimateIn delay={300}>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={handleDemoExperience}
                className="rounded-xl border border-white/30 bg-white text-blue-700 font-semibold hover:bg-blue-50 shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 transition-[shadow,transform] text-base px-8 h-12">
                {t("landing.cta.freeTrial")}
                <ArrowRight className="size-4 ml-2" />
              </Button>
              <DynamicContactFormDialog>
                <Button size="lg" variant="outline"
                  className="rounded-xl border-white/40 bg-transparent text-white hover:bg-white/10 text-base px-8 h-12">
                  {t("landing.cta.bookDemo")}
                </Button>
              </DynamicContactFormDialog>
            </div>
          </AnimateIn>
          <AnimateIn delay={400}>
            <div className="mt-14 pt-10 border-t border-white/10 flex flex-wrap justify-center gap-x-12 gap-y-4">
              {[
                { value: "200+", label: t("landing.cta.statClients") },
                { value: "99%", label: t("landing.cta.statNoiseReduction") },
                { value: "<5min", label: t("landing.cta.statResponseTime") },
                { value: "24/7", label: t("landing.cta.statMonitoring") },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-blue-200/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ========== Footer ========== */}
      <footer className="relative border-t border-white/5 bg-[#0c0c10]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Shield className="size-6 text-blue-400" />
                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  SecMind
                </span>
              </Link>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {t("marketing.footer.description")}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-4">{t("marketing.footer.product")}</h4>
              <ul className="space-y-2">
                {[
                  { label: t("marketing.footer.solutions"), href: "/solutions" },
                  { label: t("marketing.footer.pricing"), href: "/pricing" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-zinc-500 hover:text-blue-400 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-4">{t("marketing.footer.resources")}</h4>
              <ul className="space-y-2">
                {[
                  { label: t("marketing.footer.docs"), href: "/docs" },
                  { label: t("marketing.footer.apiRef"), href: "/docs" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-zinc-500 hover:text-blue-400 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-4">{t("marketing.footer.about")}</h4>
              <p className="text-sm text-zinc-500">
                {t("marketing.footer.aboutDesc")}
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-600">
              © 2026 SecMind. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}