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
  const { data: biensRaw, error: biensErr } = await (admin.from('biens') as any)
    .select(`
      id, titre, commune, quartier, type_bien,
      prix_mois_fcfa, prix_vente_fcfa, prix_nuit_fcfa,
      soumis_le, created_at, proprietaire_id,
      biens_medias(url, est_couverture)
    `)
    .eq('statut', 'en_attente')
    .order('soumis_le', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true })
    .limit(100)
  if (biensErr) console.error('[admin/validation] biens query:', biensErr)

  // Second appel pour les profils propriétaire : evite le join FK explicite
  // (qui foirait silencieusement quand le nom de la contrainte diffère).
  const proprietaireIds = Array.from(new Set((biensRaw ?? []).map((b: { proprietaire_id: string }) => b.proprietaire_id)))
  let profilesById: Record<string, { phone: string | null; full_name: string | null; email: string | null }> = {}
  if (proprietaireIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profs } = await (admin.from('profiles') as any)
      .select('id, phone, full_name, email')
      .in('id', proprietaireIds)
    profilesById = Object.fromEntries((profs ?? []).map((p: { id: string; phone: string | null; full_name: string | null; email: string | null }) => [p.id, p]))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const biens = ((biensRaw ?? []) as any as Omit<BienRow, 'profiles'>[]).map((b) => ({
    ...b,
    profiles: profilesById[b.proprietaire_id] ?? null,
  })) as BienRow[]

  return (
    <main className="min-h-screen bg-[var(--surface-hover)]">
      {/* Sous-en-tête de la page */}
      <div className="bg-[var(--surface-card)] border-b border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <h1 className="font-bold text-[var(--text)] text-lg leading-none">File de validation</h1>
          <p className="text-[var(--text-subtle)] text-xs mt-1">
            {biens.length} annonce{biens.length > 1 ? 's' : ''} en attente — approuvez ou refusez avant publication.
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {biens.length === 0 ? (
          <div className="bg-[var(--surface-card)] rounded-2xl p-12 border border-[var(--border)] text-center">
            <Inbox className="w-10 h-10 text-[var(--text-subtle)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)] text-sm font-medium">Aucune annonce en attente de validation. 🎉</p>
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
                <div key={bien.id} className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col">
                  <div className="aspect-video bg-[var(--surface-hover)] relative">
                    {cover ? (
                      <Image src={cover} alt={bien.titre} fill className="object-cover" sizes="400px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)] text-xs">Pas de photo</div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-amber-100 text-amber-700 border-amber-200">
                      En attente
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-white text-[10px] font-bold">
                      {bien.biens_medias?.length || 0} photo{(bien.biens_medias?.length || 0) > 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-[var(--text)] text-sm mb-1 line-clamp-2">{bien.titre}</h3>
                    <p className="text-[var(--text-muted)] text-xs mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {bien.commune}{bien.quartier ? ` · ${bien.quartier}` : ''} · {bien.type_bien}
                    </p>
                    <p className="text-[var(--text)] font-semibold text-sm mb-3">{priceDisplay(bien)}</p>

                    <div className="space-y-1 text-xs text-[var(--text-muted)] mb-3">
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />
                        <span className="font-medium text-[var(--text)]">{bien.profiles?.full_name || '—'}</span>
                        {bien.profiles?.phone ? <span>· {bien.profiles.phone}</span> : null}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        Soumis le {date}
                      </p>
                    </div>

                    <div className="mt-auto pt-3 border-t border-[var(--border)] space-y-2">
                      <div className="flex gap-2">
                        <Link
                          href={`/biens/${bien.id}`}
                          target="_blank"
                          className="flex items-center gap-1 px-3 py-2 bg-[var(--surface-hover)] hover:bg-[var(--surface-hover)] text-[var(--text)] rounded-lg text-xs font-medium transition-colors"
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
                            className="w-full text-xs px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:border-red-400 resize-none"
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
