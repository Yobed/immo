import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { BienForm } from '@/components/bien/BienForm'
import type { BienFormData } from '@/components/bien/BienForm'

export default async function ModifierBienPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

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
        <h1 className="font-display text-3xl text-[var(--text)] mb-8">Modifier l'annonce</h1>
        <BienForm defaultValues={bien as Partial<BienFormData>} />
      </div>
    </main>
  )
}
