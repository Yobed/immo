'use client'
import { authFetch } from '@/lib/auth-fetch'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotificationItem } from './NotificationItem'
import type { Notification } from './NotificationItem'

interface NotificationBellProps {
  userId: string
  initialUnreadCount: number
}

export function NotificationBell({ userId, initialUnreadCount }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loaded, setLoaded] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Realtime — mise à jour du badge non-lu
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`notif-bell:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setUnreadCount((c) => c + 1)
        // Si dropdown ouvert, ajouter la notif en tête
        setNotifications((prev) => {
          const newNotif = payload.new as unknown as Notification
          return [newNotif, ...prev].slice(0, 5)
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Fermeture au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Chargement lazy des notifications (au premier clic uniquement)
  const handleToggle = async () => {
    const nextOpen = !open
    setOpen(nextOpen)

    if (nextOpen && !loaded) {
      const res = await authFetch('/api/notifications?limit=5')
      if (res.ok) {
        const json = await res.json() as { notifications: Notification[] }
        setNotifications(json.notifications.slice(0, 5))
      }
      setLoaded(true)
    }
  }

  const handleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, lu: true } : n)
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative p-2 rounded-btn hover:bg-[var(--surface)] transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--surface-card)] rounded-card shadow-card border border-[var(--border)] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <span className="font-sans text-sm font-semibold text-[var(--text)]">Notifications</span>
            <a
              href="/notifications"
              className="font-sans text-xs text-primary hover:underline"
            >
              Voir tout
            </a>
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center font-sans text-sm text-muted">
              {loaded ? 'Aucune notification' : 'Chargement...'}
            </p>
          ) : (
            <div>
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
      )}
    </div>
  )
}
