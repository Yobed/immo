'use client'
import { authFetch } from '@/lib/auth-fetch'
import { Button } from '@/components/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ToggleStatutButtonProps {
  bienId: string
  statut: string
}

export function ToggleStatutButton({ bienId, statut }: ToggleStatutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Publié ou déjà en attente → on peut le retirer (repasser en brouillon).
  // Sinon (brouillon / refusé) → on (re)soumet à validation admin (en_attente).
  const isLiveOrPending = statut === 'publie' || statut === 'en_attente'
  const target = isLiveOrPending ? 'brouillon' : 'en_attente'
  const label = isLiveOrPending
    ? 'Retirer'
    : statut === 'refuse'
      ? 'Resoumettre'
      : 'Soumettre'

  const handleToggle = async () => {
    setLoading(true)
    try {
      await authFetch(`/api/biens/${bienId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: target }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={isLiveOrPending ? 'secondary' : 'primary'}
      size="sm"
      className="w-full"
      type="button"
      loading={loading}
      onClick={handleToggle}
    >
      {label}
    </Button>
  )
}
