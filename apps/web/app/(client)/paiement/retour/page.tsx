import Link from 'next/link'

interface Props {
  searchParams: Promise<{ cpm_trans_id?: string; cpm_error_message?: string }>
}

export default async function PaiementRetourPage({ searchParams: searchParamsPromise }: Props) {
  const searchParams = await searchParamsPromise
  const isSuccess = !searchParams.cpm_error_message ||
                    searchParams.cpm_error_message === ''
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-surface-card rounded-card p-8 max-w-md w-full text-center shadow-sm">
        {isSuccess ? (
          <>
            <div className="text-5xl mb-4">&#10003;</div>
            <h1 className="font-display text-2xl text-primary mb-2">
              Paiement confirmé !
            </h1>
            <p className="text-muted mb-6">
              Votre réservation est confirmée. Un contrat sera généré automatiquement.
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">&#10007;</div>
            <h1 className="font-display text-2xl text-danger mb-2">
              Paiement non abouti
            </h1>
            <p className="text-muted mb-2">
              {searchParams.cpm_error_message ?? 'La transaction a été annulée ou refusée.'}
            </p>
            <p className="text-sm text-muted mb-6">
              Ref. transaction : {searchParams.cpm_trans_id ?? '—'}
            </p>
          </>
        )}
        <Link
          href="/"
          className="inline-block bg-primary text-white px-6 py-2 rounded-btn text-sm font-medium hover:opacity-90"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
