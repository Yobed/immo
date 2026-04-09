// app/(pro)/avis/page.tsx — Server Component (pas de 'use client')
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AvisCard } from '@/components/avis/AvisCard'
import { AvisForm } from '@/components/avis/AvisForm'
import { Card } from '@/components/ui/Card'
import { ReponseForm } from '@/components/avis/ReponseForm'

export const metadata = { title: 'Avis Reçus — Immo CI Pro' }

export default async function ProAvisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Étape 1: réservations déjà notées par le propriétaire
  // bienIds.length guard pattern (cf STATE.md) — .in() sur tableau vide retourne erreur
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: dejaNotesPro } = await (supabase.from('avis') as any)
    .select('reservation_id')
    .eq('auteur_id', user.id)
    .not('reservation_id', 'is', null)

  const dejaNoteProIds = (dejaNotesPro ?? []).map((a: { reservation_id: string }) => a.reservation_id)

  // Fetch parallèle: avis reçus + réservations terminées à noter
  const [avisRecusResult, reservationsResult] = await Promise.all([
    // Avis reçus par le propriétaire (avec info auteur)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('avis') as any)
      .select(`
        id, note, commentaire, reponse_cible, created_at,
        reservation_id,
        profiles!auteur_id ( nom_complet )
      `)
      .eq('cible_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),

    // Réservations terminées où le proprio n'a pas encore noté le locataire
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (supabase.from('reservations') as any)
        .select(`
          id, date_fin,
          biens ( titre, commune ),
          profiles!locataire_id ( id, nom_complet )
        `)
        .eq('proprietaire_id', user.id)
        .eq('statut', 'terminee')
        .order('date_fin', { ascending: false })
        .limit(10)

      if (dejaNoteProIds.length > 0) {
        q = q.not('id', 'in', `(${dejaNoteProIds.map((id: string) => `'${id}'`).join(',')})`)
      }
      return q
    })(),
  ])

  const avisRecus = avisRecusResult.data ?? []
  const reservationsANoter = reservationsResult.data ?? []

  const noteMoyenne = avisRecus.length
    ? (avisRecus.reduce((s: number, a: { note: number }) => s + a.note, 0) / avisRecus.length).toFixed(1)
    : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Avis Reçus</h1>

      {/* À évaluer (propriétaire note ses locataires) */}
      {reservationsANoter.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Locataires à évaluer ({reservationsANoter.length})
          </h2>
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {reservationsANoter.map((resa: any) => {
              const bien = resa.biens as { titre: string; commune: string } | null
              const locataire = resa['profiles!locataire_id'] as { id: string; nom_complet: string } | null
              return (
                <Card key={resa.id} className="p-4">
                  <p className="font-medium text-gray-900 mb-1">
                    {locataire?.nom_complet ?? 'Locataire'} · {bien?.titre}, {bien?.commune}
                  </p>
                  <p className="text-sm text-gray-500 mb-3">
                    Séjour terminé le {new Date(resa.date_fin).toLocaleDateString('fr-FR')}
                  </p>
                  <AvisForm
                    reservationId={resa.id}
                    cibleId={locataire?.id ?? ''}
                    cibleNom={locataire?.nom_complet ?? 'le locataire'}
                  />
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* Avis reçus */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Avis de mes locataires ({avisRecus.length})
          </h2>
          {noteMoyenne && (
            <span className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              Note moyenne: {noteMoyenne}/5
            </span>
          )}
        </div>

        {avisRecus.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <p>Aucun avis reçu pour le moment.</p>
            <p className="text-sm mt-2">Les avis apparaissent après la fin d&apos;une réservation.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {avisRecus.map((avis: any) => {
              const auteur = avis['profiles!auteur_id'] as { nom_complet: string } | null
              return (
                <div key={avis.id} className="space-y-2">
                  <AvisCard
                    auteurNom={auteur?.nom_complet ?? 'Anonyme'}
                    note={avis.note}
                    commentaire={avis.commentaire}
                    reponseCible={avis.reponse_cible}
                    dateCreation={avis.created_at}
                    showReponse={true}
                  />
                  {/* Formulaire de réponse si pas encore répondu */}
                  {!avis.reponse_cible && (
                    <ReponseForm avisId={avis.id} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
