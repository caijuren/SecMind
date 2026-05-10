import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { DashboardStats } from '@/types'

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d'

interface DashboardState {
  stats: DashboardStats | null
  timeRange: TimeRange
}

interface DashboardActions {
  setStats: (stats: DashboardStats) => void
  setTimeRange: (range: TimeRange) => void
}

export type DashboardStore = DashboardState & DashboardActions

export const useDashboardStore = create<DashboardStore>()(
  immer((set) => ({
    stats: null,
    timeRange: '24h',
    setStats: (stats) =>
      set((state) => {
        state.stats = stats
      }),
    setTimeRange: (range) =>
      set((state) => {
        state.timeRange = range
      }),
  }))
)
