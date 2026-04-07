'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { KYCStatusBadge } from './KYCStatusBadge'
import { cn } from '@/lib/utils'

type KYCStatut = 'non_verifie' | 'en_cours' | 'verifie'

interface KYCUploaderProps {
  userId: string
  currentStatut: KYCStatut
}

export function KYCUploader({ userId, currentStatut }: KYCUploaderProps) {
  const [cniUrl, setCniUrl] = useState<string | null>(null)
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null)
  const [uploadingCni, setUploadingCni] = useState(false)
  const [uploadingSelfie, setUploadingSelfie] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadToKycBucket = useCallback(async (
    file: File,
    type: 'cni' | 'selfie',
    setUploading: (v: boolean) => void,
    setUrl: (url: string) => void
  ) => {
    setUploading(true)
    setError(null)
    const supabase = createClient()
    const path = `${userId}/${Date.now()}-${type}.jpg`

    const { data, error: uploadError } = await supabase.storage
      .from('kyc')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      setError(`Erreur upload ${type}: ${uploadError.message}`)
      setUploading(false)
      return
    }

    // Bucket 'kyc' est privé — on stocke le path (pas une URL publique)
    setUrl(data.path)
    setUploading(false)
  }, [userId])

  const onDropCni = useCallback((files: File[]) => {
    if (files[0]) {
      uploadToKycBucket(files[0], 'cni', setUploadingCni, setCniUrl)
    }
  }, [uploadToKycBucket])

  const onDropSelfie = useCallback((files: File[]) => {
    if (files[0]) {
      uploadToKycBucket(files[0], 'selfie', setUploadingSelfie, setSelfieUrl)
    }
  }, [uploadToKycBucket])

  const { getRootProps: getCniProps, getInputProps: getCniInput, isDragActive: isCniDrag } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxFiles: 1,
    onDrop: onDropCni,
    disabled: uploadingCni || !!cniUrl,
  })

  const { getRootProps: getSelfieProps, getInputProps: getSelfieInput, isDragActive: isSelfieDrag } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxFiles: 1,
    onDrop: onDropSelfie,
    disabled: uploadingSelfie || !!selfieUrl,
  })

  const handleSubmit = async () => {
    if (!cniUrl || !selfieUrl) return
    setError(null)

    const res = await fetch('/api/kyc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cniUrl, selfieUrl }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? 'Erreur lors de la soumission')
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-card p-4 text-sm font-sans text-yellow-800">
        Documents soumis — vérification en cours (2-3 jours ouvrés)
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="font-sans text-sm text-[var(--text-muted)]">Statut actuel :</span>
        <KYCStatusBadge statut={currentStatut} />
      </div>

      <p className="font-sans text-sm text-[var(--text-muted)]">
        Pour valider votre identité, veuillez uploader votre CNI (recto) et un selfie tenant votre CNI.
        Les fichiers sont stockés de manière sécurisée et privée.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-card p-3 text-sm text-red-700 font-sans">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CNI Dropzone */}
        <div className="space-y-2">
          <label className="block font-sans text-sm font-medium text-[var(--text)]">
            CNI (recto)
          </label>
          {cniUrl ? (
            <div className="p-4 border-2 border-accent rounded-card bg-accent-light/20 text-center">
              <p className="text-sm font-sans text-accent font-medium">✓ CNI uploadée</p>
              <button
                type="button"
                onClick={() => setCniUrl(null)}
                className="text-xs text-muted underline mt-1"
              >
                Changer
              </button>
            </div>
          ) : (
            <div
              {...getCniProps()}
              className={cn(
                'w-full p-6 border-2 border-dashed rounded-card transition-colors text-center cursor-pointer',
                isCniDrag
                  ? 'border-primary bg-primary-light/30'
                  : 'border-[var(--border)] hover:border-primary/40',
                uploadingCni && 'opacity-60 cursor-not-allowed'
              )}
            >
              <input {...getCniInput()} />
              {uploadingCni ? (
                <p className="text-sm text-muted font-sans">Upload en cours...</p>
              ) : (
                <>
                  <p className="text-muted font-sans text-sm">
                    {isCniDrag ? 'Déposer ici' : 'Glisser votre CNI ou cliquer'}
                  </p>
                  <p className="text-xs text-muted/70 mt-1">JPG, PNG — max 10 MB</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Selfie Dropzone */}
        <div className="space-y-2">
          <label className="block font-sans text-sm font-medium text-[var(--text)]">
            Selfie avec CNI
          </label>
          {selfieUrl ? (
            <div className="p-4 border-2 border-accent rounded-card bg-accent-light/20 text-center">
              <p className="text-sm font-sans text-accent font-medium">✓ Selfie uploadé</p>
              <button
                type="button"
                onClick={() => setSelfieUrl(null)}
                className="text-xs text-muted underline mt-1"
              >
                Changer
              </button>
            </div>
          ) : (
            <div
              {...getSelfieProps()}
              className={cn(
                'w-full p-6 border-2 border-dashed rounded-card transition-colors text-center cursor-pointer',
                isSelfieDrag
                  ? 'border-primary bg-primary-light/30'
                  : 'border-[var(--border)] hover:border-primary/40',
                uploadingSelfie && 'opacity-60 cursor-not-allowed'
              )}
            >
              <input {...getSelfieInput()} />
              {uploadingSelfie ? (
                <p className="text-sm text-muted font-sans">Upload en cours...</p>
              ) : (
                <>
                  <p className="text-muted font-sans text-sm">
                    {isSelfieDrag ? 'Déposer ici' : 'Glisser votre selfie ou cliquer'}
                  </p>
                  <p className="text-xs text-muted/70 mt-1">JPG, PNG — max 10 MB</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!cniUrl || !selfieUrl}
        className={cn(
          'w-full py-3 rounded-btn font-sans text-sm font-medium transition-colors',
          cniUrl && selfieUrl
            ? 'bg-primary text-white hover:bg-primary/90'
            : 'bg-[var(--border)] text-muted cursor-not-allowed'
        )}
      >
        Soumettre mes documents KYC
      </button>
    </div>
  )
}
