"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  Radio,
  Inbox,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { ContactFormDialog } from "@/components/contact-form-dialog";

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

function useTypingEffect(text: string, speed: number = 40) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    setDisplayed("");
    setDone(false);
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return { displayed, done };
}

function AnimatedSuggestionCount() {
  const count = useCountUp(47, 2000);
  return <span>{count}</span>;
}

function TypingTriage() {
  const triageText =
    "AI推理引擎启动... 接收VPN异常登录信号，源IP 185.220.101.34 为Tor出口节点。关联分析：同一用户5分钟前点击钓鱼邮件链接，随后触发PowerShell编码反向Shell执行。攻击链推理：VPN凭证窃取→钓鱼邮件投递→恶意载荷执行→C2通信建立。生成攻击研判：账号失陷（置信度82%），建议启动调查。";
  const { displayed, done } = useTypingEffect(triageText, 25);
  return (
    <div className="font-mono text-xs leading-relaxed text-cyan-200/80">
      <span className="text-cyan-400/60">{"> "}</span>
      {displayed}
      {!done && (
        <span className="inline-block w-2 h-4 ml-0.5 bg-cyan-400 animate-pulse" />
      )}
    </div>
  );
}

const navItems = [
  { label: "首页", href: "/" },
  { label: "解决方案", href: "/solutions" },
  { label: "文档", href: "/docs" },
  { label: "定价", href: "/pricing" },
];

const capabilities = [
  { icon: Brain, title: "AI信号推理", desc: "自动感知安全信号、推理攻击意图，识别需要调查的威胁", color: "cyan" },
  { icon: Crosshair, title: "攻击研判引擎", desc: "基于证据链自动构建攻击假设，映射MITRE ATT&CK", color: "red" },
  { icon: Eye, title: "自主调查", desc: "AI自主完成调查，生成攻击链与推理结论供分析师复核", color: "amber" },
  { icon: Link2, title: "证据链自动构建", desc: "跨数据源自动关联，构建完整的攻击证据链", color: "teal" },
  { icon: Shield, title: "案件研判闭环", desc: "AI完成调查后生成案件，人类复核决策，确保研判可追溯", color: "purple" },
  { icon: Zap, title: "AI自动处置", desc: "基于攻击研判的AI自动处置策略，从研判到响应闭环", color: "emerald" },
];

const colorMap: Record<string, { border: string; bg: string; icon: string; text: string }> = {
  cyan: { border: "border-cyan-500/20", bg: "bg-cyan-500/10", icon: "text-cyan-400", text: "text-cyan-300" },
  red: { border: "border-red-500/20", bg: "bg-red-500/10", icon: "text-red-400", text: "text-red-300" },
  amber: { border: "border-amber-500/20", bg: "bg-amber-500/10", icon: "text-amber-400", text: "text-amber-300" },
  teal: { border: "border-teal-500/20", bg: "bg-teal-500/10", icon: "text-teal-400", text: "text-teal-300" },
  purple: { border: "border-purple-500/20", bg: "bg-purple-500/10", icon: "text-purple-400", text: "text-purple-300" },
  emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/10", icon: "text-emerald-400", text: "text-emerald-300" },
};

const architectureSteps = [
  { icon: Radio, label: "信号", color: "text-cyan-400" },
  { icon: Brain, label: "AI推理", color: "text-cyan-400" },
  { icon: Eye, label: "调查", color: "text-purple-400" },
  { icon: Shield, label: "案件", color: "text-amber-400" },
  { icon: Crosshair, label: "处置", color: "text-red-400" },
  { icon: Zap, label: "学习", color: "text-emerald-400" },
];



