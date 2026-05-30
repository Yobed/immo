import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// /admin → page d'entrée de la console : on dirige vers le suivi.
export default function AdminIndexPage() {
  redirect('/admin/suivi')
}
