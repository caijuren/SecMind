"use client"

import React, { useState, useEffect } from 'react'
import { usePermission } from '@/hooks/usePermission'

interface PermissionGateProps {
  resource: string
  action: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGate({ resource, action, fallback = null, children }: PermissionGateProps) {
  const allowed = usePermission(resource, action)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true))
  }, [])

  // 未挂载时不渲染 children，避免 SSR/client hydration mismatch
  if (!mounted || !allowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
