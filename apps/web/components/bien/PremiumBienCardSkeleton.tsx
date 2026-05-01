'use client'

import { motion } from 'framer-motion'

export function PremiumBienCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="flex flex-col h-full bg-[var(--surface-card)] rounded-[1.5rem] overflow-hidden border border-[var(--border)] animate-pulse">
      {/* 1. Image Section Skeleton */}
      <div className="relative aspect-[4/3] bg-[var(--midnight-muted)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>

      {/* 2. Content Section Skeleton */}
      <div className="flex flex-col p-4 pt-3.5 space-y-3">
        <div className="flex items-center justify-between gap-1">
          <div className="w-16 h-3 bg-[var(--midnight-light)] rounded-full" />
          <div className="w-24 h-4 bg-[var(--midnight-light)] rounded-full" />
        </div>
        
        <div className="space-y-2">
          <div className="w-full h-4 bg-[var(--midnight-light)] rounded-full" />
          <div className="w-3/4 h-4 bg-[var(--midnight-light)] rounded-full" />
        </div>

        <div className="flex items-center gap-4 mt-auto pt-2">
          <div className="w-12 h-3 bg-[var(--midnight-light)] rounded-full" />
          <div className="w-12 h-3 bg-[var(--midnight-light)] rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function PremiumBienListSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-[var(--surface-card)] rounded-[1.5rem] border border-[var(--border)] animate-pulse">
      <div className="w-full md:w-48 aspect-video md:aspect-square bg-[var(--midnight-muted)] rounded-xl" />
      <div className="flex-1 space-y-3 py-1">
        <div className="flex justify-between">
          <div className="w-20 h-3 bg-[var(--midnight-light)] rounded-full" />
          <div className="w-24 h-4 bg-[var(--midnight-light)] rounded-full" />
        </div>
        <div className="w-full h-5 bg-[var(--midnight-light)] rounded-full" />
        <div className="w-2/3 h-3 bg-[var(--midnight-light)] rounded-full" />
        <div className="flex gap-4 pt-4">
          <div className="w-12 h-3 bg-[var(--midnight-light)] rounded-full" />
          <div className="w-12 h-3 bg-[var(--midnight-light)] rounded-full" />
        </div>
      </div>
    </div>
  )
}
