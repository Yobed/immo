import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BienCard } from '@/components/bien/BienCard'

export default async function FavorisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: favoris } = await supabase
    .from('favoris')
    .select(`
      id,
      biens(
        id, titre, commune, type_bien, prix_mois_fcfa, prix_vente_fcfa,
        surface_m2, nb_pieces,
        biens_medias(url, est_couverture, ordre, type)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const biens = (favoris ?? []).map((f) => f.biens).filter(Boolean) as any[]

  return (
    <main className="bg-surface min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="font-display text-3xl text-[var(--text)] mb-6">Mes favoris</h1>
        {biens.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted font-sans mb-2">Vous n&apos;avez pas encore de favoris.</p>
            <a href="/biens" className="text-sm text-primary font-sans hover:underline">
              Parcourir les annonces →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {biens.map((bien) => {
              const medias = (bien.biens_medias ?? []) as Array<{ url: string; est_couverture: boolean; type: string }>
              const cover = medias.filter((m) => m.type === 'photo').find((m) => m.est_couverture) ?? medias[0]
              return (
                <BienCard
                  key={bien.id}
                  id={bien.id}
                  titre={bien.titre}
                  commune={bien.commune}
                  type_bien={bien.type_bien}
                  prix_mois_fcfa={bien.prix_mois_fcfa}
                  prix_vente_fcfa={bien.prix_vente_fcfa}
                  surface_m2={bien.surface_m2}
                  nb_pieces={bien.nb_pieces}
                  photo_url={cover?.url ?? null}
                />
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
