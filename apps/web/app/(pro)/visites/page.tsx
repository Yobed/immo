import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { VisiteActions } from './VisiteActions'

function StatutBadge({ statut }: { statut: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'success' | 'danger' | 'warning' }> = {
    en_attente: { label: 'En attente', variant: 'warning' },
    confirmee:  { label: 'Confirmée',  variant: 'success' },
    annulee:    { label: 'Annulée',    variant: 'danger' },
    realisee:   { label: 'Réalisée',   variant: 'default' },
  }
  const cfg = config[statut] ?? { label: statut, variant: 'default' }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export default async function VisitesPropriétairePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: visites } = await supabase
    .from('visites')
    .select(`
      id, date_souhaitee, heure_debut, heure_fin, statut, notes, created_at, source,
      biens(titre)
    `)
    .eq('proprietaire_id', user.id)
    .order('date_souhaitee', { ascending: true })

  return (
    <main className="bg-surface min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="font-display text-3xl text-[var(--text)] mb-6">Demandes de visite</h1>
        {(!visites || visites.length === 0) ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <p className="font-display text-xl text-[var(--text)] mb-2">Aucune demande de visite</p>
            <p className="text-muted font-sans text-sm mb-6">
              Les demandes de visite apparaîtront ici une fois vos annonces publiées.
            </p>
            <a href="/mes-biens" className="inline-block px-6 py-2 bg-primary text-white rounded-btn text-sm font-sans font-medium hover:bg-primary/90 transition-colors">
              Voir mes annonces
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {(visites as any[]).map((visite) => (
              <div key={visite.id} className="bg-white rounded-card border border-[var(--border)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StatutBadge statut={visite.statut} />
                      <span className="text-sm text-muted font-sans">
                        {visite.biens?.titre ?? 'Bien inconnu'}
                      </span>
                    </div>
                    <p className="font-sans font-medium text-[var(--text)]">
                      {format(new Date(visite.date_souhaitee), 'EEEE d MMMM yyyy', { locale: fr })}
                      {visite.heure_debut && (
                        <span className="text-muted">
                          {' · '}{visite.heure_debut}{visite.heure_fin ? ` - ${visite.heure_fin}` : ''}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted mt-1">
                      Client vérifié BOGBE&apos;S
                      <span className="ml-2 text-xs bg-[var(--surface)] px-2 py-0.5 rounded-pill text-[var(--text-muted)]">
                        Coordonnées protégées · contact via la plateforme
                      </span>
                    </p>
                    {visite.notes && (
                      <p className="text-sm text-[var(--text)] mt-2 bg-[var(--surface)] rounded-btn px-3 py-2">
                        {visite.notes}
                      </p>
                    )}
                  </div>
                  {visite.statut === 'en_attente' && (
                    <VisiteActions visiteId={visite.id} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
