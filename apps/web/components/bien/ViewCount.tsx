'use client'
import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import { useT } from '@/lib/i18n/client'

interface Props {
  bienId: string
  /** Source : 'bien' (BOGBE'S) ou 'flash' (offre flash scrapée) */
  source?: 'bien' | 'flash'
  className?: string
}

/**
 * Affiche le nombre de vues du bien sur les 7 derniers jours.
 * Ping l'API en POST (fire-and-forget) et récupère le compteur.
 */
export function ViewCount({ bienId, source = 'bien', className = '' }: Props) {
  const [count, setCount] = useState<number | null>(null)
  const t = useT()

  useEffect(() => {
    let cancelled = false
    const endpoint =
      source === 'flash'
        ? `/api/offre-flash/${bienId}/view`
        : `/api/biens/${bienId}/view`
    fetch(endpoint, { method: 'GET' })
      .then((r) => r.json())
      .then((data: { count?: number }) => {
        if (!cancelled && typeof data?.count === 'number') {
          setCount(data.count)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [bienId, source])

  if (count === null || count < 3) return null

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold uppercase tracking-wider ${className}`}
      title="Vues sur les 7 derniers jours"
    >
      <Eye className="w-3 h-3" />
      <span>{count} {t.bien.weekViews}</span>
    </div>
  )
}
