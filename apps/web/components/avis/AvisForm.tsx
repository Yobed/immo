'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StarRating } from './StarRating'
import { Button } from '@/components/ui/Button'

interface AvisFormProps {
  reservationId: string
  cibleId: string
  cibleNom: string
  onSuccess?: () => void
}

export function AvisForm({ reservationId, cibleId, cibleNom, onSuccess }: AvisFormProps) {
  const router = useRouter()
  const [note, setNote] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (note === 0) {
      setError('Veuillez sélectionner une note')
      return
    }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/avis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId, cibleId, note, commentaire }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      if (res.status === 409) {
        setError('Vous avez déjà noté ce séjour')
      } else {
        setError(data.error ?? 'Erreur lors de la soumission')
      }
      return
    }

    setSubmitted(true)
    onSuccess?.()
    router.refresh()
  }

  if (submitted) {
    return (
      <div className="p-4 bg-green-50 rounded-lg text-green-700 text-sm font-medium">
        Votre avis a été envoyé. Merci !
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="font-semibold text-gray-900">Évaluer {cibleNom}</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Note *</label>
        <StarRating value={note} onChange={setNote} size="lg" />
      </div>

      <div>
        <label htmlFor="commentaire" className="block text-sm font-medium text-gray-700 mb-1">
          Commentaire (optionnel)
        </label>
        <textarea
          id="commentaire"
          value={commentaire}
          onChange={e => setCommentaire(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Décrivez votre expérience..."
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-xs text-gray-400 text-right">{commentaire.length}/500</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading || note === 0} className="w-full">
        {loading ? 'Envoi...' : 'Publier mon avis'}
      </Button>
    </form>
  )
}
