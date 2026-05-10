'use client'

import { Shield, Brain, Crosshair, Zap } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dark flex min-h-screen bg-[#0a0e1a]">
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between bg-gradient-to-br from-[#020a1a] via-[#061525] to-[#0a1628]">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div
          className="absolute inset-0 animate-[glowDrift_12s_ease-in-out_infinite_alternate]"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 70% 30%, rgba(0,212,255,0.1) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 animate-[glowDrift2_15s_ease-in-out_infinite_alternate]"
          style={{
            background: 'radial-gradient(ellipse 50% 60% at 30% 70%, rgba(0,180,180,0.08) 0%, transparent 70%)',
          }}
        />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-teal-500/6 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite_2s]" />

        <style>{`
          @keyframes glowDrift {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(-20px, 15px) scale(1.05); }
          }
          @keyframes glowDrift2 {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(15px, -20px) scale(1.08); }
          }
        `}</style>

        <div className="relative z-10 p-10 pt-12">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 shadow-[0_0_16px_rgba(0,212,255,0.3)]">
              <Shield className="size-5 text-[#020a1a]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              SecMind
            </span>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-8">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold leading-tight text-white">
              AI自主安全研判平台
            </h2>
            <p className="text-base leading-relaxed text-white/50 max-w-md">
              AI自主调查、攻击关联、风险推理与处置建议 — 让安全研判从人工处理走向AI自主
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/[0.06] p-4">
                <Brain className="size-5 text-cyan-400 mb-2" />
                <div className="text-sm font-medium text-cyan-300">AI自主调查</div>
                <div className="text-xs text-white/40 mt-1">92% 研判准确率</div>
              </div>
              <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.06] p-4">
                <Crosshair className="size-5 text-amber-400 mb-2" />
                <div className="text-sm font-medium text-amber-300">攻击链还原</div>
                <div className="text-xs text-white/40 mt-1">AI自动构建攻击链</div>
              </div>
              <div className="rounded-xl border border-purple-500/15 bg-purple-500/[0.06] p-4">
                <Zap className="size-5 text-purple-400 mb-2" />
                <div className="text-sm font-medium text-purple-300">AI自动处置</div>
                <div className="text-xs text-white/40 mt-1">调查到执行闭环</div>
              </div>
              <div className="rounded-xl border border-teal-500/15 bg-teal-500/[0.06] p-4">
                <Shield className="size-5 text-teal-400 mb-2" />
                <div className="text-sm font-medium text-teal-300">认知闭环</div>
                <div className="text-xs text-white/40 mt-1">AI持续学习进化</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-10">
          <p className="text-xs text-white/25">
            © 2026 SecMind. All rights reserved.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 lg:hidden mb-8 justify-center">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 shadow-[0_0_16px_rgba(0,212,255,0.3)]">
              <Shield className="size-4 text-[#020a1a]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              SecMind
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
