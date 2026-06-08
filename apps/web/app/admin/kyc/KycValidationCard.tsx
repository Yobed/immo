'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Loader2, User, Mail, Phone, Eye, Calendar } from 'lucide-react'

interface KycProfile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string | null
  kyc_statut: string
  kyc_cni_url: string | null
  kyc_selfie_url: string | null
  created_at: string
}

interface KycValidationCardProps {
  profile: KycProfile
}

/**
 * Carte de validation KYC pour un utilisateur :
 * - Affiche les infos profil + photos CNI/selfie (signed URLs)
 * - Boutons "Valider" / "Rejeter" qui appellent /api/kyc (PATCH)
 *
 * Sécurité : utilise signedUrl pour le bucket privé kyc (path = userId/...)
 */
export function KycValidationCard({ profile }: KycValidationCardProps) {
  const [cniUrl, setCniUrl] = useState<string | null>(null)
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<'valider' | 'rejeter' | null>(null)
  const [done, setDone] = useState<'verifie' | 'non_verifie' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Génère les signed URLs pour visualiser les photos KYC (bucket privé)
  useEffect(() => {
    async function loadSignedUrls() {
      setLoading(true)
      try {
        if (profile.kyc_cni_url) {
          const { data } = await supabase.storage
            .from('kyc')
            .createSignedUrl(profile.kyc_cni_url, 3600)
          if (data?.signedUrl) setCniUrl(data.signedUrl)
        }
        if (profile.kyc_selfie_url) {
          const { data } = await supabase.storage
            .from('kyc')
            .createSignedUrl(profile.kyc_selfie_url, 3600)
          if (data?.signedUrl) setSelfieUrl(data.signedUrl)
        }
      } catch (e) {
        console.error('[KYC] signedUrl error:', e)
      }
      setLoading(false)
    }
    loadSignedUrls()
  }, [profile.kyc_cni_url, profile.kyc_selfie_url, supabase])

  async function handleAction(action: 'valider' | 'rejeter') {
    setSubmitting(action)
    setError(null)
    const statut = action === 'valider' ? 'verifie' : 'non_verifie'

    try {
      const res = await fetch('/api/kyc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, statut }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Erreur lors de la mise à jour')
        setSubmitting(null)
        return
      }
      setDone(statut as 'verifie' | 'non_verifie')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau')
    }
    setSubmitting(null)
  }

  const submittedAt = new Date(profile.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  if (done) {
    return (
      <div
        className={`p-5 rounded-2xl border ${
          done === 'verifie'
            ? 'bg-emerald-50/40 border-emerald-200 text-emerald-900'
            : 'bg-red-50/40 border-red-200 text-red-900'
        }`}
      >
        <p className="text-sm font-bold inline-flex items-center gap-2">
          {done === 'verifie' ? (
            <>
              <Check className="w-4 h-4" />
              {profile.full_name || profile.email} — vérifié ✓
            </>
          ) : (
            <>
              <X className="w-4 h-4" />
              {profile.full_name || profile.email} — rejeté
            </>
          )}
        </p>
      </div>
    )
  }

  return (
    <article className="p-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border)] hover:border-amber-400/40 transition-colors">
      {/* Header — identité */}
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold text-[var(--text)] truncate">
            {profile.full_name || 'Sans nom renseigné'}
          </p>
          <div className="mt-1 space-y-0.5 text-xs text-[var(--text-muted)]">
            <p className="inline-flex items-center gap-1.5">
              <Mail className="w-3 h-3" />
              {profile.email || '—'}
            </p>
            {profile.phone && (
              <p className="inline-flex items-center gap-1.5">
                <Phone className="w-3 h-3" />
                {profile.phone}
              </p>
            )}
            <p className="inline-flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              Soumis le {submittedAt}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-amber-500/10 text-amber-700 border border-amber-500/20 shrink-0">
          {profile.role || 'rôle?'}
        </span>
      </header>

      {/* Photos */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <KycPhotoCard
          label="CNI"
          url={cniUrl}
          loading={loading}
          missing={!profile.kyc_cni_url}
        />
        <KycPhotoCard
          label="Selfie + CNI"
          url={selfieUrl}
          loading={loading}
          missing={!profile.kyc_selfie_url}
        />
      </div>

      {/* Actions */}
      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleAction('rejeter')}
          disabled={!!submitting}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-bold hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          {submitting === 'rejeter' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
          Rejeter
        </button>
        <button
          type="button"
          onClick={() => handleAction('valider')}
          disabled={!!submitting || (!profile.kyc_cni_url && !profile.kyc_selfie_url)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {submitting === 'valider' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Valider l&apos;identité
        </button>
      </div>
    </article>
  )
}

interface KycPhotoCardProps {
  label: string
  url: string | null
  loading: boolean
  missing: boolean
}

function KycPhotoCard({ label, url, loading, missing }: KycPhotoCardProps) {
  return (
    <div className="relative">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
        {label}
      </p>
      <div className="aspect-[4/3] rounded-lg border border-[var(--border)] bg-slate-100 dark:bg-slate-800/60 overflow-hidden flex items-center justify-center">
        {missing ? (
          <div className="text-center text-[var(--text-subtle)] p-3">
            <User className="w-6 h-6 mx-auto mb-1 opacity-40" />
            <p className="text-[10px]">Non fourni</p>
          </div>
        ) : loading ? (
          <Loader2 className="w-5 h-5 text-[var(--text-muted)] animate-spin" />
        ) : url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full relative group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Eye className="w-5 h-5 text-white" />
            </div>
          </a>
        ) : (
          <p className="text-[10px] text-red-600">Erreur chargement</p>
        )}
      </div>
    </div>
  )
}
