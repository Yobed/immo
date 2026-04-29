import Link from 'next/link'
import Image from 'next/image'
import { redirect, notFound } from 'next/navigation'
import { Search, Trash2, Eye, ShieldCheck, ShieldAlert, RotateCcw, Phone, Calendar, Pencil, Undo2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatFCFA } from '@/lib/format'
import { deleteBienAction, restoreBienAction, purgeBienAction, suspendreBienAction, republierBienAction } from './actions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface SearchParams {
  q?: string
  statut?: string
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

interface BienRow {
  id: string
  titre: string
  statut: string
  commune: string
  quartier: string | null
  type_bien: string
  prix_mois_fcfa: number | null
  prix_vente_fcfa: number | null
  prix_nuit_fcfa: number | null
  created_at: string
  proprietaire_id: string
  profiles: { phone: string | null; full_name: string; email: string } | null
  biens_medias: { url: string; est_couverture: boolean }[]
}

function statusBadge(statut: string) {
  const map: Record<string, { label: string; cls: string }> = {
    publie: { label: 'Publié', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    brouillon: { label: 'Brouillon', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    suspendu: { label: 'Suspendu', cls: 'bg-red-100 text-red-700 border-red-200' },
    archive: { label: 'Archivé', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  }
  const s = map[statut] ?? { label: statut, cls: 'bg-slate-100 text-slate-600 border-slate-200' }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${s.cls}`}>
      {s.label}
    </span>
  )
}

function priceDisplay(b: BienRow): string {
  if (b.prix_vente_fcfa) return `${formatFCFA(b.prix_vente_fcfa)} (vente)`
  if (b.prix_mois_fcfa) return `${formatFCFA(b.prix_mois_fcfa)} /mois`
  if (b.prix_nuit_fcfa) return `${formatFCFA(b.prix_nuit_fcfa)} /nuit`
  return '—'
}

export default async function AdminModerationPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/moderation')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') notFound()

  const sp = await searchParams
  const q = sp.q?.trim() ?? ''
  const statut = sp.statut ?? 'all'

  const admin = createAdminClient()
  let query = admin
    .from('biens')
    .select(`
      id, titre, statut, commune, quartier, type_bien,
      prix_mois_fcfa, prix_vente_fcfa, prix_nuit_fcfa,
      created_at, proprietaire_id,
      profiles!biens_proprietaire_id_fkey(phone, full_name, email),
      biens_medias(url, est_couverture)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (statut !== 'all') {
    query = query.eq('statut', statut)
  }

  if (q) {
    const looksLikePhone = /[\d+\s]{6,}/.test(q) && !/[a-zA-Z]/.test(q)
    if (looksLikePhone) {
      const digits = q.replace(/\D/g, '')
      const { data: matchingProfiles } = await admin
        .from('profiles')
        .select('id')
        .ilike('phone', `%${digits}%`)
      const ids = (matchingProfiles ?? []).map(p => p.id)
      if (ids.length > 0) {
        query = query.in('proprietaire_id', ids)
      } else {
        query = query.eq('id', '00000000-0000-0000-0000-000000000000')
      }
    } else {
      query = query.or(`titre.ilike.%${q}%,commune.ilike.%${q}%,quartier.ilike.%${q}%`)
    }
  }

  const { data: biensRaw } = await query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const biens = (biensRaw ?? []) as any as BienRow[]

  const stats = {
    total: biens.length,
    publie: biens.filter(b => b.statut === 'publie').length,
    brouillon: biens.filter(b => b.statut === 'brouillon').length,
    suspendu: biens.filter(b => b.statut === 'suspendu').length,
    archive: biens.filter(b => b.statut === 'archive').length,
  }
  const isTrashView = statut === 'archive'

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-slate-700" />
            <div>
              <h1 className="font-bold text-slate-900 text-lg leading-none">{isTrashView ? 'Corbeille' : 'Modération'}</h1>
              <p className="text-slate-400 text-xs mt-1">
                {stats.total} bien{stats.total > 1 ? 's' : ''} · {stats.publie} publiés · {stats.brouillon} brouillons · {stats.suspendu} suspendus · {stats.archive} corbeille
              </p>
            </div>
          </div>
          <Link href="/" className="text-slate-400 hover:text-slate-700 text-xs font-medium">← Retour app</Link>
        </div>

        {/* Filters */}
        <form className="max-w-[1400px] mx-auto px-6 pb-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[280px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Numéro WhatsApp (+225...) ou titre / commune / quartier"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400"
            />
          </div>
          <select
            name="statut"
            defaultValue={statut}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-400"
          >
            <option value="all">Tous statuts</option>
            <option value="publie">Publiés</option>
            <option value="brouillon">Brouillons</option>
            <option value="suspendu">Suspendus</option>
            <option value="archive">🗑️ Corbeille</option>
          </select>
          <button type="submit" className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
            Rechercher
          </button>
          {(q || statut !== 'all') && (
            <Link href="/admin/moderation" className="px-4 py-2.5 text-slate-500 hover:text-slate-900 text-sm font-medium">Réinitialiser</Link>
          )}
        </form>
      </div>

      {/* Liste */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {biens.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
            <p className="text-slate-400 text-sm">Aucun bien ne correspond aux critères.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {biens.map(bien => {
              const cover = bien.biens_medias?.find(m => m.est_couverture)?.url
                || bien.biens_medias?.[0]?.url
                || null
              const phoneDisplay = bien.profiles?.phone || '—'
              const date = new Date(bien.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })

              return (
                <div key={bien.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                  {/* Image */}
                  <div className="aspect-video bg-slate-100 relative">
                    {cover ? (
                      <Image src={cover} alt={bien.titre} fill className="object-cover" sizes="400px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">Pas de photo</div>
                    )}
                    <div className="absolute top-2 left-2">{statusBadge(bien.statut)}</div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-white text-[10px] font-bold">
                      {bien.biens_medias?.length || 0} photo{(bien.biens_medias?.length || 0) > 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">{bien.titre}</h3>
                    <p className="text-slate-500 text-xs mb-2">
                      {bien.commune}{bien.quartier ? ` · ${bien.quartier}` : ''} · {bien.type_bien}
                    </p>
                    <p className="text-slate-700 font-semibold text-sm mb-3">{priceDisplay(bien)}</p>

                    <div className="space-y-1 text-xs text-slate-500 mb-3">
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />
                        <span className="font-medium text-slate-700">{phoneDisplay}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {date}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                      <Link
                        href={`/biens/${bien.id}`}
                        target="_blank"
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Voir
                      </Link>

                      {bien.statut !== 'archive' && (
                        <Link
                          href={`/mes-biens/${bien.id}/modifier`}
                          target="_blank"
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Modifier
                        </Link>
                      )}

                      {bien.statut === 'publie' && (
                        <form action={suspendreBienAction}>
                          <input type="hidden" name="bienId" value={bien.id} />
                          <button type="submit" className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition-colors">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Suspendre
                          </button>
                        </form>
                      )}

                      {(bien.statut === 'suspendu' || bien.statut === 'brouillon') && (
                        <form action={republierBienAction}>
                          <input type="hidden" name="bienId" value={bien.id} />
                          <button type="submit" className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" />
                            Republier
                          </button>
                        </form>
                      )}

                      {bien.statut !== 'archive' ? (
                        <form action={deleteBienAction} className="ml-auto">
                          <input type="hidden" name="bienId" value={bien.id} />
                          <button
                            type="submit"
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors"
                            title="Envoyer à la corbeille (récupérable)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Corbeille
                          </button>
                        </form>
                      ) : (
                        <>
                          <form action={restoreBienAction}>
                            <input type="hidden" name="bienId" value={bien.id} />
                            <button
                              type="submit"
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                              title="Restaurer (republier)"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              Restaurer
                            </button>
                          </form>
                          <form action={purgeBienAction} className="ml-auto">
                            <input type="hidden" name="bienId" value={bien.id} />
                            <button
                              type="submit"
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition-colors"
                              title="Suppression DÉFINITIVE (Storage + DB)"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Purger
                            </button>
                          </form>
                        </>
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
