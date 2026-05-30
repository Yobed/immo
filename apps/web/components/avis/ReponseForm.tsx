'use client'
import { authFetch } from '@/lib/auth-fetch'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface ReponseFormProps {
  avisId: string
}

export function ReponseForm({ avisId }: ReponseFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reponse, setReponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reponse.trim()) return
    setLoading(true)
    setError(null)

    const res = await authFetch(`/api/avis/${avisId}/reponse`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reponse }),
    })

    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Erreur')
      return
    }
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-primary hover:underline pl-2"
      >
        + Répondre à cet avis
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="pl-4 border-l-2 border-primary/30 space-y-2">
      <textarea
        value={reponse}
        onChange={e => setReponse(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Votre réponse..."
        className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        autoFocus
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !reponse.trim()} className="text-sm py-1 px-3">
          {loading ? 'Envoi...' : 'Publier'}
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-[var(--text-muted)] hover:text-white/80"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
