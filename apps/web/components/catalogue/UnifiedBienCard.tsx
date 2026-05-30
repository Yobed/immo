'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { MapPin, BedDouble, Maximize2, Flame, ShieldCheck, Radio, Clock } from 'lucide-react'
import { useT } from '@/lib/i18n/client'
import type { ConsolidatedBien } from '@/lib/catalogue/consolidated'

interface Props {
  bien: ConsolidatedBien
  index?: number
}

function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso).getTime()
  if (isNaN(d)) return ''
  const diff = Date.now() - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export function UnifiedBienCard({ bien, index = 0 }: Props) {
  const t = useT()
  const prefersReduced = useReducedMotion()
  const isFlash = bien.source === 'flash'

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={prefersReduced ? { duration: 0 } : { duration: 0.4, delay: (index % 4) * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="group relative h-full @container/card"
    >
      <Link
        // Lien relatif explicite vers la fiche source (évite tout problème
        // de mismatch env entre client/server). flash → /offre-flash/<id>,
        // bogbes → /biens/<uuid>.
        href={bien.source === 'flash' ? `/offre-flash/${bien.sourceId}` : `/biens/${bien.sourceId}`}
        className="flex flex-col h-full bg-[var(--surface-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-accent-luxury/40 hover:shadow-md transition-all duration-300"
      >
        {/* Image — ratio 4:3 (au lieu de 4:5) → 25% plus court */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--midnight-muted)]">
          {bien.photo_url ? (
            <Image
              src={bien.photo_url}
              alt={bien.titre}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              unoptimized={isFlash}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-25">
              <MapPin className="w-7 h-7 text-[var(--text-muted)]" />
            </div>
          )}

          {/* Gradient bottom — plus discret */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />

          {/* Top-left : type bien (icône + label compact) */}
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/55 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider">
            {bien.type_bien.replace(/_/g, ' ').slice(0, 12)}
          </span>

          {/* Top-right : badge source — pictogramme uniquement.
              Vérifié → bouclier ; offre flash → flamme ; bien enregistré non
              encore validé → horloge « En validation » (ne PAS le confondre
              avec une offre flash). */}
          {bien.is_verifie ? (
            <span
              className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white shadow-md"
              title={t.card.verified}
            >
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
            </span>
          ) : isFlash ? (
            <span
              className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[8px] font-black uppercase tracking-wider shadow-md"
              title={t.flash.tag}
            >
              <Flame className="w-2.5 h-2.5" strokeWidth={2.5} />
              Flash
            </span>
          ) : bien.is_pending ? (
            <span
              className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-500/90 text-white text-[8px] font-black uppercase tracking-wider shadow-md"
              title="En cours de validation par notre équipe"
            >
              <Clock className="w-2.5 h-2.5" strokeWidth={2.5} />
              En validation
            </span>
          ) : null}

          {/* Bottom : ville + badges temps (très compact) */}
          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-end justify-between gap-1.5">
            <span className="text-white text-[10px] font-bold uppercase tracking-wide drop-shadow-sm">
              {bien.commune}
            </span>
            {bien.is_recent && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/90 text-white text-[8px] font-bold uppercase">
                <span className="w-1 h-1 bg-[var(--surface-card)] rounded-full animate-pulse" />
                {t.common.new}
              </span>
            )}
          </div>
        </div>

        {/* Body — padding et typo scalent avec la largeur du container parent
            (sidebar = compact 12px, grille large = 14-16px). */}
        <div className="flex flex-col flex-1 p-2.5 @[260px]/card:p-3.5 @[340px]/card:p-4">
          <h3 className="font-sans font-semibold text-[12px] @[260px]/card:text-[13px] @[340px]/card:text-[14px] text-[var(--text)] leading-tight line-clamp-2 mb-1.5 min-h-[2.4em]">
            {bien.titre}
          </h3>
          <p className="text-[13px] @[260px]/card:text-[15px] @[340px]/card:text-[17px] font-display font-bold text-[var(--accent-luxury)] tracking-tight mb-1.5 leading-none">
            {bien.prix_label}
          </p>

          {(bien.nb_pieces || bien.surface_m2 || bien.date_scraping) && (
            <div className="flex items-center gap-2 mt-auto pt-1.5 border-t border-border/30 text-[9px] text-[var(--text-muted)]">
              {bien.nb_pieces ? (
                <div className="flex items-center gap-0.5">
                  <BedDouble className="w-2.5 h-2.5" />
                  <span className="font-semibold">{bien.nb_pieces}</span>
                </div>
              ) : null}
              {bien.surface_m2 ? (
                <div className="flex items-center gap-0.5">
                  <Maximize2 className="w-2.5 h-2.5" />
                  <span className="font-semibold">{bien.surface_m2}m²</span>
                </div>
              ) : null}
              {bien.date_scraping && isFlash && (
                <div
                  className="flex items-center gap-0.5 ml-auto text-emerald-600"
                  title="Mise à jour récente"
                >
                  <Radio className="w-2.5 h-2.5" />
                  <span className="font-medium">{relativeTime(bien.date_scraping)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
