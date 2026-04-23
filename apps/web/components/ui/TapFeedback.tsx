'use client'
import { useEffect } from 'react'

export function TapFeedback() {
  useEffect(() => {
    let active: HTMLElement | null = null

    const press = (e: TouchEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(
        'a, button, [role="button"]'
      )
      if (!el) return
      active = el
      el.style.transition = 'transform 80ms ease, filter 80ms ease'
      el.style.transform = 'scale(0.96)'
      el.style.filter = 'brightness(0.88)'
      if ('vibrate' in navigator) navigator.vibrate(8)
    }

    const release = () => {
      if (!active) return
      active.style.transform = ''
      active.style.filter = ''
      active = null
    }

    document.addEventListener('touchstart', press, { passive: true })
    document.addEventListener('touchend', release, { passive: true })
    document.addEventListener('touchcancel', release, { passive: true })

    return () => {
      document.removeEventListener('touchstart', press)
      document.removeEventListener('touchend', release)
      document.removeEventListener('touchcancel', release)
    }
  }, [])

  return null
}
