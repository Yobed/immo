'use client'
import { useState, useEffect } from 'react'
import { MediaUploader } from '@/components/media/MediaUploader'
import { MediaSortable } from '@/components/media/MediaSortable'
import { createClient } from '@/lib/supabase/client'

type MediaType = 'photo' | 'video' | 'vue_360' | 'plan'

interface Media {
  id: string
  url: string
  type: MediaType
  titre: string | null
  ordre: number
  est_couverture: boolean
}

interface Step5MediasProps {
  bienId: string
}

export function Step5Medias({ bienId }: Step5MediasProps) {
  const [medias, setMedias] = useState<Media[]>([])
  const [activeType, setActiveType] = useState<MediaType>('photo')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('biens_medias')
      .select('id, url, type, titre, ordre, est_couverture')
      .eq('bien_id', bienId)
      .order('ordre', { ascending: true })
      .then(({ data }) => { if (data) setMedias(data as Media[]) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bienId])

  const handleUploadComplete = (_url: string, _type: MediaType) => {
    // Refresh medialist after upload
    supabase
      .from('biens_medias')
      .select('id, url, type, titre, ordre, est_couverture')
      .eq('bien_id', bienId)
      .order('ordre', { ascending: true })
      .then(({ data }) => { if (data) setMedias(data as Media[]) })
  }

  const tabs: { type: MediaType; label: string }[] = [
    { type: 'photo',   label: 'Photos' },
    { type: 'video',   label: 'Vidéo' },
    { type: 'vue_360', label: 'Vue 360°' },
    { type: 'plan',    label: 'Plans' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl text-[var(--text)]">Médias du bien</h2>

      {/* Onglets type */}
      <div className="flex gap-2 border-b border-[var(--border)]">
        {tabs.map((tab) => (
          <button
            key={tab.type}
            type="button"
            onClick={() => setActiveType(tab.type)}
            className={`px-4 py-2 text-sm font-sans border-b-2 transition-colors ${
              activeType === tab.type
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted hover:text-[var(--text)]'
            }`}
          >
            {tab.label}
            <span className="ml-1 text-xs text-muted">
              ({medias.filter((m) => m.type === tab.type).length})
            </span>
          </button>
        ))}
      </div>

      {/* Uploader */}
      <MediaUploader
        bienId={bienId}
        type={activeType}
        onUploadComplete={handleUploadComplete}
      />

      {/* Liste ordonnée */}
      {medias.length > 0 && (
        <div>
          <h3 className="font-sans font-medium text-sm text-muted mb-3 uppercase tracking-wide">
            Médias uploadés ({medias.length}) — glisser pour réordonner
          </h3>
          <MediaSortable bienId={bienId} initialMedias={medias} />
        </div>
      )}
    </div>
  )
}
