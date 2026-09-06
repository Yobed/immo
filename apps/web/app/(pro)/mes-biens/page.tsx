import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PremiumBienCard } from '@/components/bien/PremiumBienCard'
import { Button } from '@/components/ui'
import { ToggleStatutButton } from '@/components/bien/ToggleStatutButton'
import { BienAvailabilityToggle } from '@/components/bien/BienAvailabilityToggle'
import { DeleteBienButton } from '@/components/bien/DeleteBienButton'
import { BroadcastButton } from '@/components/bien/BroadcastButton'

type BienRow = {
  id: string
  titre: string
  commune: string
  type_bien: string
  prix_mois_fcfa: number | null
  prix_nuit_fcfa: number | null
  prix_vente_fcfa: number | null
  surface_m2: number | null
  nb_pieces: number | null
  statut: string
  rejet_motif: string | null
  created_at: string
}

const STATUT_BADGE: Record<string, { label: string; cls: string }> = {
  brouillon: { label: 'Brouillon', cls: 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)]' },
  en_attente: { label: 'En ligne · vérification en cours', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  publie: { label: 'En ligne', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  refuse: { label: 'Refusée', cls: 'bg-red-100 text-red-700 border-red-200' },
  suspendu: { label: 'Suspendue', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  archive: { label: 'Archivée', cls: 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)]' },
  loue: { label: 'Loué/Vendu', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
}

export default async function MesAnnoncesPage({
  searchParams,
}: {
  searchParams: Promise<{ soumis?: string }>
}) {
  const sp = await searchParams
  const justSubmitted = sp.soumis === '1'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biens } = await (supabase as any)
    .from('biens')
    .select('id, titre, commune, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces, statut, rejet_motif, created_at, est_disponible')
    .eq('proprietaire_id', user.id)
    .order('created_at', { ascending: false })

  const bienRows = (biens ?? []) as (BienRow & { est_disponible: boolean })[]

  // Requête séparée pour les photos — plus fiable que le nested select
  let coverMap: Record<string, string> = {}
  if (bienRows.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: medias } = await (supabase as any)
      .from('biens_medias')
      .select('bien_id, url, est_couverture, ordre')
      .in('bien_id', bienRows.map((b) => b.id))
      .eq('type', 'photo')
      .order('ordre', { ascending: true })

    if (medias) {
      for (const m of medias as { bien_id: string; url: string; est_couverture: boolean; ordre: number }[]) {
        // Prendre la première photo trouvée, remplacer par la couverture si on la trouve
        if (!coverMap[m.bien_id] || m.est_couverture) {
          coverMap[m.bien_id] = m.url
        }
      }
    }
  }

  return (
    <main className="bg-[var(--background)] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl text-[var(--text)]">Mes annonces</h1>
          <Link href="/mes-biens/nouveau">
            <Button variant="primary">+ Nouvelle annonce</Button>
          </Link>
        </div>

        {justSubmitted && (
          <div className="mb-6 rounded-xl border border-amber-300/60 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
            <strong>Annonce publiée ✅</strong> — elle est <strong>déjà visible</strong> dans le catalogue avec la mention
            « vérification en cours ». Notre équipe la contrôle ; vous serez notifié(e) dès qu&apos;elle obtient le badge ✓ Vérifié.
          </div>
        )}
        {bienRows.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--text-muted)] font-sans mb-4">Vous n&apos;avez pas encore d&apos;annonces.</p>
            <Link href="/mes-biens/nouveau"><Button>Créer ma première annonce</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {bienRows.map((bien, i) => (
              <div key={bien.id} className="group relative flex flex-col h-full bg-[var(--surface-card)] rounded-[1.5rem] border border-[var(--border)] overflow-hidden transition-all duration-700 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] hover:-translate-y-2">
                <div className="flex-1">
                  <PremiumBienCard
                    id={bien.id}
                    titre={bien.titre}
                    commune={bien.commune}
                    type_bien={bien.type_bien}
                    prix_mois_fcfa={bien.prix_nuit_fcfa ? null : bien.prix_mois_fcfa}
                    prix_nuit_fcfa={bien.prix_nuit_fcfa}
                    prix_vente_fcfa={bien.prix_vente_fcfa}
                    surface_m2={bien.surface_m2}
                    nb_pieces={bien.nb_pieces}
                    photo_url={coverMap[bien.id] ?? null}
                    index={i}
                    isUltraCompact={true}
                  />
                </div>
                {/* Actions propriétaire - Intégrées proprement en bas de la carte */}
                <div className="p-4 pt-0 pb-5 mt-auto space-y-4 bg-inherit">
                  <div className="h-px w-full bg-[var(--border)] opacity-20 mb-4" />

                  {/* Statut de validation */}
                  {(() => {
                    const s = STATUT_BADGE[bien.statut] ?? { label: bien.statut, cls: 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)]' }
                    return (
                      <div className="space-y-2">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${s.cls}`}>
                          {s.label}
                        </span>
                        {bien.statut === 'refuse' && bien.rejet_motif && (
                          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 leading-snug">
                            <strong>Motif du refus :</strong> {bien.rejet_motif}
                          </p>
                        )}
                      </div>
                    )
                  })()}

                  {/* Dispo/Occupé : réservé aux biens DÉJÀ validés (publié ou loué).
                      Sur un bien en attente/brouillon/refusé, la visibilité n'a pas
                      de sens et le verrou de publication (trigger DB) le bloquerait. */}
                  {(bien.statut === 'publie' || bien.statut === 'loue') && (
                    <BienAvailabilityToggle
                      bienId={bien.id}
                      initialValue={bien.est_disponible}
                    />
                  )}
                  <div className="flex gap-2">
                    <Link href={`/mes-biens/${bien.id}/modifier`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">Modifier</Button>
                    </Link>
                    <Link href={`/mes-biens/${bien.id}/modifier?step=medias`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">Médias</Button>
                    </Link>
                    <div className="flex-1">
                      <ToggleStatutButton bienId={bien.id} statut={bien.statut} />
                    </div>
                  </div>
                  <BroadcastButton bienId={bien.id} statut={bien.statut} />
                  <DeleteBienButton bienId={bien.id} titre={bien.titre} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
