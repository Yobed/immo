'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'

interface ContactProprietaireButtonProps {
  bienId: string
  proprietaireId: string
  userId: string | null
}

export function ContactProprietaireButton({ bienId, proprietaireId, userId }: ContactProprietaireButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleContact = async () => {
    if (!userId) {
      router.push('/login')
      return
    }

    setLoading(true)
    try {
      // Upsert conversation — onConflict ensures one conversation per pair + bien
      const { data, error } = await supabase
        .from('conversations')
        .upsert(
          {
            participant_1: userId,
            participant_2: proprietaireId,
            bien_id: bienId,
          },
          { onConflict: 'participant_1,participant_2,bien_id' }
        )
        .select('id')
        .single()

      if (error) throw error
      router.push(`/messages?conv=${data.id}`)
    } catch {
      // Fallback: navigate to messages without pre-selected conversation
      router.push('/messages')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleContact}
      loading={loading}
      className="w-full"
    >
      Contacter le propriétaire
    </Button>
  )
}
