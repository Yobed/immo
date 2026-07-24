import Image from 'next/image'
import Link from 'next/link'
import { Search, Flame, EyeOff, RotateCcw, MapPin, Calendar, AlertTriangle, CheckCircle2, Ban } from 'lucide-react'
import { locauxReadClients, byDatePubDesc } from '@/lib/supabase/locaux'
import type { SupabaseClient } from '@supabase/supabase-js'
import { retirerFlashAction, restaurerFlashAction, marquerOccupeAction, marquerDisponibleAction } from './actions'
import { FlashPhotoButton } from './FlashPhotoButton'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 100

interface SearchParams {
  q?: string
  show?: string
  page?: string
}
interface PageProps {
  searchParams: Promise<SearchParams>
}

interface LocalRow {
  id: number
  ref_bien: string | null
  type_de_bien: string | null
  commune: string | null
  quartier: string | null
  prix: string | null
  prix_normalise: number | null
  status: string | null
  is_duplicate: boolean | null
  disponible: string | null
  date_publication: string | null
  lien_image: string | null
  message_initial: string | null
}

function snippet(row: LocalRow): string {
  const base = [row.type_de_bien, row.commune].filter(Boolean).join(' · ')
  return base || (row.message_initial?.slice(0, 60) ?? 'Offre flash')
}

