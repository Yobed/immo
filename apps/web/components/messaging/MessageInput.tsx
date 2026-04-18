'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'

interface MessageInputProps {
  conversationId: string
  expediteurId: string
}

export function MessageInput({ conversationId, expediteurId }: MessageInputProps) {
  const [contenu, setContenu] = useState('')
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  const handleSend = async () => {
    const trimmed = contenu.trim()
    if (!trimmed || sending) return

    setSending(true)
    const { error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, expediteur_id: expediteurId, contenu: trimmed })

    if (!error) {
      setContenu('')
      inputRef.current?.focus()
    }
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter ou Cmd+Enter pour envoyer
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex gap-2 p-4 border-t border-[var(--border)] bg-[var(--surface-card)]">
      <textarea
        ref={inputRef}
        value={contenu}
        onChange={(e) => setContenu(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Votre message... (Ctrl+Entrée pour envoyer)"
        rows={2}
        className="flex-1 rounded-btn border border-[var(--border)] px-3 py-2 text-sm font-sans resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <Button
        onClick={handleSend}
        loading={sending}
        disabled={!contenu.trim()}
        className="self-end"
      >
        Envoyer
      </Button>
    </div>
  )
}
