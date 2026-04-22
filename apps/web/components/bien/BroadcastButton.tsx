'use client'

import { useState } from 'react'

interface BroadcastButtonProps {
  bienId: string
  statut: string
}

export function BroadcastButton({ bienId, statut }: BroadcastButtonProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sent?: number; total?: number } | null>(null)

  if (statut !== 'publie') return null

  async function handleBroadcast() {
    if (!confirm('Envoyer un message WhatsApp à tous les clients intéressés par cette zone ?')) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/biens/${bienId}/broadcast`, { method: 'POST' })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ sent: 0 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleBroadcast}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
      >
        {loading ? '...' : '📣 Broadcast WhatsApp'}
      </button>
      {result && (
        <p className="text-center text-[10px] text-emerald-600 font-medium">
          {result.sent ?? 0} message{(result.sent ?? 0) > 1 ? 's' : ''} envoyé{(result.sent ?? 0) > 1 ? 's' : ''}
          {result.total ? ` / ${result.total} clients` : ''}
        </p>
      )}
    </div>
  )
}
