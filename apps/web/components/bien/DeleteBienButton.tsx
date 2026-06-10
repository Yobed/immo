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
        const err = await res.json().catch(() => ({}))
        alert(`Erreur lors de la suppression : ${err.error || res.statusText}`)
        setLoading(false)
        return
      }
      // Succès : on redirige vers la liste des biens (la fiche n'existe plus)
      router.push('/mes-biens')
      router.refresh()
    } catch (err) {
      alert(`Erreur réseau : ${err instanceof Error ? err.message : 'connexion impossible'}`)
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
