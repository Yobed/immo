'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { debloquerN8nAction } from './actions'

export function DebloquerN8nButton() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleUnblock = async () => {
    setLoading(true)
    setStatus('idle')
    setMessage(null)
    try {
      await debloquerN8nAction()
      setStatus('success')
      setMessage('File n8n débloquée avec succès !')
      router.refresh()
      setTimeout(() => {
        setStatus('idle')
        setMessage(null)
      }, 5000)
    } catch (err) {
      setStatus('error')
      setMessage((err as Error).message || 'Erreur lors du déblocage')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={handleUnblock}
        className="min-h-[40px] flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-sm disabled:opacity-50 active:scale-95"
        title="Purger les exécutions zombies (> 5 min) qui bloquent la file de scraping WhatsApp"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        <span>{loading ? 'Déblocage en cours…' : 'Débloquer file n8n'}</span>
      </button>
      {message && (
        <span className={`text-xs flex items-center gap-1 ${status === 'success' ? 'text-emerald-500 font-semibold' : 'text-red-500'}`}>
          {status === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {message}
        </span>
      )}
    </div>
  )
}
