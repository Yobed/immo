// app/(pro)/quittances/page.tsx — Server Component (pas de 'use client')
import { createClient }  from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import { Badge }         from '@/components/ui/Badge'
import { Card }          from '@/components/ui/Card'
import Link              from 'next/link'

export const metadata = { title: 'Mes Quittances — Immo CI' }

// Couleurs statut quittances — variant 'danger' pour en_retard (PAS 'error')
const STATUT_BADGE: Record<string, { variant: 'default' | 'success' | 'danger' | 'warning'; label: string }> = {
  en_attente: { variant: 'warning',  label: 'En attente' },
  payee:      { variant: 'success',  label: 'Payée' },
  en_retard:  { variant: 'danger',   label: 'En retard' },
  annulee:    { variant: 'default',  label: 'Annulée' },
}

const FILTRES = [
  { value: 'tous',       label: 'Toutes' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'en_retard',  label: 'En retard' },
  { value: 'payee',      label: 'Payées' },
]

interface PageProps {
  searchParams: Promise<{ statut?: string }>
}

export default async function QuittancesPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { statut: filtreStatut } = await searchParams
  const filtreActif = filtreStatut && filtreStatut !== 'tous' ? filtreStatut : null

  // Query quittances du propriétaire — avec join contrat + locataire
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('quittances') as any)
    .select(`
      id, mois, montant_loyer_fcfa, montant_charges_fcfa, montant_total_fcfa,
      date_echeance, date_paiement, statut, pdf_url,
      contrats ( id, bien_id, biens ( titre, commune ) ),
      profiles!locataire_id ( nom_complet, telephone )
    `)
    .eq('proprietaire_id', user.id)
    .order('date_echeance', { ascending: false })
    .limit(50)

  if (filtreActif) {
    query = query.eq('statut', filtreActif)
  }

  const { data: quittances } = await query

  // Stats rapides (calculées avant filtre pour afficher les totaux globaux)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allQuittances } = await (supabase.from('quittances') as any)
    .select('statut')
    .eq('proprietaire_id', user.id)

  const stats = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    total:      (allQuittances ?? []).length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    en_retard:  (allQuittances ?? []).filter((q: any) => q.statut === 'en_retard').length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    en_attente: (allQuittances ?? []).filter((q: any) => q.statut === 'en_attente').length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payee:      (allQuittances ?? []).filter((q: any) => q.statut === 'payee').length,
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Mes Quittances</h1>
      <p className="text-gray-500 mb-6">Suivi des loyers de vos locataires</p>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-yellow-400">
          <p className="text-2xl font-bold text-yellow-600">{stats.en_attente}</p>
          <p className="text-sm text-gray-500">En attente</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-red-500">
          <p className="text-2xl font-bold text-red-600">{stats.en_retard}</p>
          <p className="text-sm text-gray-500">En retard</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-green-500">
          <p className="text-2xl font-bold text-green-600">{stats.payee}</p>
          <p className="text-sm text-gray-500">Payées</p>
        </Card>
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTRES.map(f => (
          <Link
            key={f.value}
            href={`/quittances${f.value === 'tous' ? '' : `?statut=${f.value}`}`}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              (filtreStatut ?? 'tous') === f.value
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Liste quittances */}
      {!quittances || quittances.length === 0 ? (
        <Card className="p-12 text-center text-gray-500">
          <p className="text-lg">Aucune quittance trouvée</p>
          <p className="text-sm mt-2">Les quittances sont générées automatiquement le 1er de chaque mois.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {quittances.map((q: any) => {
            const bien      = q.contrats?.biens as { titre: string; commune: string } | null
            const locataire = q['profiles!locataire_id'] as { nom_complet: string; telephone: string } | null
            const badge     = STATUT_BADGE[q.statut] ?? { variant: 'default' as const, label: q.statut }
            const moisLabel = new Date(q.mois).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

            return (
              <Card key={q.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 capitalize">{moisLabel}</span>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {locataire?.nom_complet ?? 'Locataire'} · {bien?.titre ?? 'Bien'}, {bien?.commune}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Échéance: {new Date(q.date_echeance).toLocaleDateString('fr-FR')}
                    {q.date_paiement && ` · Payé le: ${new Date(q.date_paiement).toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900">{Number(q.montant_total_fcfa).toLocaleString('fr-FR')} FCFA</p>
                  {q.pdf_url && (
                    <a
                      href={q.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Télécharger PDF
                    </a>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
