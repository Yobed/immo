import Link from 'next/link'
import {
  Users, MapPin, MessageCircle, Calendar, Wallet, Download, Home, Clock,
  Inbox, PhoneCall, CheckCircle2, XCircle, StickyNote,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatFCFA } from '@/lib/format'
import { setProspectStatutAction, setProspectNoteAction } from './actions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Statut = 'nouveau' | 'en_cours' | 'traite' | 'perdu'

interface ProspectRow {
  id: string
  phone: string
  nom: string | null
  type_bien: string | null
  commune: string | null
  quartier: string | null
  budget: number | null
  date_souhaitee: string | null
  statut: string
  message_count: number
  dernier_message: string | null
  note: string | null
  first_seen: string
  last_seen: string
}

interface PageProps {
  searchParams: Promise<{ q?: string; statut?: string }>
}

const STATUT_META: Record<Statut, { label: string; cls: string }> = {
  nouveau: { label: 'À traiter', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  en_cours: { label: 'En cours', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  traite: { label: 'Traité', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  perdu: { label: 'Perdu', cls: 'bg-slate-200 text-slate-600 border-slate-300' },
}

function waLink(phone: string): string {
  let d = phone.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (!d.startsWith('225') && d.length <= 10) d = '225' + d
  return `https://wa.me/${d}`
}

function relative(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return "à l'instant"
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  return `il y a ${d} j`
}

export default async function AdminProspectsPage({ searchParams }: PageProps) {
  const { q, statut } = await searchParams
  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from('prospects')
    .select('*')
    .order('last_seen', { ascending: false })
    .limit(500)
  if (statut && statut in STATUT_META) query = query.eq('statut', statut)
  if (q) query = query.or(`nom.ilike.%${q}%,phone.ilike.%${q}%,commune.ilike.%${q}%,quartier.ilike.%${q}%`)
  const { data } = await query
  const rows = (data ?? []) as ProspectRow[]

  // Compteurs par statut (indépendants du filtre courant)
  const countOf = async (s?: Statut) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let c = (admin as any).from('prospects').select('id', { count: 'exact', head: true })
    if (s) c = c.eq('statut', s)
    const { count } = await c
    return count ?? 0
  }
  const [total, nNouveau, nEnCours, nTraite] = await Promise.all([
    countOf(), countOf('nouveau'), countOf('en_cours'), countOf('traite'),
  ])

  const tabs: Array<{ key: string | null; label: string }> = [
    { key: null, label: 'Tous' },
    { key: 'nouveau', label: 'À traiter' },
    { key: 'en_cours', label: 'En cours' },
    { key: 'traite', label: 'Traités' },
    { key: 'perdu', label: 'Perdus' },
  ]
  const qParam = q ? `&q=${encodeURIComponent(q)}` : ''

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-[var(--accent-luxury)]" />
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)]">Prospects</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Prospects qualifiés (avec un vrai besoin) collectés par Sapphire. Suivez chacun jusqu&apos;au closing.
          </p>
        </div>
        <a
          href="/api/admin/prospects/export"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold"
        >
          <Download className="w-4 h-4" /> Exporter CSV
        </a>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Total" value={total} icon={Users} />
        <Stat label="À traiter" value={nNouveau} icon={Inbox} tone="amber" />
        <Stat label="En cours" value={nEnCours} icon={PhoneCall} tone="blue" />
        <Stat label="Traités" value={nTraite} icon={CheckCircle2} tone="emerald" />
      </div>

      {/* Filtres statut */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {tabs.map((t) => {
          const active = (statut ?? null) === t.key || (!statut && t.key === null)
          return (
            <Link
              key={t.label}
              href={t.key ? `/admin/prospects?statut=${t.key}${qParam}` : `/admin/prospects${q ? `?q=${encodeURIComponent(q)}` : ''}`}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                active
                  ? 'bg-[var(--text)] text-[var(--surface-card)] border-[var(--text)]'
                  : 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
              }`}
            >
              {t.label}
            </Link>
          )
        })}
      </div>

      <form className="flex flex-wrap items-center gap-2 mb-6">
        {statut && <input type="hidden" name="statut" value={statut} />}
        <input
          type="text"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Nom, numéro, commune, quartier…"
          className="flex-1 min-w-[240px] px-4 py-2 bg-[var(--surface-card)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
        />
        <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800">
          Filtrer
        </button>
      </form>

      {rows.length === 0 ? (
        <div className="bg-[var(--surface-card)] rounded-2xl p-12 border border-[var(--border)] text-center">
          <p className="text-[var(--text-muted)] text-sm">Aucun prospect pour ce filtre.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const st = (r.statut in STATUT_META ? r.statut : 'nouveau') as Statut
            const meta = STATUT_META[st]
            const isNew = Date.now() - new Date(r.first_seen).getTime() < 7 * 864e5
            return (
              <div key={r.id} className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-4">
                {/* Ligne 1 : identité + statut + contacter */}
                <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[var(--text)] text-sm truncate">{r.nom || 'Prospect'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${meta.cls}`}>
                        {meta.label}
                      </span>
                      {isNew && st === 'nouveau' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500 text-white">
                          Nouveau
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">+225 {r.phone.replace(/^225/, '')}</p>
                    <p className="text-[11px] text-[var(--text-subtle)] flex items-center gap-3 mt-1 flex-wrap">
                      {(r.type_bien || r.commune || r.quartier) && (
                        <span className="inline-flex items-center gap-1">
                          <Home className="w-3 h-3" />
                          {[r.type_bien, r.commune, r.quartier].filter(Boolean).join(' · ')}
                        </span>
                      )}
                      {r.budget != null && (
                        <span className="inline-flex items-center gap-1"><Wallet className="w-3 h-3" />{formatFCFA(r.budget)}</span>
                      )}
                      {r.date_souhaitee && (
                        <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{r.date_souhaitee}</span>
                      )}
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{r.message_count} msg · {relative(r.last_seen)}</span>
                    </p>
                    {r.dernier_message && (
                      <p className="text-[11px] text-[var(--text-muted)] italic mt-1 flex items-start gap-1">
                        <MessageCircle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span className="line-clamp-1">« {r.dernier_message} »</span>
                      </p>
                    )}
                  </div>
                  <a
                    href={waLink(r.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Contacter
                  </a>
                </div>

                {/* Ligne 2 : suivi — statut + note */}
                <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <StatutBtn id={r.id} target="en_cours" current={st} label="En cours" activeCls="bg-blue-600 text-white" />
                    <StatutBtn id={r.id} target="traite" current={st} label="Traité" activeCls="bg-emerald-600 text-white" icon={CheckCircle2} />
                    <StatutBtn id={r.id} target="perdu" current={st} label="Perdu" activeCls="bg-slate-500 text-white" icon={XCircle} />
                  </div>
                  <form action={setProspectNoteAction} className="flex items-center gap-1.5 flex-1 min-w-[220px]">
                    <input type="hidden" name="id" value={r.id} />
                    <div className="relative flex-1">
                      <StickyNote className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-subtle)]" />
                      <input
                        type="text"
                        name="note"
                        defaultValue={r.note ?? ''}
                        maxLength={500}
                        placeholder="Note de suivi (ex. rappelé le 8/8, RDV lundi)…"
                        className="w-full pl-8 pr-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent-luxury)]"
                      />
                    </div>
                    <button type="submit" className="px-3 py-1.5 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] rounded-lg text-xs font-bold">
                      Enregistrer
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

function StatutBtn({
  id, target, current, label, activeCls, icon: Icon,
}: {
  id: string
  target: Statut
  current: Statut
  label: string
  activeCls: string
  icon?: typeof CheckCircle2
}) {
  const active = current === target
  return (
    <form action={setProspectStatutAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="statut" value={target} />
      <button
        type="submit"
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
          active ? activeCls : 'bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)]'
        }`}
      >
        {Icon && <Icon className="w-3 h-3" />} {label}
      </button>
    </form>
  )
}

function Stat({ label, value, icon: Icon, tone = 'default' }: { label: string; value: number; icon: typeof Users; tone?: 'default' | 'amber' | 'blue' | 'emerald' }) {
  const cls =
    tone === 'amber' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600'
    : tone === 'blue' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600'
    : tone === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
    : 'bg-[var(--surface-card)] border-[var(--border)] text-[var(--text)]'
  return (
    <div className={`px-4 py-3 rounded-xl border ${cls}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-80 inline-flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" />{label}</p>
      <p className="font-display text-3xl font-black tabular-nums mt-1">{value}</p>
    </div>
  )
}
