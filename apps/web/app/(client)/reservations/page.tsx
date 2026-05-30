import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const metadata = { title: "Mes réservations — BOGBE'S GROUPE" }

const STATUT_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'danger' | 'warning' }> = {
  en_attente: { label: 'En attente de paiement', variant: 'warning' },
  confirmee:  { label: 'Confirmée',              variant: 'success' },
  annulee:    { label: 'Annulée',                variant: 'danger'  },
  terminee:   { label: 'Terminée',               variant: 'default' },
}

export default async function MesReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reservations } = await (supabase as any)
    .from('reservations')
    .select(`
      id, date_debut, date_fin, montant_loyer_fcfa, montant_total_fcfa,
      statut, created_at,
      biens ( id, titre, commune, adresse_complete )
    `)
    .eq('locataire_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="bg-surface min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="font-display text-3xl text-[var(--text)] mb-6">Mes réservations</h1>

        {(!reservations || reservations.length === 0) ? (
          <div className="text-center py-16">
            <p className="text-muted font-sans mb-4">Vous n&apos;avez pas encore de réservations.</p>
            <Link
              href="/recherche"
              className="inline-block px-6 py-3 bg-primary text-white rounded-btn font-sans text-sm hover:bg-primary/90 transition-colors"
            >
              Rechercher un bien
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(reservations as any[]).map((resa) => {
              const bien = resa.biens as { id: string; titre: string; commune: string; adresse_complete?: string } | null
              const cfg = STATUT_CONFIG[resa.statut] ?? { label: resa.statut, variant: 'default' as const }

              return (
                <Link
                  key={resa.id}
                  href={`/reservations/${resa.id}`}
                  className="block bg-[var(--surface-card)] rounded-card border border-[var(--border)] p-5 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      <p className="font-sans font-semibold text-[var(--text)] truncate">
                        {bien?.titre ?? 'Bien inconnu'}
                      </p>
                      <p className="text-sm text-muted font-sans">
                        {bien?.commune}{bien?.adresse_complete ? ` — ${bien.adresse_complete}` : ''}
                      </p>
                      <p className="text-sm text-[var(--text)] font-sans mt-2">
                        Du{' '}
                        <strong>{format(new Date(resa.date_debut), 'd MMM yyyy', { locale: fr })}</strong>
                        {' '}au{' '}
                        <strong>{format(new Date(resa.date_fin), 'd MMM yyyy', { locale: fr })}</strong>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono font-semibold text-primary">
                        {Number(resa.montant_total_fcfa).toLocaleString('fr-FR')} FCFA
                      </p>
                      <p className="text-xs text-muted font-sans mt-1">
                        {format(new Date(resa.created_at), 'd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
