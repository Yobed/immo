'use client'
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

  const handleToggle = async () => {
    setLoading(true)
    try {
      await fetch(`/api/biens/${bienId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: statut === 'publie' ? 'brouillon' : 'publie' }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={statut === 'publie' ? 'secondary' : 'primary'}
      size="sm"
      className="w-full"
      type="button"
      loading={loading}
      onClick={handleToggle}
    >
      {statut === 'publie' ? 'Dépublier' : 'Publier'}
    </Button>
  )
}
