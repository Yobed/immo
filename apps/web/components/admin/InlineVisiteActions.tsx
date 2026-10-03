'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Check, X, Loader2 } from 'lucide-react'
import { validateVisiteAction } from '@/app/admin/suivi/actions'

interface InlineVisiteActionsProps {
  visiteId: string
  status: 'pending' | 'approved' | 'rejected'
}

export function InlineVisiteActions({ visiteId, status }: InlineVisiteActionsProps) {
  const [isPending, startTransition] = useTransition()

  if (status !== 'pending') {
    return null
  }

  const handleApprove = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const fd = new FormData()
    fd.set('visiteId', visiteId)
    fd.set('action', 'approve')
    startTransition(async () => {
      try {
        await validateVisiteAction(fd)
      } catch (err) {
        console.error('Erreur lors de la validation directe:', err)
        alert('Erreur lors de la validation. Vérifiez votre connexion.')
      }
    })
  }

  return (
    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[var(--border)]">
      <button
        type="button"
        disabled={isPending}
        onClick={handleApprove}
        className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
        title="Valider la visite et notifier le propriétaire et le visiteur sur WhatsApp"
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
        <span>{isPending ? 'Validation…' : 'Valider'}</span>
      </button>

      <Link
        href={`/admin/suivi/visites/${visiteId}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors"
        title="Refuser ou voir tous les détails"
      >
        <X className="w-3 h-3" />
        <span>Refuser</span>
      </Link>
    </div>
  )
}
