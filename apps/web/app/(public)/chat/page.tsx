import { ChatBot } from '@/components/chat/ChatBot'

export const metadata = {
  title:       "BOGBE'S GROUPE — Conciergerie Live",
  description: 'Votre conseiller immobilier de luxe dédié. L\'excellence au service de votre projet en Côte d\'Ivoire.',
}

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-[var(--midnight)] flex flex-col pt-8 sm:pt-14 lg:pt-20 pb-16">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col px-6">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="w-12 h-[1px] bg-[var(--accent-luxury)]" />
            <h1 className="font-display text-3xl md:text-4xl text-off-white font-bold tracking-tight">
              BOGBE'S GROUPE
            </h1>
            <span className="w-12 h-[1px] bg-[var(--accent-luxury)]" />
          </div>
          <p className="text-off-white/40 text-xs font-bold uppercase tracking-[0.5em] font-display">
            Conciergerie Live & Conseiller Dédié
          </p>
        </div>
        
        <div className="flex-1 rounded-[2.5rem] overflow-hidden border border-off-white/10 shadow-2xl bg-surface-raised/50 backdrop-blur-xl" style={{ minHeight: '650px' }}>
          <ChatBot />
        </div>
      </div>
    </div>
  )
}
