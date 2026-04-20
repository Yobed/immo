'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatMessage } from './ChatMessage'
import { Sparkles, Send, X, MessageCircle, Mic, Phone, ShieldCheck } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

const PLACEHOLDER_SUGGESTIONS = [
  'Quels sont les atouts de ce bien ?',
  'Services de conciergerie disponibles ?',
  'Je souhaite planifier une visite VIP',
]

interface ChatBotProps {
  context?: string
  onClose?: () => void
  isFloating?: boolean
}

export function ChatBot({ context, onClose, isFloating = false }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
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

    // AI message placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context }),
      })

      if (!res.body) throw new Error('No stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
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
          content: 'Excellence, une légère perturbation est survenue. Veuillez m\'excuser et réitérer votre demande.',
        }
        return updated
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex flex-col h-full bg-[var(--midnight)] border border-white/10 ${isFloating ? 'rounded-[2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]' : 'rounded-none'} overflow-hidden backdrop-blur-3xl relative`}>
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-luxury)] blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-8 py-6 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--accent-luxury)] bg-[var(--midnight-muted)] p-1 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[var(--accent-luxury)]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[var(--midnight)] shadow-lg" />
          </div>
          <div>
            <h3 className="text-[var(--text)] font-display font-bold text-base tracking-tight">Sapphire Intelligence</h3>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-[var(--text)]/40">Majordome Digital & Concierge</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href="https://wa.me/2250102030405" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 hover:bg-green-500/20 text-green-500 rounded-full transition-all group relative"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="absolute -bottom-8 right-0 text-[8px] bg-green-500 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              WhatsApp VIP
            </span>
          </a>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-[var(--text)]/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-[var(--text)]/50" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 relative z-10 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center space-y-8 py-12">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4">
              <ShieldCheck className="w-10 h-10 text-[var(--accent-luxury)] opacity-50" />
            </div>
            <div>
              <p className="text-xl font-display font-light text-[var(--text)] mb-2 italic">
                Bienvenue dans votre résidence digitale, Excellence.
              </p>
              <p className="text-sm text-[var(--text)]/40 max-w-[280px] leading-relaxed mx-auto uppercase tracking-widest text-[10px] font-bold">
                Je suis Sapphire Intelligence. Comment puis-je sublimer votre recherche immobilière aujourd'hui ?
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full max-w-[320px]">
              {PLACEHOLDER_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="w-full text-center text-[10px] uppercase tracking-widest font-bold bg-[var(--text)]/5 border border-[var(--text)]/5 text-[var(--text)]/60 px-5 py-3 rounded-xl hover:bg-[var(--text)]/[0.08] hover:text-[var(--text)] hover:border-[var(--text)]/20 transition-all duration-500"
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
          <div className="flex justify-start items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[var(--accent-luxury)] rounded-full animate-pulse" />
             </div>
             <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-[var(--text)]/20">Analyse en cours...</p>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="p-6 relative z-10 bg-white/[0.02] border-t border-white/5">
        <div className="flex gap-4 p-2 bg-[var(--midnight-muted)]/50 rounded-2xl border border-white/5 focus-within:border-[var(--accent-luxury)]/30 transition-all duration-500">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Échangez avec votre conseiller..."
            disabled={loading}
            className="flex-1 bg-transparent px-4 py-2 text-sm text-[var(--text)] placeholder-[var(--text)]/20 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-[var(--accent-luxury)] text-[var(--midnight)] flex items-center justify-center disabled:opacity-20 hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
         <div className="flex justify-center gap-8 mt-4">
            <Mic className="w-3.5 h-3.5 text-[var(--text)]/20 cursor-not-allowed" />
            <a 
              href="https://wa.me/2250102030405" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 opacity-30 hover:opacity-100 transition-all group"
            >
              <Phone className="w-3.5 h-3.5 text-green-500" />
              <span className="text-[10px] text-[var(--text)]/50 group-hover:text-[var(--text)] uppercase tracking-tighter transition-colors">Contact Direct</span>
            </a>
         </div>
      </div>
    </div>
  )
}
