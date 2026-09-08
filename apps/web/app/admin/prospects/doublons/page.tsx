import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Copy, ArrowLeft, ExternalLink, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CrmActionForm } from '@/components/admin/CrmActionForm'
import { mergeProspectsAction } from './actions'

export const dynamic = 'force-dynamic'

type Prospect = { id: string; nom: string | null; statut: string; last_seen?: string | null; assigned_to?: string | null }
type DuplicateGroup = { phone_normalized: string; duplicate_count: number; prospect_ids: string[]; last_seen: string }

export default async function ProspectDuplicatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/prospects/doublons')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') notFound()

  const admin = createAdminClient()
  const { data, error } = await (admin as any).from('v_prospect_duplicates')
    .select('phone_normalized, duplicate_count, prospect_ids, last_seen')
    .order('last_seen', { ascending: false })
  const groups = (data ?? []) as DuplicateGroup[]
  const ids = groups.flatMap(group => group.prospect_ids ?? [])
  const prospects: Record<string, Prospect> = {}
  if (ids.length) {
    const { data: rows } = await (admin as any).from('prospects')
      .select('id, nom, statut, last_seen, assigned_to').in('id', ids)
    for (const row of (rows ?? []) as Prospect[]) prospects[row.id] = row
  }

  return <main className="min-h-screen bg-[var(--surface-hover)]">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/admin/performance" className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-5">
        <ArrowLeft className="w-4 h-4" /> Retour à Performance
      </Link>
      <header className="flex items-start gap-3 mb-7">
        <Copy className="w-6 h-6 text-[var(--accent-luxury)] mt-1" />
        <div><h1 className="text-2xl font-black text-[var(--text)]">Doublons potentiels</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Choisissez la fiche à conserver. La fusion déplace les demandes en une seule transaction et garde les deux historiques.</p>
        </div>
      </header>
      {error ? <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
        Impossible de charger les doublons. Vérifiez que la migration CRM est appliquée.
      </div> : groups.length === 0 ? <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-10 text-center text-sm text-[var(--text-muted)]">Aucun doublon détecté.</div> :
      <div className="space-y-5">{groups.map(group => <DuplicateGroupCard key={group.phone_normalized} group={group} prospects={prospects} />)}</div>}
    </div>
  </main>
}

function DuplicateGroupCard({ group, prospects }: { group: DuplicateGroup; prospects: Record<string, Prospect> }) {
  const defaultPrimary = group.prospect_ids[0]
  const defaultDuplicate = group.prospect_ids[1]
  if (!defaultPrimary || !defaultDuplicate) return null
  return <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5">
    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
      <div><p className="font-mono font-bold text-[var(--text)]">+{group.phone_normalized}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">{group.duplicate_count} fiches · dernière activité {new Date(group.last_seen).toLocaleDateString('fr-FR')}</p>
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-3 py-1"><AlertTriangle className="w-3.5 h-3.5" /> Vérification humaine requise</span>
    </div>
    <div className="grid sm:grid-cols-2 gap-2 mb-4">{group.prospect_ids.map(id => <Link key={id} href={`/admin/prospects/${id}`} className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-3 hover:border-[var(--accent-luxury)]">
      <span><span className="block text-sm font-bold text-[var(--text)]">{prospects[id]?.nom || 'Prospect sans nom'}</span>
        <span className="block text-xs text-[var(--text-muted)]">Statut actuel : {prospects[id]?.statut || 'Non renseigné'}</span></span><ExternalLink className="w-4 h-4 text-[var(--text-muted)]" />
    </Link>)}</div>
    <CrmActionForm action={mergeProspectsAction} className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-4">
      <input type="hidden" name="request_id" value={crypto.randomUUID()} />
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm font-semibold text-[var(--text)]">Fiche principale à conserver
          <select name="primary_id" defaultValue={defaultPrimary} className="mt-1 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-card)] px-3 text-sm">
            {group.prospect_ids.map(id => <option key={id} value={id}>{prospects[id]?.nom || 'Prospect sans nom'} — {prospects[id]?.statut}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-[var(--text)]">Fiche secondaire à archiver
          <select name="duplicate_id" defaultValue={defaultDuplicate} className="mt-1 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-card)] px-3 text-sm">
            {group.prospect_ids.map(id => <option key={id} value={id}>{prospects[id]?.nom || 'Prospect sans nom'} — {prospects[id]?.statut}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">Les champs différents restent consultables sur la fiche secondaire. La fusion n’est pas comptée comme une perte commerciale.</p>
      <button type="submit" className="mt-3 min-h-11 rounded-xl bg-[var(--text)] px-4 text-sm font-bold text-[var(--surface-card)]">Vérifier et fusionner ces fiches</button>
    </CrmActionForm>
  </section>
}
