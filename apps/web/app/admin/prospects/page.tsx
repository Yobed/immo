import Link from 'next/link'
import { Users, MapPin, Phone, MessageCircle, Calendar, Wallet, Download, Home } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatFCFA } from '@/lib/format'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
  first_seen: string
  last_seen: string
}

interface PageProps {
  searchParams: Promise<{ q?: string; commune?: string }>
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
  const { q, commune } = await searchParams
  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from('prospects')
    .select('*')
    .order('last_seen', { ascending: false })
    .limit(500)
  if (commune) query = query.ilike('commune', `%${commune}%`)
  if (q) query = query.or(`nom.ilike.%${q}%,phone.ilike.%${q}%,commune.ilike.%${q}%,quartier.ilike.%${q}%`)
  const { data } = await query
  const rows = (data ?? []) as ProspectRow[]

  const now = Date.now()
  const stats = {
    total: rows.length,
    nouveaux7j: rows.filter((r) => now - new Date(r.first_seen).getTime() < 7 * 864e5).length,
    avecBudget: rows.filter((r) => r.budget != null).length,
    avecDate: rows.filter((r) => r.date_souhaitee).length,
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 lg:py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-[var(--accent-luxury)]" />
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)]">Prospects</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Fiches collectées automatiquement par Sapphire au fil des conversations WhatsApp.
          </p>
        </div>
        <a
          href="/api/admin/prospects/export"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold"
        >
          <Download className="w-4 h-4" /> Exporter CSV
        </a>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total" value={stats.total} />
        <Stat label="Nouveaux (7 j)" value={stats.nouveaux7j} tone="emerald" />
        <Stat label="Budget renseigné" value={stats.avecBudget} tone="blue" />
        <Stat label="Échéance connue" value={stats.avecDate} tone="amber" />
      </div>

      <form className="flex flex-wrap items-center gap-2 mb-6">
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
          <p className="text-[var(--text-muted)] text-sm">Aucun prospect pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[var(--text)] text-sm truncate">{r.nom || 'Prospect'}</span>
                  {now - new Date(r.first_seen).getTime() < 7 * 864e5 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500 text-white">
                      Nouveau
                    </span>
                  )}
                  <span className="text-[11px] text-[var(--text-subtle)]">{r.message_count} msg · {relative(r.last_seen)}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">+225 {r.phone.replace(/^225/, '')}</p>
                <p className="text-[11px] text-[var(--text-subtle)] flex items-center gap-3 mt-1 flex-wrap">
                  {(r.type_bien || r.commune || r.quartier) && (
                    <span className="inline-flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      {[r.type_bien, r.commune, r.quartier].filter(Boolean).join(' · ') || '—'}
                    </span>
                  )}
                  {r.budget != null && (
                    <span className="inline-flex items-center gap-1"><Wallet className="w-3 h-3" />{formatFCFA(r.budget)}</span>
                  )}
                  {r.date_souhaitee && (
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{r.date_souhaitee}</span>
                  )}
                </p>
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
          ))}
        </div>
      )}

      <p className="text-[11px] text-[var(--text-subtle)] mt-6 flex items-center gap-1.5">
        <Phone className="w-3.5 h-3.5" />
        <MapPin className="w-3.5 h-3.5" />
        Fiches enrichies automatiquement : numéro, nom, type, commune, quartier, budget et échéance sont
        remplis dès que le prospect les mentionne. Données réservées aux admins.
      </p>
    </main>
  )
}

function Stat({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'emerald' | 'blue' | 'amber' }) {
  const cls =
    tone === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
    : tone === 'blue' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600'
    : tone === 'amber' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600'
    : 'bg-[var(--surface-card)] border-[var(--border)] text-[var(--text)]'
  return (
    <div className={`px-4 py-3 rounded-xl border ${cls}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="font-display text-3xl font-black tabular-nums mt-1">{value}</p>
    </div>
  )
}
