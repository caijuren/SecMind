"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useAuthStore } from "@/store/auth-store"

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting"

interface UseWebSocketOptions {
  onMessage?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  messageTypes?: Record<string, (data: any) => void>
  url?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  enabled?: boolean
}

interface UseWebSocketReturn {
  send: (data: any) => void
  connectionStatus: ConnectionStatus
  lastMessage: any
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
    onConnect,
    onDisconnect,
    messageTypes,
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

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected")
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
    setConnectionStatus("disconnected")
  }, [clearTimers])

  const connect = useCallback(() => {
    if (typeof window === "undefined") return
    if (!enabled) return
    if (!token) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    manualCloseRef.current = false

    if (reconnectCountRef.current > 0) {
      setConnectionStatus("reconnecting")
    } else {
      setConnectionStatus("connecting")
    }

    const baseUrl = url || `${getWebSocketBaseUrl()}/ws/notifications`
    const separator = baseUrl.includes("?") ? "&" : "?"
    const wsUrl = `${baseUrl}${separator}token=${encodeURIComponent(token)}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setConnectionStatus("connected")
        reconnectCountRef.current = 0
        startHeartbeat()
        onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "pong") return
          setLastMessage(data)

          if (messageTypes && data.type && messageTypes[data.type]) {
            messageTypes[data.type](data.data || data)
          } else {
            onMessage?.(data)
          }
        } catch {
          setLastMessage(event.data)
          onMessage?.(event.data)
        }
      }

      ws.onclose = () => {
        setConnectionStatus("disconnected")
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current)
          heartbeatTimerRef.current = null
        }
        onDisconnect?.()

        if (!manualCloseRef.current && reconnectCountRef.current < maxReconnectAttempts) {
          reconnectCountRef.current += 1
          const delay = reconnectInterval * Math.pow(1.5, reconnectCountRef.current - 1)
          setConnectionStatus("reconnecting")
          reconnectTimerRef.current = setTimeout(() => {
            connect()
          }, Math.min(delay, 30000))
        }
      }

      ws.onerror = () => {
        setConnectionStatus("disconnected")
      }
    } catch {
      setConnectionStatus("disconnected")
      if (!manualCloseRef.current && reconnectCountRef.current < maxReconnectAttempts) {
        reconnectCountRef.current += 1
        setConnectionStatus("reconnecting")
        reconnectTimerRef.current = setTimeout(() => {
          connect()
        }, reconnectInterval)
      }
    }
  }, [url, token, enabled, reconnectInterval, maxReconnectAttempts, onConnect, onMessage, onDisconnect, messageTypes, startHeartbeat])

  const send = useCallback((data: any) => {
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

  return { send, connectionStatus, lastMessage }
}