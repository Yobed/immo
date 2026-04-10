'use client'
import { useState, useCallback } from 'react'
import { authFetch } from '@/lib/auth-fetch'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MediaTypeBadge } from './MediaTypeIcon'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface MediaItem {
  id: string
  url: string
  type: 'photo' | 'video' | 'vue_360' | 'plan'
  titre?: string | null
  ordre: number
  est_couverture: boolean
}

function SortableMediaItem({
  media,
  onDelete,
  onSetCover,
}: {
  media: MediaItem
  onDelete: (id: string) => void
  onSetCover: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: media.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 bg-white rounded-card border border-[var(--border)] select-none',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      {/* Drag handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted/50 hover:text-muted">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M3 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM3 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM3 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
        </svg>
      </div>

      {/* Thumbnail */}
      {media.type === 'photo' || media.type === 'vue_360' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media.url} alt="" className="w-16 h-12 object-cover rounded-btn flex-shrink-0" />
      ) : (
        <div className="w-16 h-12 bg-[var(--surface)] rounded-btn flex items-center justify-center flex-shrink-0">
          <MediaTypeBadge type={media.type} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <MediaTypeBadge type={media.type} />
        {media.titre && <p className="text-xs text-muted mt-1 truncate">{media.titre}</p>}
        {media.est_couverture && <span className="text-xs text-accent font-medium">Photo couverture</span>}
      </div>

      <div className="flex gap-1 flex-shrink-0">
        {media.type === 'photo' && !media.est_couverture && (
          <Button variant="outline" size="sm" type="button" onClick={() => onSetCover(media.id)}>
            Couverture
          </Button>
        )}
        <Button variant="danger" size="sm" type="button" onClick={() => onDelete(media.id)}>
          <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </Button>
      </div>
    </div>
  )
}

interface MediaSortableProps {
  bienId: string
  initialMedias: MediaItem[]
}


export function MediaSortable({ bienId, initialMedias }: MediaSortableProps) {
  const [items, setItems] = useState(initialMedias)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((m) => m.id === active.id)
    const newIndex = items.findIndex((m) => m.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)

    // Persiste le nouvel ordre
    await authFetch(`/api/biens/${bienId}/medias`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updates: reordered.map((m, i) => ({ id: m.id, ordre: i })),
      }),
    })
  }, [items, bienId])

  const handleDelete = useCallback(async (mediaId: string) => {
    await authFetch(`/api/biens/${bienId}/medias`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId }),
    })
    setItems((prev) => prev.filter((m) => m.id !== mediaId))
  }, [bienId])

  const handleSetCover = useCallback(async (mediaId: string) => {
    await authFetch(`/api/biens/${bienId}/medias`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ couverture_id: mediaId }),
    })
    setItems((prev) =>
      prev.map((m) => ({ ...m, est_couverture: m.id === mediaId }))
    )
  }, [bienId])

  if (items.length === 0) {
    return <p className="text-center text-muted font-sans text-sm py-4">Aucun média uploadé</p>
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((m) => m.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((media) => (
            <SortableMediaItem
              key={media.id}
              media={media}
              onDelete={handleDelete}
              onSetCover={handleSetCover}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
