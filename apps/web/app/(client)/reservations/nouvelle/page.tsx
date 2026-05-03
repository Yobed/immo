import { createClient }     from '@/lib/supabase/server'
import { redirect }          from 'next/navigation'
import { ReservationFlow }   from '@/components/reservation/ReservationFlow'

interface Props {
  searchParams: { bienId?: string }
}

export default async function NouvelleReservationPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const bienId = searchParams.bienId
    const redirectUrl = bienId ? `/reservations/nouvelle?bienId=${bienId}` : '/reservations/nouvelle'
    redirect(`/login?redirect=${encodeURIComponent(redirectUrl)}`)
  }

  const bienId = searchParams.bienId
  if (!bienId) redirect('/')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bien } = await (supabase.from('biens') as any)
    .select('id, titre, commune, type_bien, prix_mois_fcfa, prix_nuit_fcfa')
    .eq('id', bienId)
    .eq('statut', 'publie')
    .single()

  if (!bien) redirect('/')

  const isNuitee = bien.type_bien === 'residence_meublee'

  return (
    <div className="min-h-screen bg-surface py-8 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="font-display text-2xl text-primary mb-2">{bien.titre}</h1>
        <p className="text-muted text-sm mb-6">{bien.commune}</p>
        <ReservationFlow
          bienId={bien.id}
          bienTitre={bien.titre}
          prixMoisFcfa={bien.prix_mois_fcfa ?? 0}
          prixNuitFcfa={isNuitee ? (bien.prix_nuit_fcfa ?? 0) : undefined}
        />
      </div>
    </div>
  )
}
