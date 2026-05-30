import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

export const metadata = { title: "Mes visites — BOGBE'S GROUPE" }

function StatutBadge({ statut }: { statut: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'success' | 'danger' | 'warning' }> = {
    en_attente: { label: 'En attente', variant: 'warning' },
    confirmee:  { label: 'Confirmée',  variant: 'success' },
    annulee:    { label: 'Annulée',    variant: 'danger' },
    realisee:   { label: 'Réalisée',   variant: 'default' },
  }
  const cfg = config[statut] ?? { label: statut, variant: 'default' as const }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export default async function VisitesLocatairePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: visites } = await (supabase as any)
    .from('visites')
    .select(`
      id, date_souhaitee, heure_debut, heure_fin, statut, notes, created_at,
      biens(id, titre, commune)
    `)
    .eq('locataire_id', user.id)
    .order('date_souhaitee', { ascending: false })

  return (
    <main className="bg-surface min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="font-display text-3xl text-[var(--text)] mb-6">Mes visites</h1>

        {(!visites || visites.length === 0) ? (
          <div className="text-center py-16">
            <p className="text-muted font-sans mb-4">Vous n&apos;avez pas encore demandé de visite.</p>
            <Link
              href="/recherche"
              className="inline-block px-6 py-3 bg-primary text-white rounded-btn font-sans text-sm hover:bg-primary/90 transition-colors"
            >
              Rechercher un bien
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {(visites as any[]).map((visite) => (
              <div key={visite.id} className="bg-[var(--surface-card)] rounded-card border border-[var(--border)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StatutBadge statut={visite.statut} />
                      {visite.biens && (
                        <Link
                          href={`/biens/${visite.biens.id}`}
                          className="text-sm text-primary hover:underline font-sans"
                        >
                          {visite.biens.titre}
                        </Link>
                      )}
                    </div>
                    <p className="font-sans font-medium text-[var(--text)]">
                      {format(new Date(visite.date_souhaitee), 'EEEE d MMMM yyyy', { locale: fr })}
                      {visite.heure_debut && (
                        <span className="text-muted font-normal">
                          {' · '}{visite.heure_debut}{visite.heure_fin ? ` – ${visite.heure_fin}` : ''}
                        </span>
                      )}
                    </p>
                    {visite.biens?.commune && (
                      <p className="text-sm text-muted font-sans mt-1">{visite.biens.commune}</p>
                    )}
                    {visite.notes && (
                      <p className="text-sm text-[var(--text)] mt-2 bg-[var(--surface)] rounded-btn px-3 py-2 italic">
                        &ldquo;{visite.notes}&rdquo;
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted font-sans whitespace-nowrap">
                    {format(new Date(visite.created_at), 'd MMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
