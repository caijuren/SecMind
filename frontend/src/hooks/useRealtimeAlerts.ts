"use client"

import { useState, useCallback, useRef } from "react"
import { useWebSocket } from "./useWebSocket"
import { useAlertStore } from "@/store/alert-store"
import type { Alert, AlertType, RiskLevel, AlertStatus } from "@/types"

interface UseRealtimeAlertsReturn {
  isConnected: boolean
  newAlertCount: number
  alerts: Alert[]
  clearNewAlerts: () => void
  lastMessage: RealtimeMessage | null
}

interface RealtimeAlertPayload {
  id?: string
  type?: string
  title?: string
  description?: string
  riskLevel?: Alert["riskLevel"]
  risk_level?: Alert["riskLevel"]
  status?: string
  source?: string
  sourceIp?: string
  source_ip?: string
  destinationIp?: string
  destination_ip?: string
  timestamp?: string
  rawLog?: string
  raw_log?: string
  tags?: string[]
  aiScore?: number
  ai_score?: number
  aiSummary?: string
  ai_summary?: string
  aiRecommendation?: string
  ai_recommendation?: string
  relatedAlerts?: string[]
  related_alerts?: string[]
}

export interface RealtimeMessage {
  type?: string
  data?: Record<string, unknown>
  [key: string]: unknown
}

export function useRealtimeConnection() {
  const { connectionStatus } = useWebSocket({})
  return { isConnected: connectionStatus === "connected" }
}

export function useRealtimeAlerts(): UseRealtimeAlertsReturn {
  const [newAlertCount, setNewAlertCount] = useState(0)
  const countRef = useRef(0)
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null)

  const addAlertToStore = useCallback((alertData: unknown) => {
    const payload = alertData as RealtimeAlertPayload
    const alert: Alert = {
      id: payload.id || `alert-${Date.now()}`,
      type: (payload.type || "phishing") as AlertType,
      title: payload.title || "New Alert",
      description: payload.description || "",
      riskLevel: (payload.riskLevel || payload.risk_level || "medium") as RiskLevel,
      status: (payload.status || "new") as AlertStatus,
      source: payload.source || "WebSocket",
      sourceIp: payload.sourceIp || payload.source_ip || "",
      destinationIp: payload.destinationIp || payload.destination_ip || "",
      timestamp: payload.timestamp || new Date().toISOString(),
      rawLog: payload.rawLog || payload.raw_log || "",
      tags: payload.tags || [],
      aiScore: payload.aiScore ?? payload.ai_score,
      aiSummary: payload.aiSummary ?? payload.ai_summary,
      aiRecommendation: payload.aiRecommendation ?? payload.ai_recommendation,
      relatedAlerts: payload.relatedAlerts ?? payload.related_alerts,
    }

    const store = useAlertStore.getState()
    const existingIds = new Set(store.alerts.map((a) => a.id))
    if (!existingIds.has(alert.id)) {
      useAlertStore.setState((state) => {
        state.alerts = [alert, ...state.alerts].slice(0, 100)
        state.pagination.total = state.pagination.total + 1
      })
      countRef.current += 1
      setNewAlertCount(countRef.current)
      setLastMessage({ type: "new_alert", ...payload })
    }
  }, [])

  const { connectionStatus } = useWebSocket({
    messageTypes: {
      new_alert: addAlertToStore,
      alert: addAlertToStore,
    },
  })

  return {
    isConnected: connectionStatus === "connected",
    newAlertCount,
    alerts: useAlertStore.getState().alerts,
    clearNewAlerts: () => {
      countRef.current = 0
      setNewAlertCount(0)
    },
    lastMessage,
  }
}
