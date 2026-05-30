'use client'

import { Camera, Play, RotateCcw, Box } from 'lucide-react'
import { ShortsTrigger } from './ShortsTrigger'

interface VideoItem {
  id: string
  url: string
  titre?: string
}

interface MediaNavBarProps {
  photoCount: number
  videoMedias: VideoItem[]
  has360: boolean
  has3D: boolean
  bienTitre: string
  bienCommune: string
  prixFormatted: string
  bienId: string
}

export function MediaNavBar({
  photoCount,
  videoMedias,
  has360,
  has3D,
  bienTitre,
  bienCommune,
  prixFormatted,
  bienId,
}: MediaNavBarProps) {
  const pillClass =
    'flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] text-[11px] font-semibold whitespace-nowrap hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-all shrink-0'

  const hasAny = photoCount > 0 || videoMedias.length > 0 || has360 || has3D
  if (!hasAny) return null

  return (
    <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-0.5">
      {photoCount > 0 && (
        <button className={pillClass} aria-label="Voir les photos">
          <Camera className="w-3.5 h-3.5 text-accent-luxury" />
          {photoCount} photo{photoCount > 1 ? 's' : ''}
        </button>
      )}

      {videoMedias.length > 0 && (
        <ShortsTrigger
          videos={videoMedias.map(v => ({
            id: v.id,
            url: v.url,
            title: bienTitre,
            price: prixFormatted,
            location: bienCommune,
            propertyId: bienId,
          }))}
          className="!p-0 !bg-transparent !border-0 !rounded-none !shadow-none !tracking-normal !font-sans !text-base"
        >
          <span className={pillClass}>
            <Play className="w-3.5 h-3.5 fill-accent-luxury text-accent-luxury" />
            {videoMedias.length} vidéo{videoMedias.length > 1 ? 's' : ''}
          </span>
        </ShortsTrigger>
      )}

      {(has360 || has3D) && (
        <a href="#visite-3d" className={pillClass}>
          <RotateCcw className="w-3.5 h-3.5 text-accent-luxury" />
          {has3D && has360 ? 'Visite 3D & 360°' : has3D ? 'Visite 3D' : 'Vue 360°'}
        </a>
      )}
    </div>
  )
}
