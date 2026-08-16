'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Loader2, Eye } from 'lucide-react'

interface Props {
  userId: string
  cniPath: string | null
  selfiePath: string | null
  statut: string | null
}

/**
 * Actions KYC en ligne sur la fiche Comptes : ouvre la CNI/selfie via un lien
 * SIGNÉ (bucket privé `kyc`) et valide/rejette via `PATCH /api/kyc` — même
 * mécanisme que le module KYC. Rendu uniquement dans la console admin.
 */
export function KycInlineActions({ userId, cniPath, selfiePath, statut }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [busy, setBusy] = useState<'valider' | 'rejeter' | null>(null)
  const [opening, setOpening] = useState<'cni' | 'selfie' | null>(null)
  const [done, setDone] = useState<'verifie' | 'non_verifie' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function openDoc(kind: 'cni' | 'selfie', path: string | null) {
    if (!path) return
    setOpening(kind)
    setError(null)
    try {
      const { data, error: e } = await supabase.storage.from('kyc').createSignedUrl(path, 3600)
      if (e || !data?.signedUrl) throw new Error(e?.message || 'Lien indisponible')
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’ouvrir la pièce')
    }
    setOpening(null)
  }

  async function act(action: 'valider' | 'rejeter') {
    setBusy(action)
    setError(null)
    const s = action === 'valider' ? 'verifie' : 'non_verifie'
    try {
      const res = await fetch('/api/kyc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, statut: s }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(j.error || 'Erreur lors de la mise à jour')
        setBusy(null)
        return
      }
      setDone(s)
      router.refresh() // rafraîchit les badges de la fiche
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau')
    }
    setBusy(null)
  }

  const btnDoc =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border)] bg-[var(--surface-card)] text-[var(--text)] hover:bg-[var(--surface-hover)] disabled:opacity-40'

  return (
    <div className="space-y-3">
      {/* Voir les pièces (liens signés) */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => openDoc('cni', cniPath)} disabled={!cniPath || opening !== null} className={btnDoc}>
          {opening === 'cni' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />} Voir la CNI
        </button>
        <button type="button" onClick={() => openDoc('selfie', selfiePath)} disabled={!selfiePath || opening !== null} className={btnDoc}>
          {opening === 'selfie' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />} Voir le selfie
        </button>
      </div>

      {/* Décision */}
      {done ? (
        <p className={`text-sm font-bold ${done === 'verifie' ? 'text-emerald-600' : 'text-red-600'}`}>
          {done === 'verifie' ? '✅ KYC validé — enregistré.' : '❌ KYC rejeté — enregistré.'}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => act('valider')}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors"
          >
            {busy === 'valider' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Valider le KYC
          </button>
          <button
            type="button"
            onClick={() => act('rejeter')}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors"
          >
            {busy === 'rejeter' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Rejeter
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      {!done && statut && (
        <p className="text-[11px] text-[var(--text-subtle)]">
          Statut actuel : {statut === 'verifie' ? 'vérifié' : statut === 'en_cours' ? 'à valider' : statut}
        </p>
      )}
    </div>
  )
}
