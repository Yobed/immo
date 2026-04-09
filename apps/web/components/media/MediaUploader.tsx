'use client'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type MediaType = 'photo' | 'video' | 'vue_360' | 'plan'

interface MediaUploaderProps {
  bienId: string
  type: MediaType
  onUploadComplete: (url: string, type: MediaType) => void
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!

const CONFIG: Record<MediaType, {
  resourceType: string
  accept: string
  multiple: boolean
  emoji: string
  hint: string
  size: string
}> = {
  photo:   { resourceType: 'image', accept: 'image/jpg,image/jpeg,image/png,image/webp', multiple: true,  emoji: '🖼️', hint: 'Cliquer pour ajouter des photos',          size: 'JPG, PNG, WEBP — max 10 MB' },
  video:   { resourceType: 'video', accept: 'video/mp4,video/quicktime,video/webm',      multiple: false, emoji: '🎥', hint: 'Cliquer pour ajouter une vidéo',            size: 'MP4, MOV, WEBM — max 500 MB' },
  vue_360: { resourceType: 'image', accept: 'image/jpg,image/jpeg,image/png',            multiple: false, emoji: '🌐', hint: 'Image panoramique équirectangulaire',        size: 'JPG, PNG — max 50 MB' },
  plan:    { resourceType: 'auto',  accept: 'application/pdf,image/jpg,image/jpeg,image/png', multiple: false, emoji: '📐', hint: 'Plan du bien (PDF ou image)',          size: 'PDF, JPG, PNG — max 20 MB' },
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

  const uploadFile = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', 'immo-ci-media')
    fd.append('folder', `biens/${bienId}`)
    fd.append('tags', `${type},${bienId}`)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${cfg.resourceType}/upload`,
      { method: 'POST', body: fd }
    )
    if (!res.ok) throw new Error(`Cloudinary: ${res.status}`)
    const data = await res.json()
    return data.secure_url as string
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
        const url = await uploadFile(arr[i])
        await fetch(`/api/biens/${bienId}/medias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...auth },
          body: JSON.stringify({ type, url, ordre: 99 }),
        })
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
            <div className="text-4xl mb-3">{cfg.emoji}</div>
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
