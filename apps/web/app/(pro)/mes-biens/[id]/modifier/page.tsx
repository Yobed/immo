import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { BienForm } from '@/components/bien/BienForm'
import type { BienFormData } from '@/components/bien/BienForm'
import { Step5Medias } from '@/components/bien/BienForm/Step5Medias'

export default async function ModifierBienPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ step?: string }>
}) {
  const { id } = await params
  const { step } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bien } = await (supabase as any)
    .from('biens')
    .select('*')
    .eq('id', id)
    .eq('proprietaire_id', user.id)
    .single()

  if (!bien) notFound()

  return (
    <main className="bg-surface min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="font-display text-3xl text-[var(--text)] mb-8">
          {step === 'medias' ? 'Ajouter des médias' : "Modifier l'annonce"}
        </h1>
        {step === 'medias' ? (
          <Step5Medias bienId={id} />
        ) : (
          <BienForm defaultValues={bien as Partial<BienFormData>} bienId={id} />
        )}
      </div>
    </main>
  )
}
