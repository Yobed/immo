import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Copy, ArrowLeft, ExternalLink, AlertTriangle, Users, ShieldCheck, RotateCcw, FileText, Download, CheckCircle2 } from 'lucide-react'
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
  if (profile?.role !== 'admin') redirect('/login?next=/admin/prospects/doublons')

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).from('v_prospect_duplicates')
    .select('phone_normalized, duplicate_count, prospect_ids, last_seen')
    .order('last_seen', { ascending: false })
  const groups = (data ?? []) as DuplicateGroup[]
  const ids = groups.flatMap((group) => group.prospect_ids ?? [])
  const prospects: Record<string, Prospect> = {}
  if (ids.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (admin as any).from('prospects')
      .select('id, nom, statut, last_seen, assigned_to').in('id', ids)
    for (const row of (rows ?? []) as Prospect[]) prospects[row.id] = row
  }

  return (
    <main className="min-h-screen bg-[var(--surface-hover)] pb-12">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        {/* Navigation secondaire CRM */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/admin/prospects"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pipeline CRM</span>
            </Link>
            <Link
              href="/admin/prospects/qualite"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Qualité CRM</span>
            </Link>
            <Link
              href="/admin/prospects/doublons"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent-luxury)] text-[#0b1530] shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Doublons</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="/api/admin/fiche-visite"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[38px] inline-flex items-center gap-2 px-3.5 py-1.5 bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <FileText className="w-4 h-4 text-[var(--accent-luxury)]" />
              <span>Fiche de visite (PDF)</span>
            </a>
            <a
              href="/api/admin/prospects/export"
              className="min-h-[38px] inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Exporter CSV</span>
            </a>
          </div>
        </div>

        {/* Titre */}
        <header>
          <div className="inline-flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Copy className="w-4 h-4" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)]">Gestion des Doublons CRM</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Fusionnez les fiches ayant le même numéro de téléphone pour centraliser l&apos;historique sans perte d&apos;activité.
          </p>
        </header>

        {error ? (
          <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-300">
            Impossible de charger les doublons. Vérifiez que la migration CRM est appliquée.
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-12 text-center shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="font-bold text-[var(--text)] text-base">Aucun doublon détecté</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Toutes les fiches prospects ont un numéro de contact distinct.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <DuplicateGroupCard key={group.phone_normalized} group={group} prospects={prospects} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function DuplicateGroupCard({ group, prospects }: { group: DuplicateGroup; prospects: Record<string, Prospect> }) {
  const defaultPrimary = group.prospect_ids[0]
  const defaultDuplicate = group.prospect_ids[1]
  if (!defaultPrimary || !defaultDuplicate) return null

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5 md:p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border)]">
        <div>
          <p className="font-mono font-bold text-[var(--text)] text-base">+{group.phone_normalized}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {group.duplicate_count} fiches identifiées · dernière activité {new Date(group.last_seen).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded-full px-3 py-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          Vérification humaine requise
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {group.prospect_ids.map((id) => (
          <Link
            key={id}
            href={`/admin/prospects/${id}`}
            className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 hover:border-[var(--accent-luxury)] transition-all group"
          >
            <div>
              <span className="block text-sm font-bold text-[var(--text)] group-hover:text-[var(--accent-luxury)] transition-colors">
                {prospects[id]?.nom || 'Prospect sans nom'}
              </span>
              <span className="block text-xs text-[var(--text-muted)] mt-0.5">
                Statut : {prospects[id]?.statut || 'Non renseigné'}
              </span>
            </div>
            <ExternalLink className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors" />
          </Link>
        ))}
      </div>

      <CrmActionForm
        action={mergeProspectsAction}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-4 space-y-3"
      >
        <input type="hidden" name="request_id" value={crypto.randomUUID()} />
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs font-bold text-[var(--text)]">
            Fiche principale à conserver
            <select
              name="primary_id"
              defaultValue={defaultPrimary}
              aria-label="Fiche principale à conserver"
              className="mt-1 min-h-[38px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface-card)] px-3 text-xs font-semibold text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
            >
              {group.prospect_ids.map((id) => (
                <option key={id} value={id}>
                  {prospects[id]?.nom || 'Prospect sans nom'} — {prospects[id]?.statut}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold text-[var(--text)]">
            Fiche secondaire à archiver
            <select
              name="duplicate_id"
              defaultValue={defaultDuplicate}
              aria-label="Fiche secondaire à archiver"
              className="mt-1 min-h-[38px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface-card)] px-3 text-xs font-semibold text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
            >
              {group.prospect_ids.map((id) => (
                <option key={id} value={id}>
                  {prospects[id]?.nom || 'Prospect sans nom'} — {prospects[id]?.statut}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">
          Les informations complémentaires restent consultables. La fusion réassigne l&apos;ensemble des interactions à la fiche principale sans perturber le suivi commercial.
        </p>
        <button
          type="submit"
          className="min-h-[40px] rounded-xl bg-[var(--accent-luxury)] hover:brightness-110 text-[#0b1530] px-5 text-xs font-black shadow-sm transition-all active:scale-95"
        >
          Confirmer la fusion des deux fiches
        </button>
      </CrmActionForm>
    </section>
  )
}
