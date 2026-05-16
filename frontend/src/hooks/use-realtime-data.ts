"use client"

import { useState, useCallback } from "react"
import { useWebSocket } from "./use-websocket"

interface RealtimeDataState {
  alerts: any[]
  signals: any[]
  actions: any[]
  stats: Record<string, any>
}

export function useRealtimeData() {
  const [data, setData] = useState<RealtimeDataState>({
    alerts: [],
    signals: [],
    actions: [],
    stats: {},
  })

  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case "new_alert":
        setData(prev => ({ ...prev, alerts: [message.data, ...prev.alerts.slice(0, 49)] }))
        break
      case "new_signal":
        setData(prev => ({ ...prev, signals: [message.data, ...prev.signals.slice(0, 49)] }))
        break
      case "action_update":
        setData(prev => ({
          ...prev,
          actions: prev.actions.map(a => a.id === message.data.id ? message.data : a),
        }))
        break
      case "new_action":
        setData(prev => ({ ...prev, actions: [message.data, ...prev.actions.slice(0, 49)] }))
        break
      case "stats_update":
        setData(prev => ({ ...prev, stats: { ...prev.stats, ...message.data } }))
        break
    }
  }, [])

  const { isConnected } = useWebSocket({ onMessage: handleMessage })

  return { data, isConnected }
}
