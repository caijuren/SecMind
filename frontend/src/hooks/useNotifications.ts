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
  [key: string]: any
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

  const handleNotification = useCallback((notifData: any) => {
    const enriched: Notification = {
      id: notifData.id || `notif-${Date.now()}`,
      type: notifData.type || "info",
      title: notifData.title || "Notification",
      message: notifData.message || notifData.description || "",
      timestamp: notifData.timestamp || new Date().toISOString(),
      read: false,
      ...notifData,
    }

    notifsRef.current = [enriched, ...notifsRef.current].slice(0, 50)
    unreadRef.current += 1

    setNotifications([...notifsRef.current])
    setUnreadCount(unreadRef.current)
    updateDocumentTitle(unreadRef.current)
    showBrowserNotification(enriched)
  }, [updateDocumentTitle, showBrowserNotification])

  const { connectionStatus } = useWebSocket({
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