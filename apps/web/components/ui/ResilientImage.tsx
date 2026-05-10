'use client'
import Image from 'next/image'
import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  src: string | null | undefined
  alt: string
  fill?: boolean
  sizes?: string
  className?: string
  fallbackLabel?: string
  unoptimized?: boolean
  priority?: boolean
}

/**
 * Image avec fallback gracieux quand l'URL est cassée.
 * Utilisée pour les photos d'offres flash (URLs externes scrapées) et tout
 * endroit où la source peut disparaître.
 */
export function ResilientImage({
  src,
  alt,
  fill = true,
  sizes,
  className,
  fallbackLabel,
  unoptimized,
  priority,
}: Props) {
  const [errored, setErrored] = useState(false)
  const showFallback = !src || errored

  if (showFallback) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400',
          fill && 'absolute inset-0',
          className
        )}
        aria-label={fallbackLabel || alt}
      >
        <MapPin className="w-8 h-8 opacity-50" strokeWidth={1.5} />
        {fallbackLabel && (
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-2 text-center">
            {fallbackLabel}
          </span>
        )}
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={className}
      onError={() => setErrored(true)}
      unoptimized={unoptimized}
      priority={priority}
    />
  )
}
