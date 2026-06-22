"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useAuthStore } from "@/store/auth-store"

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting"

interface UseWebSocketOptions {
  onMessage?: (data: unknown) => void
  onConnect?: () => void
  onDisconnect?: () => void
  messageTypes?: Record<string, (data: unknown) => void>
  url?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  enabled?: boolean
}

interface UseWebSocketReturn {
  send: (data: unknown) => void
  connectionStatus: ConnectionStatus
  lastMessage: unknown
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
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000,
    enabled = true,
  } = options

  const token = useAuthStore((s) => s.token)

  // Use refs for callbacks to avoid re-renders and infinite loops
  const onMessageRef = useRef(options.onMessage)
  const onConnectRef = useRef(options.onConnect)
  const onDisconnectRef = useRef(options.onDisconnect)
  const messageTypesRef = useRef(options.messageTypes)

  useEffect(() => { onMessageRef.current = options.onMessage }, [options.onMessage])
  useEffect(() => { onConnectRef.current = options.onConnect }, [options.onConnect])
  useEffect(() => { onDisconnectRef.current = options.onDisconnect }, [options.onDisconnect])
  useEffect(() => { messageTypesRef.current = options.messageTypes }, [options.messageTypes])

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCountRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const manualCloseRef = useRef(false)
  const mountedRef = useRef(true)
  const connectFnRef = useRef<() => void>(() => {})

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected")
  const [lastMessage, setLastMessage] = useState<unknown>(null)

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
    if (mountedRef.current) {
      setConnectionStatus("disconnected")
    }
  }, [clearTimers])

  const connect = useCallback(() => {
    if (typeof window === "undefined") return
    if (!enabled) return
    if (!token) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    if (!mountedRef.current) return

    manualCloseRef.current = false

    if (reconnectCountRef.current > 0) {
      setConnectionStatus("reconnecting")
    } else {
      setConnectionStatus("connecting")
    }

    const wsUrl = url || `${getWebSocketBaseUrl()}/ws/notifications`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) return
        ws.send(JSON.stringify({ type: "auth", token }))
        setConnectionStatus("connected")
        reconnectCountRef.current = 0
        startHeartbeat()
        onConnectRef.current?.()
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        try {
          const data = JSON.parse(event.data)
          if (data.type === "pong") return
          setLastMessage(data)

          const types = messageTypesRef.current
          if (types && data.type && types[data.type]) {
            types[data.type](data.data || data)
          } else {
            onMessageRef.current?.(data)
          }
        } catch {
          setLastMessage(event.data)
          onMessageRef.current?.(event.data)
        }
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        setConnectionStatus("disconnected")
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current)
          heartbeatTimerRef.current = null
        }
        onDisconnectRef.current?.()

        if (!manualCloseRef.current && reconnectCountRef.current < maxReconnectAttempts) {
          reconnectCountRef.current += 1
          const delay = reconnectInterval * Math.pow(1.5, reconnectCountRef.current - 1)
          setConnectionStatus("reconnecting")
          reconnectTimerRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connectFnRef.current()
            }
          }, Math.min(delay, 30000))
        }
      }

      ws.onerror = () => {
        if (!mountedRef.current) return
        setConnectionStatus("disconnected")
      }
    } catch {
      if (!mountedRef.current) return
      setConnectionStatus("disconnected")
      if (!manualCloseRef.current && reconnectCountRef.current < maxReconnectAttempts) {
        reconnectCountRef.current += 1
        setConnectionStatus("reconnecting")
        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connectFnRef.current()
          }
        }, reconnectInterval)
      }
    }
  }, [url, token, enabled, reconnectInterval, maxReconnectAttempts, startHeartbeat])

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const payload = typeof data === "string" ? data : JSON.stringify(data)
      wsRef.current.send(payload)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    connectFnRef.current = connect
  }, [connect])

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
