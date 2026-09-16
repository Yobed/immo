'use client'

import { useState, useTransition } from 'react'
import { Send, Check, AlertCircle, Loader2 } from 'lucide-react'
import { inviteProspectAction, inviteEligibleProspectsAction } from '@/app/actions/outreach'

interface InviteSingleButtonProps {
  prospectId: string
  disabled?: boolean
  label?: string
}

export function InviteSingleButton({ prospectId, disabled = false, label = 'Inviter' }: InviteSingleButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleInvite = () => {
    startTransition(async () => {
      try {
        const res = await inviteProspectAction(prospectId)
        if (res.ok) {
          setStatus('success')
        } else {
          setStatus('error')
          setErrorMessage(res.reason || 'Erreur')
        }
      } catch (e) {
        setStatus('error')
        setErrorMessage(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
        <Check className="w-3.5 h-3.5" /> Envoyé
      </span>
    )
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        disabled={disabled || isPending}
        onClick={handleInvite}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--surface-hover)] text-[var(--text)] hover:bg-[var(--accent-luxury)] hover:text-white border border-[var(--border)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={disabled ? 'Non éligible ou cooldown actif' : 'Envoyer une invitation WhatsApp'}
      >
        {isPending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Send className="w-3 h-3" />
        )}
        <span>{label}</span>
      </button>
      {status === 'error' && errorMessage && (
        <span className="text-[10px] text-red-500 inline-flex items-center gap-0.5" title={errorMessage}>
          <AlertCircle className="w-3 h-3" /> {errorMessage}
        </span>
      )}
    </div>
  )
}

export function BatchInviteButton({ pendingCount }: { pendingCount: number }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  const handleBatch = () => {
    if (!confirm(`Envoyer une invitation WhatsApp aux démarcheurs éligibles en attente (jusqu'à 10) ?`)) return
    startTransition(async () => {
      try {
        const res = await inviteEligibleProspectsAction(10)
        setResult(`${res.sentCount} invitation(s) envoyée(s)`)
      } catch (err) {
        setResult(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  if (pendingCount === 0) return null

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={handleBatch}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent-luxury)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        <span>Inviter les éligibles ({pendingCount})</span>
      </button>
      {result && <span className="text-xs font-semibold text-[var(--text-muted)]">{result}</span>}
    </div>
  )
}
