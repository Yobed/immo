import { cn } from '@/lib/utils'

type MediaType = 'photo' | 'video' | 'vue_360' | 'plan'

const CONFIG: Record<MediaType, { label: string; color: string }> = {
  photo:   { label: 'Photo',    color: 'bg-accent-light text-accent' },
  video:   { label: 'Vidéo',    color: 'bg-secondary-light text-secondary' },
  vue_360: { label: 'Vue 360°', color: 'bg-purple-100 text-purple-700' },
  plan:    { label: 'Plan',     color: 'bg-primary-light text-primary' },
}

export function MediaTypeBadge({ type, className }: { type: MediaType; className?: string }) {
  const cfg = CONFIG[type] ?? CONFIG.photo
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-pill text-xs font-sans font-medium', cfg.color, className)}>
      {cfg.label}
    </span>
  )
}
