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
import { useLocaleStore } from "@/store/locale-store"

interface ContactFormDialogProps {
  children: React.ReactElement
}

export function ContactFormDialog({ children }: ContactFormDialogProps) {
  const { t } = useLocaleStore()
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
      setSubmitError(t("contact.submitFailed"))
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
      <DialogContent className="sm:max-w-lg border-border shadow-md bg-background text-foreground">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="size-7 text-emerald-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground">{t("contact.submitSuccess")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("contact.submitSuccessDesc")}
              </p>
            </div>
            <Button
              className="mt-2 border border-border bg-muted text-muted-foreground hover:bg-muted/80"
              onClick={() => handleOpenChange(false)}
            >
              {t("contact.close")}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <MessageSquare className="size-4 text-blue-600" />
                </div>
                {t("contact.contactUs")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t("contact.contactDesc")}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs">
                    <User className="size-3 mr-1 inline" />
                    {t("contact.name")} <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    required
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder={t("contact.namePlaceholder")}
                    className="h-10 border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:border-blue-500/60 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs">
                    <Building2 className="size-3 mr-1 inline" />
                    {t("contact.company")} <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    required
                    name="company"
                    autoComplete="organization"
                    value={form.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                    placeholder={t("contact.companyPlaceholder")}
                    className="h-10 border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:border-blue-500/60 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs">
                    <Mail className="size-3 mr-1 inline" />
                    {t("contact.email")} <span className="text-red-600">*</span>
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
                    className="h-10 border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:border-blue-500/60 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs">
                    <Phone className="size-3 mr-1 inline" />
                    {t("contact.phone")} <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    required
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, "").slice(0, 11))}
                    placeholder="13800138000"
                    className="h-10 border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:border-blue-500/60 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">
                  <MessageSquare className="size-3 mr-1 inline" />
                  {t("contact.message")}
                </Label>
                <Textarea
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  placeholder={t("contact.messagePlaceholder")}
                  className="min-h-[100px] resize-none border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:border-blue-500/60 focus:ring-blue-500/20"
                />
              </div>

              {submitError && (
                <p className="text-center text-sm text-red-600" role="alert">{submitError}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 font-semibold gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t("contact.submitting")}
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    {t("contact.submit")}
                  </>
                )}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                {t("contact.privacyNotice")}
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
