'use client'
import { authFetch } from '@/lib/auth-fetch'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface Notification {
  id: string
  type: string
  titre: string
  contenu: string
  lu: boolean
  lien_type: string | null
  lien_id: string | null
  created_at: string
}

interface NotificationItemProps {
  notification: Notification
  onRead: (id: string) => void
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const handleClick = async () => {
    if (notification.lu) return

    await authFetch(`/api/notifications/${notification.id}`, {
      method: 'PATCH',
    })
    onRead(notification.id)
  }

  const dateRelative = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: fr,
  })

  return (
    <div
      onClick={handleClick}
      className={cn(
        'px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--surface-hover)] border-b border-[var(--border)] last:border-b-0',
        notification.lu ? 'bg-[var(--surface-card)]' : 'bg-blue-50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-sans text-sm text-[var(--text)] leading-snug',
            !notification.lu && 'font-semibold'
          )}>
            {notification.titre}
          </p>
          <p className="font-sans text-xs text-muted mt-0.5 leading-snug">
            {notification.contenu}
          </p>
        </div>
        <span className="font-sans text-xs text-muted whitespace-nowrap shrink-0">
          {dateRelative}
        </span>
      </div>
    </div>
  )
}
