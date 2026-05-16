import { useState, useCallback, useRef } from "react"
import { useWebSocket } from "./use-websocket"
import { useAuthStore } from "@/store/auth-store"

interface RealtimeAlert {
  id: string
  type: string
  title: string
  description?: string
  riskLevel: string
  source: string
  timestamp: string
  [key: string]: any
}

interface RealtimeActionUpdate {
  id: string | number
  status: string
  result?: string
  completedAt?: string
  [key: string]: any
}

interface RealtimeNotification {
  id: string
  type: string
  title: string
  message: string
  timestamp: string
  read: boolean
  [key: string]: any
}

export function useRealtimeAlerts() {
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([])
  const [newAlertCount, setNewAlertCount] = useState(0)
  const alertsRef = useRef<RealtimeAlert[]>([])
  const countRef = useRef(0)

  const handleNewAlert = useCallback((alert: RealtimeAlert) => {
    alertsRef.current = [alert, ...alertsRef.current].slice(0, 100)
    countRef.current += 1
    setAlerts([...alertsRef.current])
    setNewAlertCount(countRef.current)
  }, [])

  const { isConnected, lastMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === "alert" || data.type === "new_alert") {
        handleNewAlert(data.data || data)
      }
    },
  })

  const clearNewAlerts = useCallback(() => {
    countRef.current = 0
    setNewAlertCount(0)
  }, [])

  return { alerts, newAlertCount, clearNewAlerts, isConnected, lastMessage }
}

export function useRealtimeActions() {
  const [actions, setActions] = useState<RealtimeActionUpdate[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const actionsMapRef = useRef<Map<string | number, RealtimeActionUpdate>>(new Map())

  const handleActionUpdate = useCallback((update: RealtimeActionUpdate) => {
    actionsMapRef.current.set(update.id, update)
    setActions(Array.from(actionsMapRef.current.values()))
    if (update.status === "pending" || update.status === "awaiting_approval") {
      setPendingCount((prev) => prev + 1)
    }
  }, [])

  const { isConnected, lastMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === "action_update" || data.type === "action_status") {
        handleActionUpdate(data.data || data)
      }
    },
  })

  return { actions, pendingCount, isConnected, lastMessage }
}

export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notifsRef = useRef<RealtimeNotification[]>([])
  const unreadRef = useRef(0)

  const handleNotification = useCallback((notif: RealtimeNotification) => {
    const enriched = { ...notif, read: false }
    notifsRef.current = [enriched, ...notifsRef.current].slice(0, 50)
    unreadRef.current += 1
    setNotifications([...notifsRef.current])
    setUnreadCount(unreadRef.current)
  }, [])

  const { isConnected } = useWebSocket({
    onMessage: (data) => {
      if (data.type === "notification" || data.type === "system") {
        if (data.type === "system") return
        handleNotification(data.data || data)
      }
    },
  })

  const markRead = useCallback((id?: string) => {
    if (id) {
      notifsRef.current = notifsRef.current.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    } else {
      notifsRef.current = notifsRef.current.map((n) => ({ ...n, read: true }))
      unreadRef.current = 0
    }
    setNotifications([...notifsRef.current])
    setUnreadCount(unreadRef.current)
  }, [])

  return { notifications, unreadCount, markRead, isConnected }
}

export function useRealtimeConnection() {
  const token = useAuthStore((s) => s.token)
  const { isConnected } = useWebSocket({
    enabled: !!token,
  })
  return { isConnected }
}
