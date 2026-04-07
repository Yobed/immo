import { createClient }     from '@/lib/supabase/server'
import { redirect }          from 'next/navigation'
import { ReservationFlow }   from '@/components/reservation/ReservationFlow'

interface Props {
  searchParams: { bienId?: string }
}

export default async function NouvelleReservationPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const bienId = searchParams.bienId
  if (!bienId) redirect('/')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bien } = await (supabase.from('biens') as any)
    .select('id, titre, commune, prix_mois_fcfa')
    .eq('id', bienId)
    .eq('statut', 'publie')
    .single()

  if (!bien) redirect('/')

  return (
    <div className="min-h-screen bg-surface py-8 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="font-display text-2xl text-primary mb-2">{bien.titre}</h1>
        <p className="text-muted text-sm mb-6">{bien.commune}</p>
        <ReservationFlow
          bienId={bien.id}
          bienTitre={bien.titre}
          prixMoisFcfa={bien.prix_mois_fcfa ?? 0}
        />
      </div>
    </div>
  )
}
