import { useEffect, useRef, useCallback, useState } from "react"
import { useAuthStore } from "@/store/auth-store"

interface UseWebSocketOptions {
  url?: string
  onMessage?: (data: any) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  autoReconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  enabled?: boolean
}

interface UseWebSocketReturn {
  isConnected: boolean
  lastMessage: any
  sendMessage: (data: any) => void
  connect: () => void
  disconnect: () => void
}

function getWebSocketBaseUrl(): string {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
  if (apiBase) {
    const url = new URL(apiBase)
    return `${url.protocol === "https:" ? "wss" : "ws"}://${url.host}`
  }
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws"
    return `${protocol}://${window.location.hostname}:8000`
  }
  return "ws://127.0.0.1:8000"
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url,
    onMessage,
    onOpen,
    onClose,
    onError,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000,
    enabled = true,
  } = options

  const token = useAuthStore((s) => s.token)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCountRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const manualCloseRef = useRef(false)

  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current)
      heartbeatTimerRef.current = null
    }
  }, [])

  const startHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current)
    }
    heartbeatTimerRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }))
      }
    }, heartbeatInterval)
  }, [heartbeatInterval])

  const disconnect = useCallback(() => {
    manualCloseRef.current = true
    clearTimers()
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [clearTimers])

  const connect = useCallback(() => {
    if (typeof window === "undefined") return
    if (!enabled) return
    if (!token) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    manualCloseRef.current = false

    const baseUrl = url || `${getWebSocketBaseUrl()}/ws/notifications`
    const separator = baseUrl.includes("?") ? "&" : "?"
    const wsUrl = `${baseUrl}${separator}token=${encodeURIComponent(token)}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        reconnectCountRef.current = 0
        startHeartbeat()
        onOpen?.()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "pong") return
          setLastMessage(data)
          onMessage?.(data)
        } catch {
          setLastMessage(event.data)
          onMessage?.(event.data)
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current)
          heartbeatTimerRef.current = null
        }
        onClose?.()

        if (!manualCloseRef.current && autoReconnect && reconnectCountRef.current < maxReconnectAttempts) {
          reconnectCountRef.current += 1
          const delay = reconnectInterval * Math.pow(1.5, reconnectCountRef.current - 1)
          reconnectTimerRef.current = setTimeout(() => {
            connect()
          }, Math.min(delay, 30000))
        }
      }

      ws.onerror = (error) => {
        onError?.(error)
      }
    } catch {
      if (autoReconnect && reconnectCountRef.current < maxReconnectAttempts) {
        reconnectCountRef.current += 1
        reconnectTimerRef.current = setTimeout(() => {
          connect()
        }, reconnectInterval)
      }
    }
  }, [url, token, enabled, autoReconnect, reconnectInterval, maxReconnectAttempts, onOpen, onMessage, onClose, onError, startHeartbeat])

  const sendMessage = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const payload = typeof data === "string" ? data : JSON.stringify(data)
      wsRef.current.send(payload)
    }
  }, [])

  useEffect(() => {
    if (enabled && token) {
      connect()
    }
    return () => {
      disconnect()
    }
  }, [enabled, token, connect, disconnect])

  return { isConnected, lastMessage, sendMessage, connect, disconnect }
}
