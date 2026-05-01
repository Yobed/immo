'use client'

import { useState } from 'react'
import { MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  bienId: string
  /** Si l'utilisateur est connecté, on n'a pas besoin de form */
  isAuthenticated: boolean
  className?: string
}

type State =
  | { kind: 'idle' }
  | { kind: 'form' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

export function DemanderContactWhatsAppButton({ bienId, isAuthenticated, className }: Props) {
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [reason, setReason] = useState('')

  async function submit(payload: Record<string, string>) {
    setState({ kind: 'submitting' })
    try {
      const res = await fetch('/api/contact-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bienId, ...payload }),
      })
      const data = await res.json()
      if (!res.ok) {
        setState({ kind: 'error', message: data.error || 'Erreur inconnue' })
        return
      }
      setState({ kind: 'success' })
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Erreur réseau',
      })
    }
  }

  function onClick() {
    if (isAuthenticated) {
      submit({})
    } else {
      setState({ kind: 'form' })
    }
  }

  if (state.kind === 'success') {
    return (
      <div className={`p-4 rounded-xl bg-emerald-50 border border-emerald-200 ${className ?? ''}`}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-emerald-900 text-sm">Demande envoyée ✅</p>
            <p className="text-emerald-700 text-xs mt-1">
              Notre équipe valide votre demande et vous enverra le contact du propriétaire par WhatsApp dans les meilleurs délais.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (state.kind === 'form') {
    return (
      <div className={`p-4 rounded-xl bg-white border border-slate-200 space-y-3 ${className ?? ''}`}>
        <p className="font-bold text-slate-900 text-sm">Pour recevoir le contact :</p>
        <input
          type="text"
          placeholder="Votre nom complet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
        />
        <input
          type="tel"
          placeholder="Votre WhatsApp (+225...)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
        />
        <textarea
          placeholder="Motif (optionnel)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!name.trim() || !phone.trim()}
            onClick={() =>
              submit({
                visitorName: name.trim(),
                visitorPhone: phone.trim(),
                reason: reason.trim(),
              })
            }
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-bold transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Envoyer
          </button>
          <button
            type="button"
            onClick={() => setState({ kind: 'idle' })}
            className="px-4 py-2.5 text-slate-500 hover:text-slate-900 text-sm font-medium"
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className={`p-4 rounded-xl bg-red-50 border border-red-200 ${className ?? ''}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-red-900 text-sm">Erreur</p>
            <p className="text-red-700 text-xs mt-1">{state.message}</p>
            <button
              type="button"
              onClick={() => setState({ kind: 'idle' })}
              className="mt-2 text-red-600 hover:text-red-800 text-xs font-bold underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state.kind === 'submitting' as State['kind']}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${className ?? ''}`}
    >
      <MessageCircle className="w-4 h-4" />
      {state.kind === 'submitting' ? 'Envoi…' : 'Demander le numéro WhatsApp du propriétaire'}
    </button>
  )
}
