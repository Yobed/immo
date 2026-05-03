'use client'
import { useEffect } from 'react'
import { useRecentlyViewed, type RecentBien } from '@/hooks/useRecentlyViewed'

export function TrackView(props: Omit<RecentBien, 'viewedAt'>) {
  const { track } = useRecentlyViewed()
  useEffect(() => { track(props) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
