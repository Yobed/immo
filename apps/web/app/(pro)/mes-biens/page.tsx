import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PremiumBienCard } from '@/components/bien/PremiumBienCard'
import { Button } from '@/components/ui'
import { ToggleStatutButton } from '@/components/bien/ToggleStatutButton'
import { BienAvailabilityToggle } from '@/components/bien/BienAvailabilityToggle'
import { DeleteBienButton } from '@/components/bien/DeleteBienButton'

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
  created_at: string
}

export default async function MesAnnoncesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biens } = await (supabase as any)
    .from('biens')
    .select('id, titre, commune, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces, statut, created_at, est_disponible')
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
    <main className="bg-surface min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl text-[var(--text)]">Mes annonces</h1>
          <Link href="/mes-biens/nouveau">
            <Button variant="primary">+ Nouvelle annonce</Button>
          </Link>
        </div>
        {bienRows.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted font-sans mb-4">Vous n'avez pas encore d'annonces.</p>
            <Link href="/mes-biens/nouveau"><Button>Créer ma première annonce</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bienRows.map((bien, i) => (
              <div key={bien.id} className="relative">
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
                />
                {/* Actions propriétaire */}
                <div className="mt-4 space-y-3">
                  <BienAvailabilityToggle 
                    bienId={bien.id} 
                    initialValue={bien.est_disponible} 
                  />
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
