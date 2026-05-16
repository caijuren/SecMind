"use client"

import { useState } from "react"
import {
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Building2,
  User,
  Mail,
  Phone,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ContactFormDialogProps {
  children: React.ReactElement
}

export function ContactFormDialog({ children }: ContactFormDialogProps) {
  const [submitted, setSubmitted] = useState(false)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    message: "",
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const [submitError, setSubmitError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setIsSubmitting(true)
    setSubmitError("")
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || (
        process.env.NODE_ENV === "production"
          ? "https://api.secmind.com"
          : "http://127.0.0.1:8000"
      )
      const res = await fetch(`${baseURL}/api/v1/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setSubmitted(true)
    } catch {
      setSubmitError("提交失败，请稍后重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setTimeout(() => {
        setSubmitted(false)
        setForm({ name: "", company: "", email: "", phone: "", message: "" })
      }, 200)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-lg border-slate-200 bg-white text-slate-800 shadow-xl shadow-slate-200/60">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <CheckCircle2 className="size-7 text-emerald-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">提交成功</h3>
              <p className="text-sm text-slate-500">
                我们的团队将在1个工作日内与您联系
              </p>
            </div>
            <Button
              className="mt-2 border border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
              onClick={() => handleOpenChange(false)}
            >
              关闭
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-50">
                  <MessageSquare className="size-4 text-cyan-700" />
                </div>
                联系我们
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                填写以下信息，我们的团队将尽快与您取得联系
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-600 text-xs">
                    <User className="size-3 mr-1 inline" />
                    姓名 <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    required
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="您的姓名"
                    className="h-10 border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-cyan-400/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 text-xs">
                    <Building2 className="size-3 mr-1 inline" />
                    公司名称 <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    required
                    name="company"
                    autoComplete="organization"
                    value={form.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                    placeholder="公司名称"
                    className="h-10 border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-cyan-400/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-600 text-xs">
                    <Mail className="size-3 mr-1 inline" />
                    工作邮箱 <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    spellCheck={false}
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="you@company.com"
                    className="h-10 border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-cyan-400/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 text-xs">
                    <Phone className="size-3 mr-1 inline" />
                    手机号 <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    required
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, "").slice(0, 11))}
                    placeholder="13800138000"
                    className="h-10 border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-cyan-400/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-600 text-xs">
                  <MessageSquare className="size-3 mr-1 inline" />
                  留言
                </Label>
                <Textarea
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  placeholder="请描述您的需求或想了解的内容..."
                  className="min-h-[100px] resize-none border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-cyan-400/20"
                />
              </div>

              {submitError && (
                <p className="text-center text-sm text-red-500" role="alert">{submitError}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 font-semibold gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] hover:brightness-110 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    提交中…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    提交
                  </>
                )}
              </Button>

              <p className="text-[10px] text-slate-400 text-center">
                提交即表示您同意我们的隐私政策，我们不会向第三方共享您的信息
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
