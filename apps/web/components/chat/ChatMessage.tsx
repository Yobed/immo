'use client'
import { Sparkles, User } from 'lucide-react'

interface Props {
  role:    'user' | 'assistant'
  content: string
}

export function ChatMessage({ role, content }: Props) {
  const isUser = role === 'user'
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-8 group`}>
      <div className={`flex items-center gap-3 mb-2 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
          isUser 
            ? 'bg-white/5 border-white/10' 
            : 'bg-[var(--accent-luxury)]/20 border-[var(--accent-luxury)]/30'
        }`}>
          {isUser ? <User className="w-3.5 h-3.5 text-white/40" /> : <Sparkles className="w-3.5 h-3.5 text-[var(--accent-luxury)]" />}
        </div>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">
          {isUser ? 'Client Privilégié' : 'Conciergerie Élite'}
        </span>
      </div>
      
      <div
        className={`max-w-[90%] px-6 py-4 rounded-[1.5rem] text-sm leading-relaxed transition-all duration-500 ${
          isUser
            ? 'bg-white border border-white/10 text-[var(--midnight)] rounded-tr-sm shadow-xl'
            : 'bg-white/[0.03] border border-white/5 text-white/90 rounded-tl-sm backdrop-blur-md'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
