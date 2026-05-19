"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useWebSocket } from "./useWebSocket"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  timestamp: string
  read: boolean
  [key: string]: unknown
}

interface NotificationPayload {
  id?: string
  type?: string
  title?: string
  message?: string
  description?: string
  timestamp?: string
  [key: string]: unknown
}

interface UseNotificationsReturn {
  unreadCount: number
  notifications: Notification[]
  markAsRead: (id?: string) => void
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notifsRef = useRef<Notification[]>([])
  const unreadRef = useRef(0)
  const originalTitleRef = useRef<string>("")

  useEffect(() => {
    originalTitleRef.current = document.title
    return () => {
      document.title = originalTitleRef.current
    }
  }, [])

  const updateDocumentTitle = useCallback((count: number) => {
    if (count > 0) {
      document.title = `(${count}) ${originalTitleRef.current}`
    } else {
      document.title = originalTitleRef.current
    }
  }, [])

  const showBrowserNotification = useCallback((notif: Notification) => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission === "granted") {
      new Notification(notif.title, {
        body: notif.message,
        icon: "/favicon.ico",
        tag: notif.id,
      })
    }
  }, [])

  const requestNotificationPermission = useCallback(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    requestNotificationPermission()
  }, [requestNotificationPermission])

  const handleNotification = useCallback((notifData: unknown) => {
    const payload = notifData as NotificationPayload
    const enriched: Notification = {
      id: payload.id || `notif-${Date.now()}`,
      type: payload.type || "info",
      title: payload.title || "Notification",
      message: payload.message || payload.description || "",
      timestamp: payload.timestamp || new Date().toISOString(),
      read: false,
      ...payload,
    }

    notifsRef.current = [enriched, ...notifsRef.current].slice(0, 50)
    unreadRef.current += 1

    setNotifications([...notifsRef.current])
    setUnreadCount(unreadRef.current)
    updateDocumentTitle(unreadRef.current)
    showBrowserNotification(enriched)
  }, [updateDocumentTitle, showBrowserNotification])

  useWebSocket({
    messageTypes: {
      notification: handleNotification,
    },
  })

  const markAsRead = useCallback((id?: string) => {
    if (id) {
      notifsRef.current = notifsRef.current.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
      unreadRef.current = notifsRef.current.filter((n) => !n.read).length
    } else {
      notifsRef.current = notifsRef.current.map((n) => ({ ...n, read: true }))
      unreadRef.current = 0
    }
    setNotifications([...notifsRef.current])
    setUnreadCount(unreadRef.current)
    updateDocumentTitle(unreadRef.current)
  }, [updateDocumentTitle])

  return { unreadCount, notifications, markAsRead }
}
