'use client'
import { useEffect, useState, useCallback } from 'react'

export type RecentBien = {
  id: string
  titre: string
  commune: string
  type_bien: string
  prix: string
  photo_url: string | null
  viewedAt: number
}

const KEY = 'bgp_recently_viewed'
const MAX = 6

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentBien[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [])

  const track = useCallback((bien: Omit<RecentBien, 'viewedAt'>) => {
    setItems(prev => {
      const filtered = prev.filter(b => b.id !== bien.id)
      const updated = [{ ...bien, viewedAt: Date.now() }, ...filtered].slice(0, MAX)
      try { localStorage.setItem(KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [])

  return { items, track }
}
