// app/(client)/avis/page.tsx — Server Component (pas de 'use client')
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AvisCard } from '@/components/avis/AvisCard'
import { AvisForm } from '@/components/avis/AvisForm'
import { Card } from '@/components/ui/Card'

export const metadata = { title: 'Mes Avis — Immo CI' }

export default async function ClientAvisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Étape 1: récupérer les IDs de réservations déjà notées par ce locataire
  // bienIds.length guard pattern (cf STATE.md) — .in() sur tableau vide retourne erreur
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: dejaNotes } = await (supabase.from('avis') as any)
    .select('reservation_id')
    .eq('auteur_id', user.id)
    .not('reservation_id', 'is', null)

  const dejaNoteIds = (dejaNotes ?? []).map((a: { reservation_id: string }) => a.reservation_id)

  // Étape 2: réservations terminées où le locataire n'a pas encore noté le propriétaire
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let resaQuery = (supabase.from('reservations') as any)
    .select(`
      id, date_fin, statut,
      biens ( titre, commune ),
      profiles!proprietaire_id ( id, nom_complet )
    `)
    .eq('locataire_id', user.id)
    .eq('statut', 'terminee')
    .order('date_fin', { ascending: false })
    .limit(10)

  if (dejaNoteIds.length > 0) {
    resaQuery = resaQuery.not('id', 'in', `(${dejaNoteIds.map((id: string) => `'${id}'`).join(',')})`)
  }

  // Fetch parallèle: réservations à noter + avis reçus
  const [reservationsResult, avisRecusResult] = await Promise.all([
    resaQuery,
    // Avis reçus par le locataire
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('avis') as any)
      .select(`
        id, note, commentaire, reponse_cible, created_at,
        profiles!auteur_id ( nom_complet )
      `)
      .eq('cible_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const reservationsANoter = reservationsResult.data ?? []
  const avisRecus = avisRecusResult.data ?? []

  // Calculer note moyenne
  const noteMoyenne = avisRecus.length
    ? (avisRecus.reduce((s: number, a: { note: number }) => s + a.note, 0) / avisRecus.length).toFixed(1)
    : null

  return (
    <div className="bg-surface min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold font-display text-[var(--text)] mb-6">Mes Avis</h1>

        {/* Réservations à noter */}
        {reservationsANoter.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-3">
              À évaluer ({reservationsANoter.length})
            </h2>
            <div className="space-y-4">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {reservationsANoter.map((resa: any) => {
                const bien = resa.biens as { titre: string; commune: string } | null
                const proprio = resa['profiles!proprietaire_id'] as { id: string; nom_complet: string } | null
                return (
                  <Card key={resa.id} className="p-4">
                    <p className="font-medium text-[var(--text)] mb-1">
                      {bien?.titre ?? 'Bien'} — {bien?.commune}
                    </p>
                    <p className="text-sm text-muted mb-3">
                      Séjour terminé le {new Date(resa.date_fin).toLocaleDateString('fr-FR')}
                    </p>
                    <AvisForm
                      reservationId={resa.id}
                      cibleId={proprio?.id ?? ''}
                      cibleNom={proprio?.nom_complet ?? 'le propriétaire'}
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
            <h2 className="text-lg font-semibold text-[var(--text)]">
              Avis reçus ({avisRecus.length})
            </h2>
            {noteMoyenne && (
              <span className="text-sm font-medium text-secondary bg-[var(--surface)] px-3 py-1 rounded-full border border-[var(--border)]">
                Note moyenne: {noteMoyenne}/5
              </span>
            )}
          </div>

          {avisRecus.length === 0 ? (
            <Card className="p-8 text-center text-muted">
              <p>Aucun avis reçu pour le moment.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {avisRecus.map((avis: any) => {
                const auteur = avis['profiles!auteur_id'] as { nom_complet: string } | null
                return (
                  <AvisCard
                    key={avis.id}
                    auteurNom={auteur?.nom_complet ?? 'Anonyme'}
                    note={avis.note}
                    commentaire={avis.commentaire}
                    reponseCible={avis.reponse_cible}
                    dateCreation={avis.created_at}
                  />
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
