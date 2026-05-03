'use client'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, ArrowRight } from 'lucide-react'

export function RecentlyViewed() {
  const { items } = useRecentlyViewed()

  if (items.length === 0) return null

  return (
    <section className="py-12 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-luxury)]/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-[var(--accent-luxury)]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-[var(--text-muted)]">Reprenez où vous étiez</p>
            <h2 className="font-display font-bold text-lg text-[var(--text)] tracking-tight leading-none">
              Vos dernières visites
            </h2>
          </div>
        </div>
        <Link href="/biens" className="flex items-center gap-1.5 text-[var(--accent-luxury)] text-xs font-bold uppercase tracking-widest hover:underline">
          Tout voir <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
        {items.map((bien) => (
          <Link
            key={bien.id}
            href={`/biens/${bien.id}`}
            className="shrink-0 w-[160px] md:w-[200px] group"
          >
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[var(--surface)] mb-2 border border-[var(--border)]">
              {bien.photo_url ? (
                <Image
                  src={bien.photo_url}
                  alt={bien.titre}
                  fill
                  sizes="200px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 bg-[var(--surface)] flex items-center justify-center">
                  <span className="text-[var(--text-muted)] text-xs">Pas de photo</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <span className="absolute bottom-2 left-2 text-white text-[10px] font-bold bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                {bien.prix}
              </span>
            </div>
            <p className="text-[var(--text)] text-xs font-bold truncate leading-tight">{bien.titre}</p>
            <p className="text-[var(--text-muted)] text-[10px] truncate">{bien.commune}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
