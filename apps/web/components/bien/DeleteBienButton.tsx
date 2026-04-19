'use client'
import { authFetch } from '@/lib/auth-fetch'
import { Button } from '@/components/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'

interface DeleteBienButtonProps {
  bienId: string
  titre: string
}

export function DeleteBienButton({ bienId, titre }: DeleteBienButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'annonce "${titre}" ?`)) {
      return
    }

    setLoading(true)
    try {
      const res = await authFetch(`/api/biens/${bienId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        alert(`Erreur: ${err.error}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      alert("Une erreur est survenue lors de la suppression.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100 hover:border-red-200"
      type="button"
      loading={loading}
      onClick={handleDelete}
    >
      <Trash2 className="w-4 h-4 mr-2" />
      Supprimer
    </Button>
  )
}
