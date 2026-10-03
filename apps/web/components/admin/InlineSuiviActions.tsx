'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Check, X, Loader2 } from 'lucide-react'
import {
  validateVisiteAction,
  validateReservationAction,
  validateContactAction,
} from '@/app/admin/suivi/actions'

interface InlineSuiviActionsProps {
  entityId: string
  entityType: 'visite' | 'reservation' | 'contact'
  status: 'pending' | 'approved' | 'rejected'
  detailUrl: string
}

export function InlineSuiviActions({
  entityId,
  entityType,
  status,
  detailUrl,
}: InlineSuiviActionsProps) {
  const [isPending, startTransition] = useTransition()

  if (status !== 'pending') {
    return null
  }

  const handleApprove = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.set('action', 'approve')

        if (entityType === 'visite') {
          fd.set('visiteId', entityId)
          await validateVisiteAction(fd)
        } else if (entityType === 'reservation') {
          fd.set('reservationId', entityId)
          await validateReservationAction(fd)
        } else {
          fd.set('contactId', entityId)
          await validateContactAction(fd)
        }
      } catch (err) {
        console.error(`Erreur validation directe ${entityType}:`, err)
        alert('Erreur lors de la validation. Vérifiez votre connexion.')
      }
    })
  }

  return (
    <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-[var(--border)]">
      <button
        type="button"
        disabled={isPending}
        onClick={handleApprove}
        className="flex-1 min-h-[36px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all shadow-sm"
        title="Approuver directement et déclencher les notifications automatiques"
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        <span>{isPending ? 'Validation…' : 'Valider'}</span>
      </button>

      <Link
        href={detailUrl}
        onClick={(e) => e.stopPropagation()}
        className="min-h-[36px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors"
        title="Refuser ou consulter tous les détails"
      >
        <X className="w-3.5 h-3.5" />
        <span>Refuser</span>
      </Link>
    </div>
  )
}
