import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import type { Notification } from '@/components/notifications/NotificationItem'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: notifications } = await (supabase as any)
    .from('notifications')
    .select('id, type, titre, contenu, lu, lien_type, lien_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <main className="bg-surface min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4">
        <NotificationCenter
          initialNotifications={(notifications ?? []) as Notification[]}
          userId={user.id}
        />
      </div>
    </main>
  )
}
