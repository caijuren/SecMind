import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { setApiToken } from '@/lib/api'

type UserRole = 'admin' | 'analyst' | 'viewer' | 'soc_manager'

interface AuthUser {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  avatarUrl?: string
  isDemo?: boolean
  isNewUser?: boolean
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  token: string | null
  rememberMe: boolean
  refreshToken: string | null
  permissions: string[]
}

interface AuthActions {
  login: (user: AuthUser, token: string, rememberMe?: boolean, refreshToken?: string | null) => void
  logout: () => void
  setUser: (user: Partial<AuthUser>) => void
  clearNewUserFlag: () => void
  setRememberMe: (rememberMe: boolean) => void
  setRefreshToken: (refreshToken: string | null) => void
  setPermissions: (permissions: string[]) => void
  hasPermission: (resource: string, action: string) => boolean
}

export type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      rememberMe: false,
      refreshToken: null,
      permissions: [],
      login: (user, token, rememberMe = false, refreshToken = null) =>
        set((state) => {
          state.user = user
          state.token = token
          state.isAuthenticated = true
          state.rememberMe = rememberMe
          if (refreshToken !== undefined && refreshToken !== null) {
            state.refreshToken = refreshToken
          }
          setApiToken(token)
        }),
      logout: () =>
        set((state) => {
          state.user = null
          state.token = null
          state.isAuthenticated = false
          state.rememberMe = false
          state.refreshToken = null
          state.permissions = []
          setApiToken(null)
        }),
      setUser: (partial) =>
        set((state) => {
          if (state.user) {
            Object.assign(state.user, partial)
          }
        }),
      clearNewUserFlag: () =>
        set((state) => {
          if (state.user) {
            state.user.isNewUser = false
          }
        }),
      setRememberMe: (rememberMe) =>
        set((state) => {
          state.rememberMe = rememberMe
        }),
      setRefreshToken: (refreshToken) =>
        set((state) => {
          state.refreshToken = refreshToken
        }),
      setPermissions: (permissions) =>
        set((state) => {
          state.permissions = permissions
        }),
      hasPermission: (resource, action) => {
        const { permissions, user } = get()
        if (user?.role === 'admin') return true
        const key = `${resource}:${action}`
        return permissions.includes(key)
      },
    })),
    {
      name: 'secmind-auth',
    }
  )
)
