'use client'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Conversation {
  id: string
  bien_id: string | null
  biens?: { titre: string } | null
  participant_1: string
  participant_2: string
  last_message?: string | null
  updated_at: string
}

interface ConversationListProps {
  conversations: Conversation[]
  activeId?: string
  currentUserId: string
}

export function ConversationList({ conversations, activeId, currentUserId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted font-sans text-sm">Aucune conversation</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[var(--border)]">
      {conversations.map((conv) => {
        const isActive = conv.id === activeId
        const bienTitre = conv.biens?.titre ?? 'Bien supprimé'

        return (
          <Link
            key={conv.id}
            href={`/messages?conv=${conv.id}`}
            className={cn(
              'flex flex-col gap-1 p-4 hover:bg-[var(--surface)] transition-colors',
              isActive && 'bg-primary-light border-l-2 border-primary'
            )}
          >
            <p className="font-sans font-medium text-sm text-[var(--text)] line-clamp-1">{bienTitre}</p>
            {conv.last_message && (
              <p className="text-xs text-muted line-clamp-1">{conv.last_message}</p>
            )}
            <p className="text-xs text-muted/60">
              {format(new Date(conv.updated_at), 'd MMM, HH:mm', { locale: fr })}
            </p>
          </Link>
        )
      })}
    </div>
  )
}
