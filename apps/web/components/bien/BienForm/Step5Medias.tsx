'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MediaUploader } from '@/components/media/MediaUploader'
import { MediaSortable } from '@/components/media/MediaSortable'
import { createClient } from '@/lib/supabase/client'
import { authFetch } from '@/lib/auth-fetch'

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
  const [publishing, setPublishing] = useState(false)
  const router = useRouter()
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

  const handlePublish = async () => {
    setPublishing(true)
    // L'annonce part en validation admin (en_attente) avant d'être publiée.
    await authFetch(`/api/biens/${bienId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'en_attente' }),
    })
    setPublishing(false)
    router.push('/mes-biens?soumis=1')
  }

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
                ? 'border-[var(--accent-luxury)] text-[var(--accent-luxury)] font-medium'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {tab.label}
            <span className="ml-1 text-xs text-[var(--text-muted)]">
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
          <h3 className="font-sans font-medium text-sm text-[var(--text-muted)] mb-3 uppercase tracking-wide">
            Médias uploadés ({medias.length}) — glisser pour réordonner
          </h3>
          {/* key force le remontage du composant quand la liste change (useState interne) */}
          <MediaSortable key={medias.map((m) => m.id).join(',')} bienId={bienId} initialMedias={medias} />
        </div>
      )}

      {/* Actions de fin */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => router.push('/mes-biens')}
          className="flex-1 py-3 px-6 rounded-btn border border-[var(--border)] font-sans text-sm text-[var(--text)] hover:border-primary/40 transition-colors"
        >
          Enregistrer en brouillon
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing}
          className="flex-1 py-3 px-6 rounded-btn bg-primary text-white font-sans font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {publishing ? 'Envoi…' : 'Soumettre à validation'}
        </button>
      </div>
    </div>
  )
}
