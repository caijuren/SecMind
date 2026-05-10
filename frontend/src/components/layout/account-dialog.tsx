"use client"

import { useState, useRef } from "react"
import { Camera, User, Lock, Save, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import { useLocaleStore } from "@/store/locale-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface AccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function AvatarTab({ t }: { t: (key: string) => string }) {
  const { user, setUser } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : "U"

  const currentAvatar = user?.avatarUrl || preview

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) return

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (preview) {
      setUser({ avatarUrl: preview })
      setSelectedFile(null)
    }
  }

  const handleCancel = () => {
    setPreview(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative group">
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt={user?.name ?? "avatar"}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-400 text-2xl font-medium">
            {initials}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Camera className="size-5 text-white" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {preview && !user?.avatarUrl?.startsWith(preview) ? (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            className="gap-1.5 bg-cyan-600 text-white hover:bg-cyan-700"
          >
            <Save className="size-3.5" />
            {t("topbar.save")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="border-white/10 text-white/50 hover:bg-white/[0.04] hover:text-white/70"
          >
            {t("topbar.cancelAvatar")}
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="gap-1.5 border-white/10 text-white/50 hover:bg-white/[0.04] hover:text-cyan-400 hover:border-cyan-500/30"
        >
          <Upload className="size-3.5" />
          {t("topbar.uploadAvatar")}
        </Button>
      )}
    </div>
  )
}

function NicknameTab({ t }: { t: (key: string) => string }) {
  const { user, setUser } = useAuthStore()
  const [nickname, setNickname] = useState(user?.name ?? "")

  const handleSave = () => {
    if (nickname.trim()) {
      setUser({ name: nickname.trim() })
    }
  }

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-xs text-slate-400">{t("topbar.nicknameLabel")}</label>
        <Input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={t("topbar.nicknamePlaceholder")}
          className="h-9 border-white/[0.08] bg-white/[0.04] text-sm text-slate-300 placeholder:text-slate-600 focus-visible:border-cyan-400/40 focus-visible:ring-cyan-400/20"
        />
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSave}
          className="gap-1.5 bg-cyan-600 text-white hover:bg-cyan-700"
        >
          <Save className="size-3.5" />
          {t("topbar.save")}
        </Button>
      </div>
    </div>
  )
}

function PasswordTab({ t }: { t: (key: string) => string }) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")

  const handleSave = () => {
    if (!currentPassword || !newPassword || !confirmPassword) return

    if (newPassword !== confirmPassword) {
      setError(t("topbar.passwordMismatch"))
      return
    }
    setError("")
  }

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-xs text-slate-400">{t("topbar.currentPassword")}</label>
        <Input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder={t("topbar.currentPasswordPlaceholder")}
          className="h-9 border-white/[0.08] bg-white/[0.04] text-sm text-slate-300 placeholder:text-slate-600 focus-visible:border-cyan-400/40 focus-visible:ring-cyan-400/20"
        />
      </div>
      <Separator className="bg-white/[0.06]" />
      <div className="space-y-2">
        <label className="text-xs text-slate-400">{t("topbar.newPassword")}</label>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={t("topbar.newPasswordPlaceholder")}
          className="h-9 border-white/[0.08] bg-white/[0.04] text-sm text-slate-300 placeholder:text-slate-600 focus-visible:border-cyan-400/40 focus-visible:ring-cyan-400/20"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs text-slate-400">{t("topbar.confirmPassword")}</label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t("topbar.confirmPasswordPlaceholder")}
          className="h-9 border-white/[0.08] bg-white/[0.04] text-sm text-slate-300 placeholder:text-slate-600 focus-visible:border-cyan-400/40 focus-visible:ring-cyan-400/20"
        />
      </div>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSave}
          className="gap-1.5 bg-cyan-600 text-white hover:bg-cyan-700"
        >
          <Save className="size-3.5" />
          {t("topbar.save")}
        </Button>
      </div>
    </div>
  )
}

export function AccountDialog({ open, onOpenChange }: AccountDialogProps) {
  const { t } = useLocaleStore()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-white/[0.08] bg-[#0a1628] text-slate-300 shadow-[0_0_40px_rgba(0,212,255,0.12)]">
        <DialogHeader>
          <DialogTitle className="text-white">
            {t("topbar.accountSettings")}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {t("topbar.profile")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="avatar">
          <TabsList className="bg-white/[0.04] border border-white/[0.06]">
            <TabsTrigger value="avatar" className="data-active:bg-cyan-400/10 data-active:text-cyan-400">
              <Camera className="size-3.5 mr-1" />
              {t("topbar.changeAvatar")}
            </TabsTrigger>
            <TabsTrigger value="nickname" className="data-active:bg-cyan-400/10 data-active:text-cyan-400">
              <User className="size-3.5 mr-1" />
              {t("topbar.changeNickname")}
            </TabsTrigger>
            <TabsTrigger value="password" className="data-active:bg-cyan-400/10 data-active:text-cyan-400">
              <Lock className="size-3.5 mr-1" />
              {t("topbar.changePassword")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="avatar" className="mt-4">
            <AvatarTab t={t} />
          </TabsContent>
          <TabsContent value="nickname" className="mt-4">
            <NicknameTab t={t} />
          </TabsContent>
          <TabsContent value="password" className="mt-4">
            <PasswordTab t={t} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
