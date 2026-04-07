import { BienForm } from '@/components/bien/BienForm'

export default function NouvelAnnoncePage() {
  return (
    <main className="bg-surface min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="font-display text-3xl text-[var(--text)] mb-8">Créer une annonce</h1>
        <BienForm />
      </div>
    </main>
  )
}
