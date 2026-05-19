'use client'

import { Shield, Brain, Crosshair, Zap } from 'lucide-react'
import { ToastProvider } from '@/components/ui/toast'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
    <div className="flex min-h-screen bg-[#09090b] text-zinc-200 overflow-x-hidden">
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between bg-gradient-to-br from-blue-950/80 via-[#09090b] to-violet-950/80">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
          }}
        />
        <div
          className="absolute inset-0 animate-[glowDrift_12s_ease-in-out_infinite_alternate]"
          aria-hidden="true"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 70% 30%, rgba(59,130,246,0.15) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 animate-[glowDrift2_15s_ease-in-out_infinite_alternate]"
          aria-hidden="true"
          style={{
            background: 'radial-gradient(ellipse 50% 60% at 30% 70%, rgba(139,92,246,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" aria-hidden="true" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-violet-500/8 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite_2s]" aria-hidden="true" />

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
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              <Shield className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              SecMind
            </span>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-8">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                AI自主安全研判平台
              </span>
            </h2>
            <p className="text-base leading-relaxed text-zinc-400 max-w-md">
              AI自主调查、攻击关联、风险推理与处置建议 — 让安全研判从人工处理走向AI自主
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="rounded-xl border border-blue-500/10 bg-blue-500/[0.04] p-4 backdrop-blur-sm">
                <Brain className="size-5 text-blue-400 mb-2" />
                <div className="text-sm font-medium text-zinc-200">AI自主调查</div>
                <div className="text-xs text-zinc-500 mt-1">92% 研判准确率</div>
              </div>
              <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.04] p-4 backdrop-blur-sm">
                <Crosshair className="size-5 text-amber-400 mb-2" />
                <div className="text-sm font-medium text-zinc-200">攻击链还原</div>
                <div className="text-xs text-zinc-500 mt-1">AI自动构建攻击链</div>
              </div>
              <div className="rounded-xl border border-purple-500/10 bg-purple-500/[0.04] p-4 backdrop-blur-sm">
                <Zap className="size-5 text-purple-400 mb-2" />
                <div className="text-sm font-medium text-zinc-200">AI自动处置</div>
                <div className="text-xs text-zinc-500 mt-1">调查到执行闭环</div>
              </div>
              <div className="rounded-xl border border-teal-500/10 bg-teal-500/[0.04] p-4 backdrop-blur-sm">
                <Shield className="size-5 text-teal-400 mb-2" />
                <div className="text-sm font-medium text-zinc-200">认知闭环</div>
                <div className="text-xs text-zinc-500 mt-1">AI持续学习进化</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-10">
          <p className="text-xs text-zinc-600">
            © 2026 SecMind. All rights reserved.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 lg:hidden mb-8 justify-center">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              <Shield className="size-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              SecMind
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
    </ToastProvider>
  )
}