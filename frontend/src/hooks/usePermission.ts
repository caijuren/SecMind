import { useMemo } from 'react'
import { useAuthStore } from '@/store/auth-store'

export function usePermission(resource: string, action: string): boolean {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  return useMemo(() => hasPermission(resource, action), [hasPermission, resource, action])
}

export function useHasAnyPermission(permissions: string[]): boolean {
  const userPermissions = useAuthStore((s) => s.permissions)

  return useMemo(() => {
    if (userPermissions.includes('*:*')) return true
    return permissions.some((perm) => userPermissions.includes(perm))
  }, [userPermissions, permissions])
}

export function useHasAllPermissions(permissions: string[]): boolean {
  const userPermissions = useAuthStore((s) => s.permissions)

  return useMemo(() => {
    if (userPermissions.includes('*:*')) return true
    return permissions.every((perm) => userPermissions.includes(perm))
  }, [userPermissions, permissions])
}