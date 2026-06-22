import { create } from 'zustand'
import type { Alert, DashboardStats, Device, ITSMTicket, AIAnalysis, VPNSession } from '@/types'
import {
  mockAlerts,
  mockDashboardStats,
  mockDevices,
  mockITSMTickets,
  mockAIAnalyses,
  mockVPNSessions,
} from '@/data/mock-data'

/* ========= Pipeline Stats (derived from alerts) ========= */

export interface PipelineStats {
  rawAlerts: number
  deduplicated: number
  noiseFiltered: number
  correlated: number
  compressionRate: number
}

function derivePipelineStats(alerts: Alert[]): PipelineStats {
  const raw = alerts.length
  const deduplicated = Math.floor(raw * 0.72)
  const noiseFiltered = Math.floor(deduplicated * 0.65)
  const correlated = Math.floor(noiseFiltered * 0.45)
  const compressionRate = Math.round((1 - correlated / raw) * 1000) / 10
  return { rawAlerts: raw, deduplicated, noiseFiltered, correlated, compressionRate }
}

/* ========= Store State ========= */

interface MockDataState {
  alerts: Alert[]
  dashboardStats: DashboardStats
  devices: Device[]
  tickets: ITSMTicket[]
  analyses: AIAnalysis[]
  vpnSessions: VPNSession[]
  pipelineStats: PipelineStats
  securityScore: number
  isLoaded: boolean
}

interface MockDataActions {
  initialize: () => void
  getAlertById: (id: string) => Alert | undefined
  getAnalysisByAlertId: (alertId: string) => AIAnalysis | undefined
  getTicketsByAlertId: (alertId: string) => ITSMTicket[]
  getAlertsByType: (type: string) => Alert[]
  getAlertsByRiskLevel: (level: string) => Alert[]
  getAlertsByStatus: (status: string) => Alert[]
  getRelatedAlerts: (alertId: string) => Alert[]
  getRecentAlerts: (count: number) => Alert[]
  getCriticalAlerts: () => Alert[]
  getActiveTickets: () => ITSMTicket[]
}

export type MockDataStore = MockDataState & MockDataActions

export const useMockDataStore = create<MockDataStore>()((set, get) => ({
  alerts: [],
  dashboardStats: mockDashboardStats,
  devices: mockDevices,
  tickets: [],
  analyses: [],
  vpnSessions: [],
  pipelineStats: { rawAlerts: 0, deduplicated: 0, noiseFiltered: 0, correlated: 0, compressionRate: 0 },
  securityScore: 72,
  isLoaded: false,

  initialize: () => {
    const state = get()
    if (state.isLoaded) return

    // Use first 200 alerts for UI performance (full 10k is too heavy for client)
    const uiAlerts = mockAlerts.slice(0, 200)
    const uiAnalyses = mockAIAnalyses.slice(0, 100)
    const uiTickets = mockITSMTickets.slice(0, 50)
    const uiVpnSessions = mockVPNSessions.slice(0, 50)

    const pipelineStats = derivePipelineStats(uiAlerts)

    // Derive security score from alert data
    const criticalCount = uiAlerts.filter(a => a.riskLevel === 'critical').length
    const highCount = uiAlerts.filter(a => a.riskLevel === 'high').length
    const resolvedRate = uiAlerts.filter(a => a.status === 'resolved' || a.status === 'false_positive').length / uiAlerts.length
    const score = Math.max(20, Math.min(95, Math.round(85 - criticalCount * 0.3 - highCount * 0.1 + resolvedRate * 20)))

    set({
      alerts: uiAlerts,
      analyses: uiAnalyses,
      tickets: uiTickets,
      vpnSessions: uiVpnSessions,
      pipelineStats,
      securityScore: score,
      isLoaded: true,
    })
  },

  getAlertById: (id: string) => {
    return get().alerts.find(a => a.id === id)
  },

  getAnalysisByAlertId: (alertId: string) => {
    return get().analyses.find(a => a.alertId === alertId)
  },

  getTicketsByAlertId: (alertId: string) => {
    return get().tickets.filter(t => t.alertId === alertId)
  },

  getAlertsByType: (type: string) => {
    return get().alerts.filter(a => a.type === type)
  },

  getAlertsByRiskLevel: (level: string) => {
    return get().alerts.filter(a => a.riskLevel === level)
  },

  getAlertsByStatus: (status: string) => {
    return get().alerts.filter(a => a.status === status)
  },

  getRelatedAlerts: (alertId: string) => {
    const alert = get().alerts.find(a => a.id === alertId)
    if (!alert?.relatedAlerts?.length) return []
    return get().alerts.filter(a => alert.relatedAlerts!.includes(a.id))
  },

  getRecentAlerts: (count: number) => {
    return [...get().alerts]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, count)
  },

  getCriticalAlerts: () => {
    return get().alerts.filter(a => a.riskLevel === 'critical' && a.status !== 'resolved' && a.status !== 'false_positive')
  },

  getActiveTickets: () => {
    return get().tickets.filter(t => t.status === 'in_progress' || t.status === 'open')
  },
}))
