import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Copy, ArrowLeft, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mergeProspectsAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function ProspectDuplicatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/prospects/doublons')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') notFound()
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: groups } = await (admin as any).from('v_prospect_duplicates').select('phone_normalized, duplicate_count, prospect_ids, last_seen').order('last_seen', { ascending: false })
  const ids = (groups ?? []).flatMap((g: { prospect_ids: string[] }) => g.prospect_ids ?? [])
  const names: Record<string, { nom: string | null; statut: string }> = {}
  if (ids.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any).from('prospects').select('id, nom, statut').in('id', ids)
    for (const row of (data ?? []) as { id: string; nom: string | null; statut: string }[]) names[row.id] = row
  }

  return <main className="min-h-screen bg-[var(--surface-hover)]"><div className="max-w-5xl mx-auto px-4 sm:px-6 py-8"><Link href="/admin/performance" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-5"><ArrowLeft className="w-4 h-4" /> Retour à Performance</Link><header className="flex items-start gap-3 mb-7"><Copy className="w-6 h-6 text-[var(--accent-luxury)] mt-1" /><div><h1 className="text-2xl font-black text-[var(--text)]">Doublons potentiels</h1><p className="text-sm text-[var(--text-muted)] mt-1">Vérifiez les fiches partageant le même numéro. La fusion conserve l’historique sur la fiche principale.</p></div></header>{(groups ?? []).length === 0 ? <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-10 text-center text-sm text-[var(--text-muted)]">Aucun doublon détecté.</div> : <div className="space-y-4">{(groups ?? []).map((group: { phone_normalized: string; duplicate_count: number; prospect_ids: string[]; last_seen: string }) => { const [primaryId, ...duplicates] = group.prospect_ids; return <section key={group.phone_normalized} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5"><div className="flex flex-wrap items-center justify-between gap-2 mb-4"><div><p className="font-mono font-bold text-[var(--text)]">+{group.phone_normalized}</p><p className="text-xs text-[var(--text-muted)] mt-1">{group.duplicate_count} fiches · dernière activité {new Date(group.last_seen).toLocaleDateString('fr-FR')}</p></div><span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">À vérifier</span></div><div className="grid sm:grid-cols-2 gap-2">{group.prospect_ids.map((id, index) => <Link key={id} href={`/admin/prospects/${id}`} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 hover:border-[var(--accent-luxury)] ${index === 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-[var(--border)] bg-[var(--surface-hover)]'}`}><span><span className="block text-sm font-bold text-[var(--text)]">{names[id]?.nom || 'Prospect sans nom'} {index === 0 && <span className="text-[10px] text-emerald-700">· PRINCIPALE</span>}</span><span className="block text-[11px] text-[var(--text-muted)]">Statut : {names[id]?.statut || '—'}</span></span><ExternalLink className="w-4 h-4 text-[var(--text-muted)]" /></Link>)}</div>{duplicates.length > 0 && <form action={mergeProspectsAction} className="mt-4 flex flex-wrap items-center gap-3"><input type="hidden" name="primary_id" value={primaryId} /><select name="duplicate_id" className="min-h-[40px] rounded-xl border border-[var(--border)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text)]" defaultValue={duplicates[0]}>{duplicates.map((id) => <option key={id} value={id}>{names[id]?.nom || 'Prospect sans nom'}</option>)}</select><button type="submit" className="min-h-[40px] rounded-xl bg-[var(--text)] px-4 text-sm font-bold text-[var(--surface-card)]">Fusionner dans la fiche principale</button><span className="text-[11px] text-[var(--text-muted)]">La fiche secondaire reste archivée pour traçabilité.</span></form>}</section>})}</div>}</div></main>
}
