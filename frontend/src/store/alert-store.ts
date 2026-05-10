import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Alert, AlertType, RiskLevel, AlertStatus } from '@/types'

interface AlertFilters {
  type: AlertType | null
  riskLevel: RiskLevel | null
  status: AlertStatus | null
  search: string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
}

interface AlertState {
  alerts: Alert[]
  selectedAlert: Alert | null
  filters: AlertFilters
  pagination: Pagination
}

interface AlertActions {
  setAlerts: (alerts: Alert[], total?: number) => void
  selectAlert: (alert: Alert | null) => void
  setFilters: (filters: Partial<AlertFilters>) => void
  resetFilters: () => void
}

const defaultFilters: AlertFilters = {
  type: null,
  riskLevel: null,
  status: null,
  search: '',
}

const defaultPagination: Pagination = {
  page: 1,
  pageSize: 20,
  total: 0,
}

export type AlertStore = AlertState & AlertActions

export const useAlertStore = create<AlertStore>()(
  immer((set) => ({
    alerts: [],
    selectedAlert: null,
    filters: { ...defaultFilters },
    pagination: { ...defaultPagination },
    setAlerts: (alerts, total) =>
      set((state) => {
        state.alerts = alerts
        if (total !== undefined) {
          state.pagination.total = total
        }
      }),
    selectAlert: (alert) =>
      set((state) => {
        state.selectedAlert = alert
      }),
    setFilters: (partial) =>
      set((state) => {
        Object.assign(state.filters, partial)
        state.pagination.page = 1
      }),
    resetFilters: () =>
      set((state) => {
        state.filters = { ...defaultFilters }
        state.pagination.page = 1
      }),
  }))
)
