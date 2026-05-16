"use client"

import React from 'react'
import { usePermission } from '@/hooks/usePermission'

interface PermissionGateProps {
  resource: string
  action: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGate({ resource, action, fallback = null, children }: PermissionGateProps) {
  const allowed = usePermission(resource, action)

  if (!allowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}