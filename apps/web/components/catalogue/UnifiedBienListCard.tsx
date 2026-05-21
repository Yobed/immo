'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { MapPin, BedDouble, Maximize2, Flame, ShieldCheck, ArrowUpRight } from 'lucide-react'
import { useT } from '@/lib/i18n/client'
import type { ConsolidatedBien } from '@/lib/catalogue/consolidated'

interface Props {
  bien: ConsolidatedBien
  index?: number
}

export function UnifiedBienListCard({ bien, index = 0 }: Props) {
  const t = useT()
  const prefersReduced = useReducedMotion()
  const isFlash = bien.source === 'flash'
  const internalPath = bien.url.replace(process.env.NEXT_PUBLIC_SITE_URL || '', '')

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 16 }}
      whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={prefersReduced ? { duration: 0 } : { duration: 0.5, delay: (index % 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={internalPath}
        className="group flex gap-4 p-3 md:p-4 bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl hover:border-[var(--accent-luxury)]/30 hover:shadow-[0_12px_30px_-15px_rgba(0,0,0,0.2)] transition-all duration-300"
      >
        {/* Image carrée à gauche */}
        <div className="relative w-28 h-28 md:w-40 md:h-40 shrink-0 rounded-xl overflow-hidden bg-[var(--midnight-muted)]">
          {bien.photo_url ? (
            <Image
              src={bien.photo_url}
              alt={bien.titre}
              fill
              sizes="160px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized={isFlash}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20">
              <MapPin className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
          )}

          {/* Badge source (top-left) */}
          {bien.is_verifie ? (
            <span className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-500/95 text-white text-[8px] font-black uppercase tracking-wider shadow">
              <ShieldCheck className="w-2.5 h-2.5" />
              {t.card.verified}
            </span>
          ) : (
            <span className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/95 text-white text-[8px] font-black uppercase tracking-wider shadow">
              <Flame className="w-2.5 h-2.5" />
              Flash
            </span>
          )}
        </div>

        {/* Contenu à droite */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            <span className="inline-block px-2 py-0.5 rounded-full bg-[var(--surface)] text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              {bien.type_bien.replace(/_/g, ' ')}
            </span>
            <h3 className="font-display font-bold text-[14px] md:text-[16px] text-[var(--text)] leading-snug line-clamp-2 mb-1">
              {bien.titre}
            </h3>
            <p className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mb-2">
              <MapPin className="w-3 h-3" />
              {bien.commune}{bien.quartier ? ` · ${bien.quartier}` : ''}
            </p>
          </div>

          <div className="flex items-end justify-between gap-2 mt-auto">
            <div>
              <p className="text-[16px] md:text-[18px] font-display font-bold text-[var(--accent-luxury)] tracking-tight leading-none">
                {bien.prix_label}
              </p>
              {(bien.nb_pieces || bien.surface_m2) && (
                <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--text-muted)] font-bold">
                  {bien.nb_pieces ? (
                    <span className="flex items-center gap-0.5">
                      <BedDouble className="w-3 h-3" />
                      {bien.nb_pieces}
                    </span>
                  ) : null}
                  {bien.surface_m2 ? (
                    <span className="flex items-center gap-0.5">
                      <Maximize2 className="w-3 h-3" />
                      {bien.surface_m2} m²
                    </span>
                  ) : null}
                </div>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-[var(--accent-luxury)]/10 flex items-center justify-center shrink-0 group-hover:bg-[var(--accent-luxury)] group-hover:text-white transition-all text-[var(--accent-luxury)]">
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
