import { ChatBot } from '@/components/chat/ChatBot'

export const metadata = {
  title:       'Assistant IA — Immo CI',
  description: 'Votre assistant immobilier expert en Cote d\'Ivoire. Trouvez le bien ideal a Abidjan.',
}

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col p-4 py-8">
        <h1 className="font-display text-2xl text-primary mb-2 text-center">
          Assistant Immobilier CI
        </h1>
        <p className="text-muted text-sm text-center mb-6">
          Posez vos questions sur les biens a Abidjan et en Cote d&apos;Ivoire
        </p>
        <div className="flex-1" style={{ minHeight: '500px' }}>
          <ChatBot />
        </div>
      </div>
    </div>
  )
}
