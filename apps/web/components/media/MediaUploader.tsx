'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { CldUploadWidget } from 'next-cloudinary'
import { createClient } from '@/lib/supabase/client'
import { MediaTypeBadge } from './MediaTypeIcon'
import { cn } from '@/lib/utils'

type MediaType = 'photo' | 'video' | 'vue_360' | 'plan'

interface MediaUploaderProps {
  bienId: string
  type: MediaType
  onUploadComplete: (url: string, type: MediaType) => void
}

const BUCKET_MAP: Record<Exclude<MediaType, 'photo'>, string> = {
  video:   'videos',
  vue_360: 'panoramas',
  plan:    'plans',
}

const ACCEPT_MAP: Record<Exclude<MediaType, 'photo'>, Record<string, string[]>> = {
  video:   { 'video/*': ['.mp4', '.mov', '.avi', '.webm'] },
  vue_360: { 'image/*': ['.jpg', '.jpeg', '.png'] },
  plan:    { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
}

export function MediaUploader({ bienId, type, onUploadComplete }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  // Supabase Storage upload (video, 360, plan)
  const uploadToStorage = useCallback(async (file: File) => {
    setUploading(true)
    setProgress(0)
    const supabase = createClient()
    const bucket = BUCKET_MAP[type as Exclude<MediaType, 'photo'>]
    const path = `${bienId}/${Date.now()}-${file.name}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (error) {
      console.error('Storage upload error:', error)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path)

    // Persist in biens_medias
    await fetch(`/api/biens/${bienId}/medias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, url: publicUrl, ordre: 99 }),
    })

    onUploadComplete(publicUrl, type)
    setUploading(false)
    setProgress(100)
  }, [bienId, type, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPT_MAP[type as Exclude<MediaType, 'photo'>],
    maxFiles: 1,
    onDrop: (files) => { if (files[0]) uploadToStorage(files[0]) },
    disabled: uploading,
  })

  // Photo: use Cloudinary widget
  if (type === 'photo') {
    return (
      <CldUploadWidget
        signatureEndpoint="/api/upload/sign"
        uploadPreset="immo-ci-photos"
        options={{
          maxFiles: 20,
          resourceType: 'image',
          folder: `biens/${bienId}`,
        }}
        onSuccess={async (result) => {
          const info = result.info as { secure_url: string }
          await fetch(`/api/biens/${bienId}/medias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'photo', url: info.secure_url, ordre: 99 }),
          })
          onUploadComplete(info.secure_url, 'photo')
        }}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open()}
            className="w-full p-8 border-2 border-dashed border-primary/40 rounded-card hover:border-primary hover:bg-primary-light/30 transition-colors text-center"
          >
            <p className="text-muted font-sans text-sm">Cliquer pour ajouter des photos</p>
            <p className="text-xs text-muted/70 mt-1">JPG, PNG, WEBP — max 10 MB par photo</p>
          </button>
        )}
      </CldUploadWidget>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'w-full p-8 border-2 border-dashed rounded-card transition-colors text-center cursor-pointer',
        isDragActive ? 'border-primary bg-primary-light/30' : 'border-[var(--border)] hover:border-primary/40',
        uploading && 'opacity-60 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <div className="space-y-2">
          <div className="h-2 bg-[var(--border)] rounded-pill overflow-hidden">
            <div className="h-full bg-primary rounded-pill transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-muted font-sans">Upload en cours...</p>
        </div>
      ) : (
        <>
          <MediaTypeBadge type={type} className="mb-3" />
          <p className="text-muted font-sans text-sm mt-2">
            {isDragActive ? 'Déposer le fichier ici' : `Glisser un fichier ${type === 'vue_360' ? 'panoramique (équirectangulaire)' : type} ici`}
          </p>
          <p className="text-xs text-muted/70 mt-1">
            {type === 'video' ? 'MP4, MOV, WEBM — max 500 MB' : type === 'plan' ? 'PDF ou image — max 20 MB' : 'JPG, PNG — max 50 MB'}
          </p>
        </>
      )}
    </div>
  )
}
