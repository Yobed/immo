'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageInput } from './MessageInput'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Message {
  id: string
  conversation_id: string
  expediteur_id: string
  contenu: string
  created_at: string
  lu: boolean
}

interface MessageThreadProps {
  conversationId: string
  currentUserId: string
}

export function MessageThread({ conversationId, currentUserId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    // Charger les messages existants
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as unknown as Message[])
        setLoading(false)
      })

    // S'abonner aux nouveaux messages (Supabase Realtime)
    // PRÉREQUIS: Realtime activé sur la table messages dans Supabase Dashboard > Database > Replication
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages((prev) => {
          // Éviter les doublons si le message local a déjà été ajouté optimistiquement
          if (prev.some((m) => m.id === (payload.new as unknown as Message).id)) return prev
          return [...prev, payload.new as unknown as Message]
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  // Scroll automatique au dernier message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted font-sans text-sm">Chargement des messages...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Zone messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-muted font-sans text-sm py-8">
            Aucun message. Commencez la conversation !
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.expediteur_id === currentUserId
            return (
              <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[75%] px-4 py-2.5 rounded-card text-sm font-sans',
                    isOwn
                      ? 'bg-primary text-white rounded-br-btn'
                      : 'bg-white border border-[var(--border)] text-[var(--text)] rounded-bl-btn'
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.contenu}</p>
                  <p className={cn('text-xs mt-1', isOwn ? 'text-white/60' : 'text-muted')}>
                    {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Zone saisie */}
      <MessageInput conversationId={conversationId} expediteurId={currentUserId} />
    </div>
  )
}
