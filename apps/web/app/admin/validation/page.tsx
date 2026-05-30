import Image from 'next/image'
import Link from 'next/link'
import { Eye, Phone, Calendar, MapPin, Check, X, Inbox } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatFCFA } from '@/lib/format'
import { approuverBienAction, refuserBienAction } from './actions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface BienRow {
  id: string
  titre: string
  commune: string
  quartier: string | null
  type_bien: string
  prix_mois_fcfa: number | null
  prix_vente_fcfa: number | null
  prix_nuit_fcfa: number | null
  soumis_le: string | null
  created_at: string
  proprietaire_id: string
  profiles: { phone: string | null; full_name: string | null; email: string | null } | null
  biens_medias: { url: string; est_couverture: boolean }[]
}

function priceDisplay(b: BienRow): string {
  if (b.prix_vente_fcfa) return `${formatFCFA(b.prix_vente_fcfa)} (vente)`
  if (b.prix_mois_fcfa) return `${formatFCFA(b.prix_mois_fcfa)} /mois`
  if (b.prix_nuit_fcfa) return `${formatFCFA(b.prix_nuit_fcfa)} /nuit`
  return 'Prix sur demande'
}

export default async function AdminValidationPage() {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biensRaw } = await (admin.from('biens') as any)
    .select(`
      id, titre, commune, quartier, type_bien,
      prix_mois_fcfa, prix_vente_fcfa, prix_nuit_fcfa,
      soumis_le, created_at, proprietaire_id,
      profiles!biens_proprietaire_id_fkey(phone, full_name, email),
      biens_medias(url, est_couverture)
    `)
    .eq('statut', 'en_attente')
    .order('soumis_le', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true })
    .limit(100)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const biens = (biensRaw ?? []) as any as BienRow[]

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Sous-en-tête de la page */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <h1 className="font-bold text-slate-900 text-lg leading-none">File de validation</h1>
          <p className="text-slate-400 text-xs mt-1">
            {biens.length} annonce{biens.length > 1 ? 's' : ''} en attente — approuvez ou refusez avant publication.
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {biens.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">Aucune annonce en attente de validation. 🎉</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {biens.map((bien) => {
              const cover =
                bien.biens_medias?.find((m) => m.est_couverture)?.url ||
                bien.biens_medias?.[0]?.url ||
                null
              const submitted = bien.soumis_le ?? bien.created_at
              const date = new Date(submitted).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })

              return (
                <div key={bien.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                  <div className="aspect-video bg-slate-100 relative">
                    {cover ? (
                      <Image src={cover} alt={bien.titre} fill className="object-cover" sizes="400px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">Pas de photo</div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-amber-100 text-amber-700 border-amber-200">
                      En attente
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-white text-[10px] font-bold">
                      {bien.biens_medias?.length || 0} photo{(bien.biens_medias?.length || 0) > 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">{bien.titre}</h3>
                    <p className="text-slate-500 text-xs mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {bien.commune}{bien.quartier ? ` · ${bien.quartier}` : ''} · {bien.type_bien}
                    </p>
                    <p className="text-slate-700 font-semibold text-sm mb-3">{priceDisplay(bien)}</p>

                    <div className="space-y-1 text-xs text-slate-500 mb-3">
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />
                        <span className="font-medium text-slate-700">{bien.profiles?.full_name || '—'}</span>
                        {bien.profiles?.phone ? <span>· {bien.profiles.phone}</span> : null}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        Soumis le {date}
                      </p>
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex gap-2">
                        <Link
                          href={`/biens/${bien.id}`}
                          target="_blank"
                          className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Aperçu
                        </Link>
                        <form action={approuverBienAction} className="flex-1">
                          <input type="hidden" name="bienId" value={bien.id} />
                          <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approuver
                          </button>
                        </form>
                      </div>

                      {/* Refus avec motif (disclosure pour garder le formulaire serveur) */}
                      <details className="group">
                        <summary className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 cursor-pointer list-none transition-colors">
                          <X className="w-3.5 h-3.5" />
                          Refuser
                        </summary>
                        <form action={refuserBienAction} className="mt-2 space-y-2">
                          <input type="hidden" name="bienId" value={bien.id} />
                          <textarea
                            name="motif"
                            required
                            rows={2}
                            placeholder="Motif du refus (communiqué au propriétaire)…"
                            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-red-400 resize-none"
                          />
                          <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            Confirmer le refus
                          </button>
                        </form>
                      </details>
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
