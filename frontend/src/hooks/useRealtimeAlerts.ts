"use client"

import { useState, useCallback, useRef } from "react"
import { useWebSocket } from "./useWebSocket"
import { useAlertStore } from "@/store/alert-store"
import type { Alert } from "@/types"

interface UseRealtimeAlertsReturn {
  isConnected: boolean
  newAlertCount: number
}

export function useRealtimeAlerts(): UseRealtimeAlertsReturn {
  const [newAlertCount, setNewAlertCount] = useState(0)
  const countRef = useRef(0)

  const addAlertToStore = useCallback((alertData: any) => {
    const alert: Alert = {
      id: alertData.id || `alert-${Date.now()}`,
      type: alertData.type || "phishing",
      title: alertData.title || "New Alert",
      description: alertData.description || "",
      riskLevel: alertData.riskLevel || alertData.risk_level || "medium",
      status: alertData.status || "new",
      source: alertData.source || "WebSocket",
      sourceIp: alertData.sourceIp || alertData.source_ip || "",
      destinationIp: alertData.destinationIp || alertData.destination_ip || "",
      timestamp: alertData.timestamp || new Date().toISOString(),
      rawLog: alertData.rawLog || alertData.raw_log || "",
      tags: alertData.tags || [],
      aiScore: alertData.aiScore ?? alertData.ai_score,
      aiSummary: alertData.aiSummary ?? alertData.ai_summary,
      aiRecommendation: alertData.aiRecommendation ?? alertData.ai_recommendation,
      relatedAlerts: alertData.relatedAlerts ?? alertData.related_alerts,
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
  }
}