'use client'
import { useEffect, useState } from 'react'
import { useRecentlyViewed, type RecentBien } from '@/hooks/useRecentlyViewed'

export function TrackView(props: Omit<RecentBien, 'viewedAt'>) {
  const { track } = useRecentlyViewed()
  const [viewCount, setViewCount] = useState<number>(0)

  useEffect(() => {
    track(props)

    fetch(`/api/biens/${props.id}/view`, { method: 'POST' })
      .then((res) => res.json())
      .then((data: { count: number }) => setViewCount(data.count))
      .catch(() => {}) // fire-and-forget, never block render
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (viewCount < 5) return null

  return (
    <span className="fixed top-4 right-20 z-[110] bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full">
      👁 {viewCount} vues cette semaine
    </span>
  )
}
