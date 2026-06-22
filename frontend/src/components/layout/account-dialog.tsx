"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Camera, User, Lock, Save, Upload } from "lucide-react"
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
  const [, setSelectedFile] = useState<File | null>(null)

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
          <Image
            src={currentAvatar}
            alt={user?.name ?? "用户头像"}
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-cyan-600 text-2xl font-medium ring-1 ring-cyan-500/30">
            {initials}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="更换头像"
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Camera className="size-5 text-foreground" />
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
            className="gap-1.5 bg-cyan-600 text-foreground hover:bg-cyan-700"
          >
            <Save className="size-3.5" />
            {t("topbar.save")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="border-border text-muted-foreground hover:bg-muted/30 hover:text-muted-foreground"
          >
            {t("topbar.cancelAvatar")}
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="gap-1.5 border-border text-muted-foreground hover:bg-primary/10 hover:text-cyan-600 hover:border-primary/30"
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
        <label htmlFor="nickname-input" className="text-xs text-muted-foreground">{t("topbar.nicknameLabel")}</label>
        <Input
          id="nickname-input"
          name="nickname"
          autoComplete="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={t("topbar.nicknamePlaceholder")}
          className="h-9 border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary/60 focus-visible:ring-cyan-400/20"
        />
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSave}
          className="gap-1.5 bg-cyan-600 text-foreground hover:bg-cyan-700"
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
        <label htmlFor="current-password" className="text-xs text-muted-foreground">{t("topbar.currentPassword")}</label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder={t("topbar.currentPasswordPlaceholder")}
          className="h-9 border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary/60 focus-visible:ring-cyan-400/20"
        />
      </div>
      <Separator className="bg-muted/50" />
      <div className="space-y-2">
        <label htmlFor="new-password" className="text-xs text-muted-foreground">{t("topbar.newPassword")}</label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={t("topbar.newPasswordPlaceholder")}
          className="h-9 border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary/60 focus-visible:ring-cyan-400/20"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="confirm-password" className="text-xs text-muted-foreground">{t("topbar.confirmPassword")}</label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t("topbar.confirmPasswordPlaceholder")}
          className="h-9 border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary/60 focus-visible:ring-cyan-400/20"
        />
      </div>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSave}
          className="gap-1.5 bg-cyan-600 text-foreground hover:bg-cyan-700"
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
      <DialogContent className="sm:max-w-md border-border bg-card text-muted-foreground shadow-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {t("topbar.accountSettings")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("topbar.profile")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="avatar">
          <TabsList className="border border-border bg-muted/30">
            <TabsTrigger value="avatar" className="data-active:bg-muted/50 data-active:text-cyan-600">
              <Camera className="size-3.5 mr-1" />
              {t("topbar.changeAvatar")}
            </TabsTrigger>
            <TabsTrigger value="nickname" className="data-active:bg-muted/50 data-active:text-cyan-600">
              <User className="size-3.5 mr-1" />
              {t("topbar.changeNickname")}
            </TabsTrigger>
            <TabsTrigger value="password" className="data-active:bg-muted/50 data-active:text-cyan-600">
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
