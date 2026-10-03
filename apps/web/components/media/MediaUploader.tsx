'use client'
import React, { useRef, useState } from 'react'
import { authFetch } from '@/lib/auth-fetch'

type MediaType = 'photo' | 'video' | 'vue_360' | 'plan'

interface MediaUploaderProps {
  bienId: string
  type: MediaType
  onUploadComplete: (url: string, type: MediaType) => void
  onUploadingChange?: (uploading: boolean) => void
}

const MEDIA_ICONS: Record<MediaType, React.ReactNode> = {
  photo: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/40">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  video: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/40">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  ),
  vue_360: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/40">
      <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
    </svg>
  ),
  plan: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/40">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
}

const CONFIG: Record<MediaType, {
  resourceType: string
  accept: string
  multiple: boolean
  hint: string
  size: string
}> = {
  photo:   { resourceType: 'image', accept: 'image/jpg,image/jpeg,image/png,image/webp,image/heic,image/heif,image/*', multiple: true,  hint: 'Cliquer ou glisser pour ajouter des photos', size: 'JPG, PNG, WEBP, HEIC — max 20 MB par photo' },
  video:   { resourceType: 'video', accept: 'video/mp4,video/quicktime,video/webm,video/x-matroska,video/3gpp,video/*', multiple: true,  hint: 'Cliquer ou glisser pour ajouter une vidéo',  size: 'MP4, MOV, WEBM — max 100 MB' },
  vue_360: { resourceType: 'image', accept: 'image/jpg,image/jpeg,image/png,image/webp',                                multiple: false, hint: 'Image panoramique équirectangulaire',        size: 'JPG, PNG, WEBP — max 50 MB' },
  plan:    { resourceType: 'auto',  accept: 'application/pdf,image/jpg,image/jpeg,image/png,image/webp',                multiple: false, hint: 'Plan du bien (PDF ou image)',                size: 'PDF, JPG, PNG — max 20 MB' },
}

interface SignedUploadResponse {
  cloudinary: {
    uploadUrl: string
    apiKey: string
    timestamp: number
    signature: string
    folder: string
    publicId: string
    resourceType: 'image' | 'video' | 'raw'
  } | null
  supabase: {
    signedUrl: string
    token: string
    path: string
    publicUrl: string
    contentType: string
  } | null
  error?: string
}

function xhrUploadToCloudinary(
  file: File,
  params: NonNullable<SignedUploadResponse['cloudinary']>,
  onProgress: (pct: number) => void,
): Promise<{ url: string; duration?: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const fd = new FormData()
    fd.append('file', file)
    fd.append('api_key', params.apiKey)
    fd.append('timestamp', String(params.timestamp))
    fd.append('signature', params.signature)
    fd.append('folder', params.folder)
    fd.append('public_id', params.publicId)

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && evt.total > 0) {
        onProgress(Math.min(95, Math.round((evt.loaded / evt.total) * 95)))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText) as { secure_url?: string; duration?: number }
          if (json.secure_url) {
            resolve({
              url: json.secure_url,
              duration: typeof json.duration === 'number' ? Math.round(json.duration) : undefined,
            })
            return
          }
        } catch {
          // ignore parse error below
        }
      }
      reject(new Error(`Cloudinary HTTP ${xhr.status}: ${xhr.responseText?.slice(0, 120) || 'erreur'}`))
    }
    xhr.onerror = () => reject(new Error('Erreur réseau vers Cloudinary'))
    xhr.ontimeout = () => reject(new Error('Délai dépassé vers Cloudinary'))
    xhr.timeout = 5 * 60 * 1000
    xhr.open('POST', params.uploadUrl, true)
    xhr.send(fd)
  })
}

function xhrUploadToSupabaseSignedUrl(
  file: File,
  params: NonNullable<SignedUploadResponse['supabase']>,
  onProgress: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && evt.total > 0) {
        onProgress(Math.min(95, Math.round((evt.loaded / evt.total) * 95)))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(params.publicUrl)
      } else {
        reject(new Error(`Supabase Storage HTTP ${xhr.status}: ${xhr.responseText?.slice(0, 120) || 'erreur'}`))
      }
    }
    xhr.onerror = () => reject(new Error('Erreur réseau vers Supabase Storage'))
    xhr.ontimeout = () => reject(new Error('Délai dépassé vers Supabase Storage'))
    xhr.timeout = 5 * 60 * 1000
    xhr.open('PUT', params.signedUrl, true)
    xhr.setRequestHeader('Content-Type', params.contentType || file.type || 'application/octet-stream')
    xhr.send(file)
  })
}

