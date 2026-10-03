import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Copy, ExternalLink, AlertTriangle, FileText, Download, CheckCircle2 } from 'lucide-react'
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
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">
        {/* Navigation secondaire CRM épurée */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-1 bg-[var(--surface-hover)] p-0.5 rounded-lg border border-[var(--border)]">
            <Link
              href="/admin/prospects"
              className="px-3 py-1 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Pipeline & Leads
            </Link>
            <Link
              href="/admin/prospects/qualite"
              className="px-3 py-1 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Qualité des données
            </Link>
            <Link
              href="/admin/prospects/doublons"
              className="px-3 py-1 rounded-md text-xs font-semibold bg-[var(--surface-card)] text-[var(--text)] shadow-xs"
            >
              Doublons
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/admin/fiche-visite"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
              <span>Fiche vierge (PDF)</span>
            </a>
            <a
              href="/api/admin/prospects/export"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
              <span>Exporter CSV</span>
            </a>
          </div>
        </div>

        {/* Titre */}
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)] tracking-tight">Gestion des doublons</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Fusion des fiches ayant le même numéro de contact pour consolider l&apos;historique sans perte.
          </p>
        </div>

        {error ? (
          <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300">
            Impossible de charger les doublons.
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-card)] p-8 text-center text-xs text-[var(--text-muted)]">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            Aucun doublon détecté dans la base.
          </div>
        ) : (
          <div className="space-y-4">
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
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-card)] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--border)]/60">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-xs text-[var(--text)]">+{group.phone_normalized}</span>
          <span className="text-[11px] text-[var(--text-subtle)]">
            ({group.duplicate_count} fiches · actif le {new Date(group.last_seen).toLocaleDateString('fr-FR')})
          </span>
        </div>
        <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          À vérifier
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {group.prospect_ids.map((id) => (
          <Link
            key={id}
            href={`/admin/prospects/${id}`}
            className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5 hover:bg-[var(--surface-hover)] transition-colors group text-xs"
          >
            <div>
              <p className="font-medium text-[var(--text)] group-hover:text-[var(--accent-luxury)] transition-colors">
                {prospects[id]?.nom || 'Prospect sans nom'}
              </p>
              <p className="text-[11px] text-[var(--text-subtle)]">
                Statut : {prospects[id]?.statut || 'Non renseigné'}
              </p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
          </Link>
        ))}
      </div>

      <CrmActionForm
        action={mergeProspectsAction}
        className="rounded-lg border border-[var(--border)]/60 bg-[var(--surface)] p-3 space-y-3"
      >
        <input type="hidden" name="request_id" value={crypto.randomUUID()} />
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <label className="text-[var(--text-muted)] font-medium">
            Conserver (fiche principale)
            <select
              name="primary_id"
              defaultValue={defaultPrimary}
              aria-label="Fiche principale"
              className="mt-1 h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-card)] px-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
            >
              {group.prospect_ids.map((id) => (
                <option key={id} value={id}>
                  {prospects[id]?.nom || 'Prospect sans nom'} — {prospects[id]?.statut}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[var(--text-muted)] font-medium">
            Archiver (fiche doublon)
            <select
              name="duplicate_id"
              defaultValue={defaultDuplicate}
              aria-label="Fiche secondaire"
              className="mt-1 h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-card)] px-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
            >
              {group.prospect_ids.map((id) => (
                <option key={id} value={id}>
                  {prospects[id]?.nom || 'Prospect sans nom'} — {prospects[id]?.statut}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-[var(--text-subtle)]">
            L&apos;historique sera transféré sans interruption de suivi.
          </p>
          <button
            type="submit"
            className="h-8 px-3 rounded-lg bg-[var(--text)] text-[var(--surface-card)] hover:opacity-90 text-xs font-semibold shrink-0 transition-opacity"
          >
            Fusionner
          </button>
        </div>
      </CrmActionForm>
    </section>
  )
}
