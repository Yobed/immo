'use client'
import { authFetch } from '@/lib/auth-fetch'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotificationItem } from './NotificationItem'
import type { Notification } from './NotificationItem'

interface NotificationCenterProps {
  initialNotifications: Notification[]
  userId: string
}

export function NotificationCenter({ initialNotifications, userId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  useEffect(() => {
    const supabase = createClient()

    // Supabase Realtime — nouvelles notifications en temps réel
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new as unknown as Notification, ...prev])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const handleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, lu: true } : n)
    )
  }

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.lu)
    await Promise.all(
      unread.map((n) =>
        fetch(`/api/notifications/${n.id}`, { method: 'PATCH' })
      )
    )
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })))
  }

  const unreadCount = notifications.filter((n) => !n.lu).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-[var(--text)]">Notifications</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="font-sans text-sm text-primary hover:underline"
          >
            Tout marquer lu ({unreadCount})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-card shadow-card p-12 text-center">
          <p className="font-sans text-muted text-sm">Aucune notification</p>
        </div>
      ) : (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={handleRead}
            />
          ))}
        </div>
      )}
    </div>
  )
}