export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const handleDemoExperience = async () => {
    login(
      {
        id: 'DEMO001',
        name: '体验用户',
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
            <Button
              size="default"
              className="bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] font-semibold shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] hover:brightness-110 transition-all text-sm h-9 px-5"
              onClick={handleDemoExperience}
            >
              免费体验
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
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
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] font-semibold shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                onClick={handleDemoExperience}
              >
                免费体验
              </Button>
            </div>
          </div>
        )}
      </nav>

      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,212,255,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,180,180,0.06)_0%,transparent_60%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 px-3 py-1 text-sm">
                🚀 AI自主安全研判平台
              </Badge>

              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent leading-tight">
                  SecMind
                </h1>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-200">
                  AI自主安全研判平台
                </h2>
                <p className="text-lg text-slate-400 max-w-lg">
                  信号感知、攻击推理、案件研判、自动处置 — 让安全从人工处理走向AI自主
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-cyan-500 text-[#020a1a] font-semibold shadow-[0_0_24px_rgba(0,212,255,0.4)] hover:bg-cyan-400 hover:shadow-[0_0_36px_rgba(0,212,255,0.6)] text-base px-6 h-11"
                  onClick={handleDemoExperience}
                >
                  免费体验
                  <ChevronRight className="size-4 ml-1" />
                </Button>
                <ContactFormDialog>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 text-base px-6 h-11"
                  >
                    预约演示
                  </Button>
                </ContactFormDialog>
              </div>

              <div className="flex flex-wrap gap-8 pt-4">
                {[
                  { value: "87%", label: "推理准确率" },
                  { value: "<5min", label: "调查启动" },
                  { value: "3x", label: "效率提升" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl font-bold text-cyan-400 animate-pulse">
                      {stat.value}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl border border-cyan-500/20 bg-[#0a1628]/80 backdrop-blur-xl p-6 shadow-[0_0_40px_rgba(0,212,255,0.08)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-cyan-400" />
                    <span className="text-sm font-medium text-cyan-300">
                      AI推理概览
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400">AI在线</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-center">
                    <div className="text-2xl font-bold text-amber-400">
                      <AnimatedSuggestionCount />
                    </div>
                    <div className="text-xs text-amber-300/60 mt-1">待复核</div>
                  </div>
                  <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-center">
                    <div className="text-2xl font-bold text-cyan-400">23</div>
                    <div className="text-xs text-cyan-300/60 mt-1">调查中</div>
                  </div>
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                    <div className="text-2xl font-bold text-emerald-400">156</div>
                    <div className="text-xs text-emerald-300/60 mt-1">已研判</div>
                  </div>
                </div>

                <div className="rounded-lg border border-cyan-500/10 bg-[#020a1a]/60 p-4 mb-4">
                  <div className="text-xs text-slate-400 mb-3">最新调查结论</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-md border border-red-500/15 bg-red-500/[0.04] px-3 py-2">
                      <span className="size-1.5 rounded-full bg-red-400" />
                      <span className="text-xs text-slate-200 flex-1">账号失陷</span>
                      <Badge className="text-[9px] bg-red-500/15 text-red-400 border-red-500/30">风险 87</Badge>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-amber-500/15 bg-amber-500/[0.04] px-3 py-2">
                      <span className="size-1.5 rounded-full bg-amber-400" />
                      <span className="text-xs text-slate-200 flex-1">凭证窃取</span>
                      <Badge className="text-[9px] bg-amber-500/15 text-amber-400 border-amber-500/30">风险 78</Badge>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-cyan-500/15 bg-cyan-500/[0.04] px-3 py-2">
                      <span className="size-1.5 rounded-full bg-cyan-400" />
                      <span className="text-xs text-slate-200 flex-1">横向移动</span>
                      <Badge className="text-[9px] bg-cyan-500/15 text-cyan-400 border-cyan-500/30">风险 65</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-slate-400 mb-2">攻击研判分布</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400 w-12">账号失陷</span>
                    <div className="flex-1 h-2 rounded-full bg-[#020a1a] overflow-hidden">
                      <div className="h-full rounded-full bg-red-500" style={{ width: "35%" }} />
                    </div>
                    <span className="text-xs text-slate-500">35%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400 w-12">凭证窃取</span>
                    <div className="flex-1 h-2 rounded-full bg-[#020a1a] overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: "28%" }} />
                    </div>
                    <span className="text-xs text-slate-500">28%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-cyan-400 w-12">C2通信</span>
                    <div className="flex-1 h-2 rounded-full bg-[#020a1a] overflow-hidden">
                      <div className="h-full rounded-full bg-cyan-500" style={{ width: "22%" }} />
                    </div>
                    <span className="text-xs text-slate-500">22%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-teal-400 w-12">其他</span>
                    <div className="flex-1 h-2 rounded-full bg-[#020a1a] overflow-hidden">
                      <div className="h-full rounded-full bg-teal-500" style={{ width: "15%" }} />
                    </div>
                    <span className="text-xs text-slate-500">15%</span>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,212,255,0.05)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-4">
              AI推理能力展示
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              体验AI如何自主感知信号、推理攻击链、生成研判结论
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-cyan-500/20 bg-[#0a1628]/80 backdrop-blur-xl overflow-hidden shadow-[0_0_40px_rgba(0,212,255,0.06)]">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-cyan-500/10 bg-[#020a1a]/60">
                <div className="size-2 rounded-full bg-red-500" />
                <div className="size-2 rounded-full bg-yellow-500" />
                <div className="size-2 rounded-full bg-emerald-500" />
                <span className="ml-3 text-xs text-slate-500">
                  SecMind AI推理引擎
                </span>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <AlertTriangle className="size-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-amber-300">
                      接收新信号 — VPN异常登录
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      来源: VPN网关 | 时间: 2026-05-09 14:32:18 | 风险初评: 87
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-cyan-500/10 bg-[#020a1a]/60 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="size-4 text-cyan-400" />
                    <span className="text-sm font-medium text-cyan-300">
                      AI 推理过程
                    </span>
                  </div>
                  <TypingTriage />
                </div>

                <div className="rounded-lg border border-cyan-500/10 bg-[#020a1a]/60 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="size-4 text-cyan-400" />
                    <span className="text-sm font-medium text-cyan-300">
                      攻击研判结论
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                      账号失陷
                    </Badge>
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                      置信度: 82%
                    </Badge>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                      风险: 87
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    攻击链：VPN凭证窃取 → 钓鱼邮件投递 → PowerShell执行 → C2通信建立。建议立即启动调查。
                  </p>
                </div>

                <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-300">
                      AI调查结论
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "AI自主启动调查 — 攻击研判置信度超过阈值",
                      "关联证据：VPN异常 + 钓鱼邮件 + PowerShell执行",
                      "推荐复核人：陈明（安全主管）",
                      "建议处置：冻结账号 + 隔离设备 + 封禁C2 IP",
                      "MITRE映射：T1078 → T1566 → T1059 → T1071",
                    ].map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-cyan-500/20 bg-cyan-500/10 text-[10px] text-cyan-400">
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
        </div>
      </section>

      <section className="relative py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,212,255,0.05)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-4">
              核心能力
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              六大AI核心能力，覆盖安全研判全链路
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap) => {
              const colors = colorMap[cap.color];
              return (
                <div
                  key={cap.title}
                  className={`group relative rounded-2xl border ${colors.border} bg-white/[0.04] backdrop-blur-xl p-6 transition-all duration-300 hover:bg-white/[0.06] hover:shadow-[0_0_30px_rgba(0,212,255,0.06)]`}
                >
                  <div className={`inline-flex items-center justify-center size-12 rounded-xl ${colors.bg} mb-4`}>
                    <cap.icon className={`size-6 ${colors.icon}`} />
                  </div>
                  <h3 className={`text-lg font-semibold ${colors.text} mb-2`}>
                    {cap.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {cap.desc}
                  </p>

                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.04)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-4">
              系统架构
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              AI安全认知闭环，从信号感知到学习进化全链路贯通
            </p>
          </div>
          <div className="relative">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-0">
              {architectureSteps.map((step, idx) => (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 w-36 h-32 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:bg-white/[0.06] hover:border-cyan-500/20 hover:shadow-[0_0_24px_rgba(0,212,255,0.08)]">
                      <step.icon className={`size-7 ${step.color}`} />
                      <span className="text-sm font-medium text-slate-200 text-center">
                        {step.label}
                      </span>

                    </div>
                  </div>
                  {idx < architectureSteps.length - 1 && (
                    <>
                      <ChevronRight className="hidden lg:block size-5 text-cyan-500/40 mx-2 shrink-0" />
                      <div className="lg:hidden flex justify-center py-1">
                        <ChevronRight className="size-5 text-cyan-500/40 rotate-90" />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent hidden lg:block" />
          </div>
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
              <p className="text-sm text-slate-500 leading-relaxed">
                AI自主安全研判平台，让安全从告警处理走向AI自主调查。
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">产品</h4>
              <ul className="space-y-2">
                {[
                  { label: "解决方案", href: "/solutions" },
                  { label: "定价", href: "/pricing" },
                  { label: "更新日志", href: "#" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">资源</h4>
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
                      className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">关于</h4>
              <ul className="space-y-2">
                {["团队", "博客", "招聘", "合作伙伴"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">
              © 2026 SecMind. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["隐私政策", "服务条款", "Cookie设置"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-xs text-slate-600 hover:text-cyan-400 transition-colors"
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
