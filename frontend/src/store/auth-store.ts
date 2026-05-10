import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

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
}

interface AuthActions {
  login: (user: AuthUser, token: string) => void
  logout: () => void
  setUser: (user: Partial<AuthUser>) => void
  clearNewUserFlag: () => void
}

export type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      login: (user, token) =>
        set((state) => {
          state.user = user
          state.token = token
          state.isAuthenticated = true
        }),
      logout: () =>
        set((state) => {
          state.user = null
          state.token = null
          state.isAuthenticated = false
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
    })),
    {
      name: 'secmind-auth',
    }
  )
)