export default async function AdminFlashPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const q = sp.q?.trim() ?? ''
  const showInactive = sp.show === 'inactive'
  const page = Math.max(0, parseInt(sp.page ?? '0', 10) || 0)
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let rows: LocalRow[] = []
  let total = 0
  let err: string | null = null
  try {
    // Ancien + nouveau projet locaux fusionnés — lecture anon (RLS ouverte en
    // SELECT), la clé service n'est requise que pour retirer/restaurer.
    // ponytail: over-fetch 0..to sur chaque projet puis merge-tri-slice.
    const runOn = async (sb: SupabaseClient): Promise<{ rows: LocalRow[]; count: number }> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (sb.from('locaux') as any)
        .select('id, ref_bien, type_de_bien, commune, quartier, prix, prix_normalise, status, is_duplicate, disponible, date_publication, lien_image, message_initial', { count: 'exact' })
        .order('date_publication', { ascending: false })
        .range(0, to)
      // Vue admin alignée sur le catalogue public (consolidated.ts) : NULL = accepté,
      // pour que le total admin reflète le total affiché aux visiteurs.
      if (showInactive) query = query.eq('status', 'inactive')
      else query = query.not('status', 'eq', 'inactive').not('is_duplicate', 'is', true)
      if (q) query = query.or(`commune.ilike.%${q}%,type_de_bien.ilike.%${q}%,ref_bien.ilike.%${q}%`)
      const { data, count } = await query
      return { rows: (data ?? []) as LocalRow[], count: count ?? 0 }
    }
    const parts = await Promise.all(
      locauxReadClients().map((sb) => runOn(sb).catch(() => ({ rows: [] as LocalRow[], count: 0 }))),
    )
    rows = parts.flatMap((p) => p.rows).sort(byDatePubDesc).slice(from, to + 1)
    total = parts.reduce((a, p) => a + p.count, 0)
  } catch {
    err = 'Sources locaux indisponibles — réessaie dans un instant.'
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasPrev = page > 0
  const hasNext = page < totalPages - 1

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (showInactive) params.set('show', 'inactive')
    if (p > 0) params.set('page', String(p))
    const s = params.toString()
    return `/admin/flash${s ? '?' + s : ''}`
  }

  return (
    <main className="min-h-screen bg-[var(--surface-hover)]">
      <div className="bg-[var(--surface-card)] border-b border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-orange-500" />
            <h1 className="font-bold text-[var(--text)] text-lg leading-none">Offres flash</h1>
          </div>
          <p className="text-[var(--text-muted)] text-xs mb-3">
            {showInactive ? 'Offres masquées (restaurables)' : 'Offres actives (non-doublons)'} — {total.toLocaleString('fr-FR')} au total, page {page + 1}/{totalPages || 1}.
            Le retrait masque l&apos;offre partout (réversible).
          </p>
          <form className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[260px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Commune, type, référence…"
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
              />
            </div>
            <input type="hidden" name="show" value={showInactive ? 'inactive' : ''} />
            <button type="submit" className="px-5 py-2.5 bg-[var(--accent-luxury)] text-[var(--on-accent)] rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
              Rechercher
            </button>
            <Link
              href={showInactive ? '/admin/flash' : '/admin/flash?show=inactive'}
              className="px-4 py-2.5 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] rounded-xl"
            >
              {showInactive ? '← Offres actives' : 'Voir les masquées'}
            </Link>
          </form>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 mt-3">
              {hasPrev ? (
                <Link href={pageUrl(page - 1)} className="px-4 py-2 text-xs font-semibold text-[var(--text)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-hover)]">
                  ← Précédent
                </Link>
              ) : (
                <span className="px-4 py-2 text-xs text-[var(--text-subtle)] border border-[var(--border)] rounded-lg opacity-40">← Précédent</span>
              )}
              <span className="text-xs text-[var(--text-muted)]">{page + 1} / {totalPages}</span>
              {hasNext ? (
                <Link href={pageUrl(page + 1)} className="px-4 py-2 text-xs font-semibold text-[var(--text)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-hover)]">
                  Suivant →
                </Link>
              ) : (
                <span className="px-4 py-2 text-xs text-[var(--text-subtle)] border border-[var(--border)] rounded-lg opacity-40">Suivant →</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {err ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{err}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-[var(--surface-card)] rounded-2xl p-12 border border-[var(--border)] text-center">
            <p className="text-[var(--text-muted)] text-sm">Aucune offre flash {showInactive ? 'masquée' : 'active'} ne correspond.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((row) => {
              const date = row.date_publication
                ? new Date(row.date_publication).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—'
              const isInactive = (row.status ?? '').toLowerCase() === 'inactive'
              const isOccupe = (row.disponible ?? '').toLowerCase().trim() === 'non'
              return (
                <div key={row.id} className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col">
                  <div className="aspect-video bg-[var(--surface-hover)] relative">
                    {row.lien_image ? (
                      <Image src={row.lien_image} alt={snippet(row)} fill className="object-cover" sizes="400px" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)] text-xs">Pas de photo</div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-orange-100 text-orange-700 border-orange-200">
                      Flash
                    </div>
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                      {isInactive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-700 text-white">
                          Masquée
                        </span>
                      )}
                      {isOccupe && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-600 text-white">
                          Occupé
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-[var(--text)] text-sm mb-1 line-clamp-1">{snippet(row)}</h3>
                    <p className="text-[var(--text-muted)] text-xs mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {row.commune || '—'}{row.quartier ? ` · ${row.quartier}` : ''}
                      {row.ref_bien ? <span className="ml-1 opacity-60">#{row.ref_bien}</span> : null}
                    </p>
                    <p className="text-[var(--text)] font-semibold text-sm mb-2">{row.prix || (row.prix_normalise ? `${row.prix_normalise.toLocaleString('fr-FR')} FCFA` : 'Prix sur demande')}</p>
                    <p className="text-[var(--text-muted)] text-xs flex items-center gap-1.5 mb-3">
                      <Calendar className="w-3 h-3" /> {date}
                    </p>

                    <div className="mt-auto pt-3 border-t border-[var(--border)] flex flex-col gap-2">
                      {/* Ligne 1 : disponibilité + photo */}
                      <div className="flex gap-2 flex-wrap">
                        {isOccupe ? (
                          <form action={marquerDisponibleAction} className="flex-1">
                            <input type="hidden" name="id" value={row.id} />
                            <button type="submit" className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Disponible
                            </button>
                          </form>
                        ) : (
                          <form action={marquerOccupeAction} className="flex-1">
                            <input type="hidden" name="id" value={row.id} />
                            <button type="submit" className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors">
                              <Ban className="w-3.5 h-3.5" /> Occupé
                            </button>
                          </form>
                        )}
                        <FlashPhotoButton locauxId={row.id} hasPhoto={!!row.lien_image} />
                      </div>
                      {/* Ligne 2 : retrait / restauration */}
                      {isInactive ? (
                        <form action={restaurerFlashAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <button type="submit" className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" /> Restaurer
                          </button>
                        </form>
                      ) : (
                        <form action={retirerFlashAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <button type="submit" className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-transparent hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-colors">
                            <EyeOff className="w-3.5 h-3.5" /> Retirer
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
