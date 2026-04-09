import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ConversationList } from '@/components/messaging/ConversationList'
import { MessageThread } from '@/components/messaging/MessageThread'

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { conv?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Charger les conversations de l'utilisateur
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, bien_id, participant_1, participant_2, updated_at, biens(titre)')
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order('updated_at', { ascending: false })

  const activeConvId = searchParams.conv ?? conversations?.[0]?.id

  return (
    <main className="bg-surface min-h-screen">
      <div className="max-w-5xl mx-auto h-screen flex">
        {/* Sidebar conversations */}
        <aside className="w-72 flex-shrink-0 border-r border-[var(--border)] bg-white flex flex-col">
          <div className="p-4 border-b border-[var(--border)]">
            <h1 className="font-display text-xl text-[var(--text)]">Messages</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              conversations={(conversations ?? []) as any[]}
              activeId={activeConvId}
              currentUserId={user.id}
            />
          </div>
        </aside>

        {/* Thread actif */}
        <div className="flex-1 flex flex-col bg-[var(--surface)]">
          {activeConvId ? (
            <MessageThread conversationId={activeConvId} currentUserId={user.id} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted font-sans">Sélectionnez une conversation</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
