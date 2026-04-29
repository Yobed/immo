'use client'
import React, { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type MediaType = 'photo' | 'video' | 'vue_360' | 'plan'

interface MediaUploaderProps {
  bienId: string
  type: MediaType
  onUploadComplete: (url: string, type: MediaType) => void
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
  photo:   { resourceType: 'image', accept: 'image/jpg,image/jpeg,image/png,image/webp', multiple: true,  hint: 'Cliquer pour ajouter des photos',          size: 'JPG, PNG, WEBP — max 10 MB' },
  video:   { resourceType: 'video', accept: 'video/mp4,video/quicktime,video/webm',      multiple: false, hint: 'Cliquer pour ajouter une vidéo',            size: 'MP4, MOV, WEBM — max 500 MB' },
  vue_360: { resourceType: 'image', accept: 'image/jpg,image/jpeg,image/png',            multiple: false, hint: 'Image panoramique équirectangulaire',        size: 'JPG, PNG — max 50 MB' },
  plan:    { resourceType: 'auto',  accept: 'application/pdf,image/jpg,image/jpeg,image/png', multiple: false, hint: 'Plan du bien (PDF ou image)',          size: 'PDF, JPG, PNG — max 20 MB' },
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

export function MediaUploader({ bienId, type, onUploadComplete }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const cfg = CONFIG[type]

  const uploadFile = async (file: File, auth: Record<string, string>) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)

    const res = await fetch(`/api/biens/${bienId}/upload`, {
      method: 'POST',
      headers: auth,
      body: fd,
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`Upload ${res.status}: ${errText.slice(0, 120)}`)
    }
    const data = await res.json() as { url: string }
    return data.url
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)
    setProgress(0)

    const arr = Array.from(files)
    const auth = await getAuthHeader()

    for (let i = 0; i < arr.length; i++) {
      try {
        const url = await uploadFile(arr[i], auth)
        onUploadComplete(url, type)
        setProgress(Math.round(((i + 1) / arr.length) * 100))
      } catch (e) {
        setError(String(e))
      }
    }

    setUploading(false)
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
            <p className="text-sm text-muted font-sans">Upload en cours… {progress}%</p>
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
