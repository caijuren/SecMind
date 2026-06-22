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
    <div className="flex min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between bg-background">
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(37,99,235,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,.06) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 p-10 pt-12">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
              <Shield className="size-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              SecMind
            </span>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-8">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold leading-tight">
              AI自主安全研判平台
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground max-w-md">
              AI自主调查、攻击关联、风险推理与处置建议 — 让安全研判从人工处理走向AI自主
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <Brain className="size-5 text-blue-600 mb-2" />
                <div className="text-sm font-medium text-foreground">AI自主调查</div>
                <div className="text-xs text-muted-foreground mt-1">92% 研判准确率</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <Crosshair className="size-5 text-amber-600 mb-2" />
                <div className="text-sm font-medium text-foreground">攻击链还原</div>
                <div className="text-xs text-muted-foreground mt-1">AI自动构建攻击链</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <Zap className="size-5 text-purple-600 mb-2" />
                <div className="text-sm font-medium text-foreground">AI自动处置</div>
                <div className="text-xs text-muted-foreground mt-1">调查到执行闭环</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <Shield className="size-5 text-teal-600 mb-2" />
                <div className="text-sm font-medium text-foreground">认知闭环</div>
                <div className="text-xs text-muted-foreground mt-1">AI持续学习进化</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-10">
          <p className="text-xs text-muted-foreground/60">
            © 2026 SecMind. All rights reserved.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 lg:hidden mb-8 justify-center">
            <div className="flex size-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
              <Shield className="size-4 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
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
