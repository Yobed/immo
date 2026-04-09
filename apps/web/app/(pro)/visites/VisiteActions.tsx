'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { authFetch } from '@/lib/auth-fetch'

interface VisiteActionsProps {
  visiteId: string
}

export function VisiteActions({ visiteId }: VisiteActionsProps) {
  const [loading, setLoading] = useState<'confirmee' | 'annulee' | null>(null)
  const router = useRouter()

  const handleAction = async (statut: 'confirmee' | 'annulee') => {
    setLoading(statut)
    await authFetch('/api/visites', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visite_id: visiteId, statut }),
    })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex gap-2 flex-shrink-0">
      <Button
        size="sm"
        variant="primary"
        loading={loading === 'confirmee'}
        disabled={loading !== null}
        onClick={() => handleAction('confirmee')}
      >
        Confirmer
      </Button>
      <Button
        size="sm"
        variant="danger"
        loading={loading === 'annulee'}
        disabled={loading !== null}
        onClick={() => handleAction('annulee')}
      >
        Refuser
      </Button>
    </div>
  )
}