export function MediaUploader({ bienId, type, onUploadComplete, onUploadingChange }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFileLabel, setCurrentFileLabel] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const cfg = CONFIG[type]

  const updateUploading = (val: boolean) => {
    setUploading(val)
    onUploadingChange?.(val)
  }

  const uploadSingleFile = async (file: File, onFileProgress: (pct: number) => void): Promise<string> => {
    // 1. Demander une URL signée (requête JSON < 1 KB -> ne déclenche jamais la limite 4.5 MB de Vercel)
    const signRes = await authFetch(`/api/biens/${bienId}/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        mime: file.type,
        size: file.size,
        filename: file.name,
      }),
    })

    if (signRes.ok) {
      const signed = (await signRes.json()) as SignedUploadResponse
      let uploadedUrl: string | null = null
      let durationSec: number | undefined
      const directErrors: string[] = []

      // 1a. Upload direct navigateur -> Cloudinary
      if (signed.cloudinary) {
        try {
          const r = await xhrUploadToCloudinary(file, signed.cloudinary, onFileProgress)
          uploadedUrl = r.url
          durationSec = r.duration
        } catch (e) {
          directErrors.push((e as Error).message)
        }
      }

      // 1b. Fallback direct navigateur -> Supabase Storage
      if (!uploadedUrl && signed.supabase) {
        try {
          uploadedUrl = await xhrUploadToSupabaseSignedUrl(file, signed.supabase, onFileProgress)
        } catch (e) {
          directErrors.push((e as Error).message)
        }
      }

      // 1c. Enregistrer le média dans biens_medias
      if (uploadedUrl) {
        onFileProgress(98)
        const saveRes = await authFetch(`/api/biens/${bienId}/medias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: uploadedUrl,
            type,
            titre: file.name.replace(/\.[^/.]+$/, '').slice(0, 120) || null,
            ...(durationSec ? { duree_sec: durationSec } : {}),
          }),
        })
        if (!saveRes.ok) {
          const errBody = await saveRes.text().catch(() => '')
          throw new Error(`Enregistrement média échoué (${saveRes.status}): ${errBody.slice(0, 120)}`)
        }
        onFileProgress(100)
        return uploadedUrl
      }

      // Si le fichier dépasse 4.4 MB et que les uploads directs ont échoué, remonter l'erreur directe
      if (file.size > 4.4 * 1024 * 1024 && directErrors.length > 0) {
        throw new Error(`Échec de l'envoi direct (${directErrors.join(' | ')})`)
      }
    } else {
      const signErr = await signRes.json().catch(() => ({ error: `HTTP ${signRes.status}` }))
      if (signRes.status === 401 || signRes.status === 403 || signRes.status === 413 || signRes.status === 415) {
        throw new Error(signErr.error || `Erreur ${signRes.status}`)
      }
    }

    // 2. Fallback serveur (/api/biens/[id]/upload) pour les petits fichiers (< 4.4 MB)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)

    const res = await authFetch(`/api/biens/${bienId}/upload`, {
      method: 'POST',
      body: fd,
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`Upload ${res.status}: ${errText.slice(0, 120)}`)
    }
    const data = (await res.json()) as { url: string }
    onFileProgress(100)
    return data.url
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    updateUploading(true)
    setError(null)
    setProgress(0)

    const arr = Array.from(files)
    const errors: string[] = []

    for (let i = 0; i < arr.length; i++) {
      const file = arr[i]
      setCurrentFileLabel(`${file.name} (${i + 1}/${arr.length})`)
      try {
        const url = await uploadSingleFile(file, (filePct) => {
          const overall = Math.round(((i * 100 + filePct) / arr.length))
          setProgress(overall)
        })
        onUploadComplete(url, type)
      } catch (e) {
        errors.push(`${file.name}: ${(e as Error).message || String(e)}`)
      }
    }

    if (errors.length > 0) {
      setError(errors.join(' • '))
    }
    setCurrentFileLabel('')
    updateUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={cfg.accept}
        multiple={cfg.multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!uploading && e.dataTransfer?.files?.length) {
            handleFiles(e.dataTransfer.files)
          }
        }}
        className="w-full p-10 border-2 border-dashed border-primary/40 rounded-card hover:border-primary hover:bg-primary-light/20 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <div className="space-y-3">
            <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted font-sans">
              Upload en cours… {progress}% {currentFileLabel ? `— ${currentFileLabel}` : ''}
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-3">{MEDIA_ICONS[type]}</div>
            <p className="text-[var(--text)] font-sans font-medium text-sm">{cfg.hint}</p>
            <p className="text-xs text-muted mt-2">{cfg.size}</p>
          </>
        )}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600 font-sans">{error}</p>
      )}
    </div>
  )
}
