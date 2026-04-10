import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ConversationList } from '@/components/messaging/ConversationList'
import { MessageThread } from '@/components/messaging/MessageThread'
import Link from 'next/link'

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }> | { conv?: string }
}) {
  const params = typeof (searchParams as any).then === 'function'
    ? await (searchParams as Promise<{ conv?: string }>)
    : (searchParams as { conv?: string })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, bien_id, participant_1, participant_2, updated_at, biens(titre)')
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order('updated_at', { ascending: false })

  const activeConvId = params.conv ?? undefined
  // On desktop auto-select first conversation if none active
  const desktopConvId = activeConvId ?? conversations?.[0]?.id

  return (
    <main className="bg-surface min-h-screen">
      <div className="max-w-5xl mx-auto" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="flex h-full">

          {/* Sidebar — full screen on mobile when no conv selected, hidden on mobile when conv active */}
          <aside className={`
            ${activeConvId ? 'hidden lg:flex' : 'flex'}
            w-full lg:w-72 lg:flex-shrink-0
            flex-col border-r border-[var(--border)] bg-white
          `}>
            <div className="p-4 border-b border-[var(--border)]">
              <h1 className="font-display text-xl text-[var(--text)]">Messages</h1>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                conversations={(conversations ?? []) as any[]}
                activeId={desktopConvId}
                currentUserId={user.id}
              />
            </div>
          </aside>

          {/* Thread — full screen on mobile when conv selected */}
          <div className={`
            ${activeConvId ? 'flex' : 'hidden lg:flex'}
            flex-1 flex-col bg-[var(--surface)]
          `}>
            {/* Mobile back button */}
            {activeConvId && (
              <div className="lg:hidden px-4 py-3 border-b border-[var(--border)] bg-white flex items-center gap-2">
                <Link href="/messages" className="flex items-center gap-1.5 text-sm font-sans text-muted hover:text-primary transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M19 12H5M5 12l7 7M5 12l7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Retour aux messages
                </Link>
              </div>
            )}

            {desktopConvId ? (
              <MessageThread conversationId={activeConvId ?? desktopConvId} currentUserId={user.id} />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <p className="text-muted font-sans text-sm">Sélectionnez une conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
