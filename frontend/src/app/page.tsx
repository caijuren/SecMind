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

const colorMap: Record<string, { border: string; bg: string; icon: string; text: string }> = {
  cyan: { border: "border-cyan-500/30", bg: "bg-cyan-500/10", icon: "text-cyan-600", text: "text-cyan-700" },
  red: { border: "border-red-500/30", bg: "bg-red-500/10", icon: "text-red-600", text: "text-red-700" },
  amber: { border: "border-amber-500/30", bg: "bg-amber-500/10", icon: "text-amber-600", text: "text-amber-700" },
  teal: { border: "border-teal-500/30", bg: "bg-teal-500/10", icon: "text-teal-600", text: "text-teal-700" },
  purple: { border: "border-purple-500/30", bg: "bg-purple-500/10", icon: "text-purple-600", text: "text-purple-700" },
  emerald: { border: "border-emerald-500/30", bg: "bg-emerald-500/10", icon: "text-emerald-600", text: "text-emerald-700" },
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
    { icon: Brain, title: t("landing.capabilities.signalReasoning"), desc: t("landing.capabilities.signalReasoningDesc"), color: "cyan" },
    { icon: Crosshair, title: t("landing.capabilities.attackAssessment"), desc: t("landing.capabilities.attackAssessmentDesc"), color: "red" },
    { icon: Eye, title: t("landing.capabilities.autonomousInvestigation"), desc: t("landing.capabilities.autonomousInvestigationDesc"), color: "amber" },
    { icon: Link2, title: t("landing.capabilities.evidenceChain"), desc: t("landing.capabilities.evidenceChainDesc"), color: "teal" },
    { icon: Shield, title: t("landing.capabilities.assessmentLoop"), desc: t("landing.capabilities.assessmentLoopDesc"), color: "purple" },
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
                    ? "text-cyan-700 bg-cyan-50"
                    : "text-slate-600 hover:text-cyan-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="w-px h-5 bg-slate-200 mx-2" />
            <button
              onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-cyan-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Globe className="size-4" />
              <span>{locale === "zh-CN" ? "EN" : "中"}</span>
            </button>
            <Link href="/login">
              <Button
                variant="ghost"
                size="default"
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm h-9 px-5"
              >
                {t("marketing.nav.login")}
              </Button>
            </Link>
            <Button
              size="default"
              className="rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold shadow-[0_8px_24px_rgba(6,182,212,0.28)] hover:shadow-[0_12px_30px_rgba(6,182,212,0.38)] hover:-translate-y-0.5 transition-[shadow,transform] text-sm h-9 px-5"
              onClick={handleDemoExperience}
            >
              {t("marketing.nav.freeTrial")}
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
            <div className="flex items-center gap-2 pt-3 border-t border-slate-200 mt-2">
              <button
                onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-cyan-600 hover:bg-slate-100 rounded-md transition-colors"
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
                  className="w-full text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  {t("marketing.nav.login")}
                </Button>
              </Link>
              <Button
                size="sm"
                className="w-full rounded-lg border border-cyan-400/20 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold shadow-[0_8px_22px_rgba(6,182,212,0.24)]"
                onClick={handleDemoExperience}
              >
                {t("marketing.nav.freeTrial")}
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Bento Grid */}
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
                {t("landing.hero.badge")}
              </Badge>

              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-600 bg-clip-text text-transparent leading-tight">
                  {t("landing.hero.title")}
                </h1>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">
                  {t("landing.hero.subtitle")}
                </h2>
                <p className="text-lg text-slate-500 max-w-lg">
                  {t("landing.hero.description")}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="rounded-xl border border-cyan-500/20 bg-cyan-600 text-white font-semibold shadow-[0_10px_26px_rgba(6,182,212,0.28)] hover:bg-cyan-500 hover:shadow-[0_14px_32px_rgba(6,182,212,0.36)] hover:-translate-y-0.5 transition-[shadow,transform] text-base px-6 h-11"
                  onClick={handleDemoExperience}
                >
                  {t("landing.hero.freeTrial")}
                  <ChevronRight className="size-4 ml-1" />
                </Button>
                <DynamicContactFormDialog>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-cyan-300 bg-white text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 text-base px-6 h-11"
                  >
                    {t("landing.hero.bookDemo")}
                  </Button>
                </DynamicContactFormDialog>
              </div>

              <div className="flex flex-wrap gap-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600 tabular-nums">{stat87}%</div>
                  <div className="text-xs text-slate-500 mt-1">{t("landing.hero.statAccuracy")}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600 tabular-nums">&lt;5min</div>
                  <div className="text-xs text-slate-500 mt-1">{t("landing.hero.statInvestigation")}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600 tabular-nums">{stat3x}x</div>
                  <div className="text-xs text-slate-500 mt-1">{t("landing.hero.statEfficiency")}</div>
                </div>
              </div>
            </div>

            {/* Bento Grid */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 grid-rows-2 gap-3">
                <div className="col-span-1 row-span-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_0_40px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-cyan-600" />
                      <span className="text-sm font-medium text-slate-800">{t("landing.bento.aiCenter")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs text-emerald-600">{t("landing.bento.online")}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
                      <div className="text-xl font-bold text-amber-600"><AnimatedSuggestionCount /></div>
                      <div className="text-[10px] text-amber-600/70 mt-0.5">{t("landing.bento.pendingReview")}</div>
                    </div>
                    <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-center">
                      <div className="text-xl font-bold text-cyan-600">23</div>
                      <div className="text-[10px] text-cyan-600/70 mt-0.5">{t("landing.bento.investigating")}</div>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                      <div className="text-xl font-bold text-emerald-600">156</div>
                      <div className="text-[10px] text-emerald-600/70 mt-0.5">{t("landing.bento.assessed")}</div>
                    </div>
                  </div>
                </div>

                <div className="col-span-1 row-span-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_0_40px_rgba(0,0,0,0.06)]">
                  <div className="text-xs text-slate-500 mb-3 font-medium">{t("landing.bento.attackDistribution")}</div>
                  <div className="space-y-2.5">
                    {[
                      { label: t("landing.bento.accountCompromise"), pct: 35, color: "bg-red-500", textColor: "text-red-600" },
                      { label: t("landing.bento.credentialTheft"), pct: 28, color: "bg-amber-500", textColor: "text-amber-600" },
                      { label: t("landing.bento.c2Communication"), pct: 22, color: "bg-cyan-500", textColor: "text-cyan-600" },
                      { label: t("landing.bento.other"), pct: 15, color: "bg-teal-500", textColor: "text-teal-600" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] ${item.textColor}`}>{item.label}</span>
                          <span className="text-[10px] text-slate-500">{item.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full rounded-full ${item.color} transition-[width] duration-1000`} style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-1 row-span-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_0_40px_rgba(0,0,0,0.06)]">
                  <div className="text-xs text-slate-500 mb-3 font-medium">{t("landing.bento.latestConclusions")}</div>
                  <div className="space-y-2">
                    {[
                      {
                        name: t("landing.bento.accountCompromise"),
                        risk: 87,
                        row: "border-red-200 bg-red-50",
                        dot: "bg-red-500",
                        badge: "border-red-200 bg-red-100 text-red-700",
                      },
                      {
                        name: t("landing.bento.credentialTheft"),
                        risk: 78,
                        row: "border-amber-200 bg-amber-50",
                        dot: "bg-amber-500",
                        badge: "border-amber-200 bg-amber-100 text-amber-700",
                      },
                      {
                        name: t("landing.bento.lateralMovement"),
                        risk: 65,
                        row: "border-cyan-200 bg-cyan-50",
                        dot: "bg-cyan-500",
                        badge: "border-cyan-200 bg-cyan-100 text-cyan-700",
                      },
                    ].map((item) => (
                      <div key={item.name} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${item.row}`}>
                        <span className={`size-1.5 rounded-full ${item.dot}`} />
                        <span className="text-xs text-slate-700 flex-1">{item.name}</span>
                        <Badge className={`text-[9px] ${item.badge}`}>{t("landing.bento.risk")} {item.risk}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-1 row-span-1 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-cyan-50/40 p-5 shadow-[0_0_40px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-slate-600 font-semibold tracking-wide">{t("landing.bento.systemStatus")}</div>
                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]">{t("landing.bento.healthy")}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-2.5">
                      <div className="text-[10px] text-slate-500">{t("landing.bento.avgResponse")}</div>
                      <div className="text-sm font-bold text-cyan-700 mt-0.5">1.2s</div>
                    </div>
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-2.5">
                      <div className="text-[10px] text-slate-500">{t("landing.bento.todayAssessments")}</div>
                      <div className="text-sm font-bold text-violet-700 mt-0.5">226</div>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span>{t("landing.bento.aiEngineLoad")}</span>
                        <span className="font-semibold text-slate-700">64%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-cyan-500 to-teal-500" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">{t("landing.bento.modelVersion")}</span>
                      <span className="text-[10px] text-slate-600 font-mono">v3.2.1</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 w-24 h-24 bg-cyan-400/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative py-20 bg-white">
        <AnimateIn>
          <div className="text-center mb-12">
            <p className="text-sm text-slate-500 mb-8">{t("landing.social.servedClients")}</p>
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
              {[
                { name: t("landing.social.company1Name"), mark: t("landing.social.company1Mark"), tone: "from-red-500 to-rose-500" },
                { name: t("landing.social.company2Name"), mark: t("landing.social.company2Mark"), tone: "from-blue-500 to-cyan-500" },
                { name: t("landing.social.company3Name"), mark: t("landing.social.company3Mark"), tone: "from-emerald-500 to-teal-500" },
                { name: t("landing.social.company4Name"), mark: t("landing.social.company4Mark"), tone: "from-sky-500 to-indigo-500" },
                { name: t("landing.social.company5Name"), mark: t("landing.social.company5Mark"), tone: "from-amber-500 to-orange-500" },
                { name: t("landing.social.company6Name"), mark: t("landing.social.company6Mark"), tone: "from-rose-500 to-pink-500" },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
                  <span className={`flex size-6 items-center justify-center rounded-full bg-gradient-to-br ${item.tone} text-white text-xs font-bold`}>
                    {item.mark}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{item.name}</span>
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
              <div key={i} className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-6 shadow-[0_10px_24px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_30px_rgba(15,23,42,0.10)] hover:-translate-y-0.5 transition-[shadow,transform]">
                <p className="text-sm text-slate-600 leading-relaxed mb-4">&ldquo;{item.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 text-white flex items-center justify-center font-bold text-sm">
                    {item.company[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{item.role}</div>
                    <div className="text-xs text-slate-500">{item.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnimateIn>
      </section>

      {/* AI Reasoning Demo */}
      <section className="relative py-24 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.05)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-4">
                {t("landing.demo.title")}
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                {t("landing.demo.subtitle")}
              </p>
            </div>
          </AnimateIn>

          <AnimateIn delay={150}>
            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-200 bg-slate-50">
                  <div className="size-2 rounded-full bg-red-400" />
                  <div className="size-2 rounded-full bg-yellow-400" />
                  <div className="size-2 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs text-slate-500">
                    {t("landing.demo.engineTitle")}
                  </span>
                </div>

                <div className="p-6 space-y-5">
                  <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <AlertTriangle className="size-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-amber-800">
                        {t("landing.demo.signalReceived")}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {t("landing.demo.signalSource")}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200/90 bg-slate-50/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="size-4 text-cyan-600" />
                      <span className="text-sm font-medium text-slate-800">
                        {t("landing.demo.aiReasoning")}
                      </span>
                    </div>
                    <div className="font-mono text-xs leading-relaxed text-cyan-700/80">
                      <span className="text-cyan-600/80">{"> "}</span>
                      {t("landing.demo.reasoningText")}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200/90 bg-slate-50/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="size-4 text-cyan-600" />
                      <span className="text-sm font-medium text-slate-800">
                        {t("landing.demo.attackConclusion")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                        {t("landing.demo.accountCompromise")}
                      </Badge>
                      <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 text-xs">
                        {t("landing.demo.confidence")}
                      </Badge>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                        {t("landing.demo.riskScore")}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {t("landing.demo.attackChain")}
                    </p>
                  </div>

                  <div className="rounded-lg border border-emerald-200/90 bg-emerald-50/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">
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
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-cyan-300 bg-cyan-50 text-[10px] text-cyan-700">
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

      {/* Core Capabilities */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.05)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-4">
                {t("landing.capabilities.title")}
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                {t("landing.capabilities.subtitle")}
              </p>
            </div>
          </AnimateIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap, idx) => {
              const colors = colorMap[cap.color];
              return (
                <AnimateIn key={cap.title} delay={idx * 100}>
                  <div
                    className={`group relative rounded-2xl border ${colors.border} bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-[shadow,transform] duration-300 hover:shadow-[0_18px_34px_rgba(6,182,212,0.14)] hover:-translate-y-0.5`}
                  >
                    <div className={`inline-flex items-center justify-center size-12 rounded-xl ${colors.bg} mb-4`}>
                      <cap.icon className={`size-6 ${colors.icon}`} />
                    </div>
                    <h3 className={`text-lg font-semibold ${colors.text} mb-2`}>
                      {cap.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {cap.desc}
                    </p>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="relative py-24 bg-white">
        <AnimateIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-4">{t("landing.scenarios.title")}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">{t("landing.scenarios.subtitle")}</p>
          </div>
        </AnimateIn>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {[
            { icon: Building2, title: t("landing.scenarios.finance"), desc: t("landing.scenarios.financeDesc"), color: "blue" },
            { icon: Server, title: t("landing.scenarios.government"), desc: t("landing.scenarios.governmentDesc"), color: "red" },
            { icon: Globe, title: t("landing.scenarios.internet"), desc: t("landing.scenarios.internetDesc"), color: "purple" },
            { icon: Zap, title: t("landing.scenarios.energy"), desc: t("landing.scenarios.energyDesc"), color: "amber" },
          ].map((scene, idx) => (
            <AnimateIn key={scene.title} delay={idx * 100}>
              <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_22px_rgba(15,23,42,0.05)] hover:border-cyan-300 hover:shadow-[0_16px_30px_rgba(6,182,212,0.12)] hover:-translate-y-0.5 transition-[shadow,transform] duration-300">
                <scene.icon className="size-8 text-cyan-600 mb-4" />
                <h3 className="font-semibold text-slate-800 mb-2">{scene.title}</h3>
                <p className="text-sm text-slate-500">{scene.desc}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-cyan-700 to-teal-800" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        <div className="relative max-w-4xl mx-auto text-center px-4">
          <AnimateIn>
            <Badge className="border-white/30 bg-white/10 text-white mb-6">{t("landing.cta.badge")}</Badge>
          </AnimateIn>
          <AnimateIn delay={100}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {t("landing.cta.title")}
            </h2>
          </AnimateIn>
          <AnimateIn delay={200}>
            <p className="text-lg text-cyan-100/80 mb-10 max-w-2xl mx-auto">
              {t("landing.cta.subtitle")}
            </p>
          </AnimateIn>
          <AnimateIn delay={300}>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={handleDemoExperience}
                className="rounded-xl border border-white/50 bg-white text-cyan-700 font-semibold hover:bg-cyan-50 shadow-[0_10px_30px_rgba(255,255,255,0.24)] hover:-translate-y-0.5 transition-[shadow,transform] text-base px-8 h-12">
                {t("landing.cta.freeTrial")}
                <ArrowRight className="size-4 ml-2" />
              </Button>
              <DynamicContactFormDialog>
                <Button size="lg" variant="outline"
                  className="rounded-xl border-white/60 bg-white text-cyan-700 hover:bg-cyan-50 text-base px-8 h-12">
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
                {t("marketing.footer.description")}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-4">{t("marketing.footer.product")}</h4>
              <ul className="space-y-2">
                {[
                  { label: t("marketing.footer.solutions"), href: "/solutions" },
                  { label: t("marketing.footer.pricing"), href: "/pricing" },
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
              <h4 className="text-sm font-semibold text-slate-700 mb-4">{t("marketing.footer.resources")}</h4>
              <ul className="space-y-2">
                {[
                  { label: t("marketing.footer.docs"), href: "/docs" },
                  { label: t("marketing.footer.apiRef"), href: "/docs" },
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
              <h4 className="text-sm font-semibold text-slate-700 mb-4">{t("marketing.footer.about")}</h4>
              <p className="text-sm text-slate-500">
                {t("marketing.footer.aboutDesc")}
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © 2026 SecMind. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
