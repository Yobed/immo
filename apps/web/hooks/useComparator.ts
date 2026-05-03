'use client'
import { useState, useCallback, useEffect } from 'react'

export type CompareBien = {
  id: string
  titre: string
  commune: string
  type_bien: string
  prix: string
  surface_m2: number | null
  nb_pieces: number | null
  photo_url: string | null
  is_verifie: boolean
}

const KEY = 'bgp_compare'
const MAX = 3

export function useComparator() {
  const [selected, setSelected] = useState<CompareBien[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setSelected(JSON.parse(raw))
    } catch {}
  }, [])

  const save = (items: CompareBien[]) => {
    setSelected(items)
    try { localStorage.setItem(KEY, JSON.stringify(items)) } catch {}
  }

  const toggle = useCallback((bien: CompareBien) => {
    setSelected(prev => {
      const exists = prev.find(b => b.id === bien.id)
      const updated = exists
        ? prev.filter(b => b.id !== bien.id)
        : prev.length < MAX ? [...prev, bien] : prev
      try { localStorage.setItem(KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [])

  const clear = useCallback(() => save([]), [])

  const isSelected = useCallback((id: string) => selected.some(b => b.id === id), [selected])

  return { selected, toggle, clear, isSelected, isFull: selected.length >= MAX }
}
