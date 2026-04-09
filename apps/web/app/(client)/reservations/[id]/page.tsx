import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import Link             from 'next/link'
import { PaiementButton } from '@/components/paiements/PaiementButton'

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente de paiement', color: 'text-warning' },
  confirmee:  { label: 'Confirmée',              color: 'text-accent'  },
  annulee:    { label: 'Annulée',                color: 'text-danger'  },
  terminee:   { label: 'Terminée',               color: 'text-muted'   },
}

export default async function ReservationDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reservation } = await (supabase.from('reservations') as any)
    .select(`
      id, date_debut, date_fin, montant_loyer_fcfa, montant_total_fcfa, statut, created_at,
      biens ( titre, commune, adresse_complete ),
      contrats ( pdf_url )
    `)
    .eq('id', params.id)
    .eq('locataire_id', user.id)
    .single()

  if (!reservation) redirect('/reservations')

  const statut     = STATUT_LABELS[reservation.statut] ?? { label: reservation.statut, color: 'text-muted' }
  // contrats is an array (one reservation -> many contrats possible)
  const contrat    = Array.isArray(reservation.contrats) ? reservation.contrats[0] : reservation.contrats
  const pdfUrl     = contrat?.pdf_url ?? null

  return (
    <div className="min-h-screen bg-surface py-8 px-4">
      <div className="max-w-lg mx-auto bg-surface-card rounded-card p-6 shadow-sm space-y-4">
        <h1 className="font-display text-xl text-primary">Détail de la réservation</h1>

        <p className="text-sm text-muted">
          Bien : <span className="text-text font-medium">{reservation.biens?.titre}</span>
        </p>
        <p className="text-sm text-muted">
          {reservation.biens?.commune}
          {reservation.biens?.adresse_complete ? ` — ${reservation.biens.adresse_complete}` : ''}
        </p>
        <p className="text-sm text-muted">
          Du <strong>{reservation.date_debut}</strong> au <strong>{reservation.date_fin}</strong>
        </p>
        <p className="text-lg font-mono font-semibold text-primary">
          {Number(reservation.montant_total_fcfa).toLocaleString('fr-FR')} FCFA
        </p>
        <p className={`font-medium ${statut.color}`}>{statut.label}</p>

        {reservation.statut === 'en_attente' && (
          <PaiementButton
            reservationId={reservation.id}
            montantFcfa={reservation.montant_total_fcfa}
            description={`Reservation : ${reservation.biens?.titre ?? ''}`}
            className="w-full"
          />
        )}

        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-primary text-white px-4 py-2 rounded-btn text-sm font-medium hover:opacity-90"
          >
            Télécharger le contrat PDF
          </a>
        )}

        <Link href="/" className="block text-sm text-muted hover:underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
