'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (note: number) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_MAP = { sm: 16, md: 20, lg: 28 }

export function StarRating({ value, onChange, size = 'md', className }: StarRatingProps) {
  const [hovered, setHovered] = useState<number>(0)
  const readonly = !onChange
  const starSize = SIZE_MAP[size]
  const display = hovered > 0 ? hovered : value

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role={readonly ? 'img' : 'radiogroup'}
      aria-label={`Note: ${value} sur 5`}
    >
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn(
            'transition-transform',
            !readonly && 'hover:scale-110 cursor-pointer',
            readonly && 'cursor-default'
          )}
          aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
        >
          <svg
            width={starSize}
            height={starSize}
            viewBox="0 0 24 24"
            fill={star <= display ? '#E67E22' : 'none'}
            stroke={star <= display ? '#E67E22' : '#D1D5DB'}
            strokeWidth={1.5}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
      {!readonly && value > 0 && (
        <span className="ml-2 text-sm font-medium text-white/80">{value}/5</span>
      )}
    </div>
  )
}
