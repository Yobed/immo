'use client'
import { useState, useRef, useEffect } from 'react'
import { ChatMessage }                  from './ChatMessage'

type Message = { role: 'user' | 'assistant'; content: string }

const PLACEHOLDER_SUGGESTIONS = [
  'Cherche un F3 a Cocody entre 300 000 et 400 000 FCFA',
  'Quels sont les prix a Yopougon ?',
  'Je cherche une villa meublee pour 1 mois',
]

export function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const userText = (text ?? input).trim()
    if (!userText || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    // Ajouter un message assistant vide pour le streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: newMessages }),
      })

      if (!res.body) throw new Error('Pas de stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        // Mettre a jour le dernier message assistant avec le texte accumule
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantText }
          return updated
        })
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Desolee, une erreur est survenue. Veuillez reessayer.',
        }
        return updated
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface-card rounded-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
          IA
        </div>
        <div>
          <p className="text-white font-medium text-sm">Assistant Immo CI</p>
          <p className="text-white/70 text-xs">Expert immobilier Cote d&apos;Ivoire</p>
        </div>
      </div>

      {/* Zone messages */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-center text-muted text-sm py-4">
              Bonjour ! Je suis votre assistant immobilier CI. Comment puis-je vous aider ?
            </p>
            <div className="space-y-2">
              {PLACEHOLDER_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="w-full text-left text-sm bg-primary-light text-primary px-3 py-2 rounded-btn hover:bg-primary hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))
        )}
        {loading && messages[messages.length - 1]?.role === 'assistant' &&
          messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start mb-3">
            <div className="bg-surface-card border border-[var(--border)] px-4 py-2 rounded-2xl rounded-tl-sm text-muted text-sm">
              En cours de reflexion...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Posez votre question immobiliere..."
          disabled={loading}
          className="flex-1 border border-[var(--border)] rounded-btn px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="bg-primary text-white px-4 py-2 rounded-btn text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Envoyer
        </button>
      </div>
    </div>
  )
}
