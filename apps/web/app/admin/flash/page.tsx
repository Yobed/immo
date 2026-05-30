import Image from 'next/image'
import Link from 'next/link'
import { Search, Flame, EyeOff, RotateCcw, MapPin, Calendar, AlertTriangle } from 'lucide-react'
import { createLocauxAdminClient } from '@/lib/supabase/locaux'
import { retirerFlashAction, restaurerFlashAction } from './actions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface SearchParams {
  q?: string
  show?: string
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

  let rows: LocalRow[] = []
  let err: string | null = null
  try {
    const sb = createLocauxAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (sb.from('locaux') as any)
      .select('id, ref_bien, type_de_bien, commune, quartier, prix, prix_normalise, status, is_duplicate, disponible, date_publication, lien_image, message_initial')
      .order('date_publication', { ascending: false })
      .limit(60)
    if (showInactive) query = query.eq('status', 'inactive')
    else query = query.not('status', 'eq', 'inactive')
    if (q) query = query.or(`commune.ilike.%${q}%,type_de_bien.ilike.%${q}%,ref_bien.ilike.%${q}%`)
    const { data } = await query
    rows = (data ?? []) as LocalRow[]
  } catch {
    err = "Clé service-role locaux indisponible (LOCAUX_SUPABASE_SERVICE_ROLE_KEY). Configure-la sur Vercel."
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
            {showInactive ? 'Offres masquées (restaurables)' : 'Offres actives'} — {rows.length} affichée{rows.length > 1 ? 's' : ''}.
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
                    {isInactive && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-700 text-white">
                        Masquée
                      </div>
                    )}
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

                    <div className="mt-auto pt-3 border-t border-[var(--border)] flex gap-2">
                      {isInactive ? (
                        <form action={restaurerFlashAction} className="flex-1">
                          <input type="hidden" name="id" value={row.id} />
                          <button type="submit" className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" /> Restaurer
                          </button>
                        </form>
                      ) : (
                        <form action={retirerFlashAction} className="flex-1">
                          <input type="hidden" name="id" value={row.id} />
                          <button type="submit" className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors">
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
