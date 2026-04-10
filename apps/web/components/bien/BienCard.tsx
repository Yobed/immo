import Link from 'next/link'
import Image from 'next/image'
import { TYPES_BIEN_LABELS } from '@immo-ci/shared/constants/biens'

interface BienCardProps {
  id: string
  titre: string
  commune: string
  quartier?: string | null
  type_bien: string
  prix_mois_fcfa: number | null
  prix_nuit_fcfa?: number | null
  prix_vente_fcfa: number | null
  surface_m2: number | null
  nb_pieces: number | null
  photo_url?: string | null
  statut?: string
}

function formatFCFA(n: number): string {
  return new Intl.NumberFormat('fr-CI', { style: 'decimal', maximumFractionDigits: 0 }).format(n)
}

const TYPE_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  villa:             { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-400' },
  appartement:       { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-400' },
  studio:            { bg: 'bg-cyan-50',    text: 'text-cyan-700',    dot: 'bg-cyan-400' },
  maison:            { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-400' },
  residence_meublee: { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  bureau:            { bg: 'bg-slate-50',   text: 'text-slate-600',   dot: 'bg-slate-400' },
  commerce:          { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  terrain:           { bg: 'bg-lime-50',    text: 'text-lime-700',    dot: 'bg-lime-500' },
}

export function BienCard({
  id, titre, commune, quartier, type_bien,
  prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa,
  surface_m2, nb_pieces, photo_url, statut,
}: BienCardProps) {
  const isNuitee = !!prix_nuit_fcfa
  const prix = isNuitee
    ? { value: formatFCFA(prix_nuit_fcfa!), suffix: '/nuit' }
    : prix_mois_fcfa
    ? { value: formatFCFA(prix_mois_fcfa), suffix: '/mois' }
    : prix_vente_fcfa
    ? { value: formatFCFA(prix_vente_fcfa), suffix: '' }
    : null

  const typeConf = TYPE_CONFIG[type_bien] ?? { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' }

  return (
    <Link href={`/biens/${id}`} className="block group h-full">
      <article
        className="bg-white rounded-[18px] overflow-hidden border border-[var(--border)] card-lift h-full flex flex-col"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        {/* ── Photo ── */}
        <div className="relative aspect-[4/3] bg-[var(--surface)] img-zoom-wrap overflow-hidden">
          {photo_url ? (
            <Image
              src={photo_url}
              alt={titre}
              fill
              className="object-cover img-zoom"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-[var(--primary-light)] to-[var(--surface)]">
              <svg width="44" height="44" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" fill="none" className="text-[var(--primary)]/25">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <p className="text-xs font-sans text-[var(--text-muted)]/60">Aucune photo</p>
            </div>
          )}

          {/* Gradient overlay bas */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

          {/* Type badge — haut gauche */}
          <div className="absolute top-3 left-3">
            <span className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-sans font-medium
              badge-glow ${typeConf.bg} ${typeConf.text}
            `}>
              <span className={`w-1.5 h-1.5 rounded-full ${typeConf.dot}`} />
              {TYPES_BIEN_LABELS[type_bien] ?? type_bien}
            </span>
          </div>

          {/* Statut brouillon */}
          {statut === 'brouillon' && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-sans font-medium bg-[var(--warning)]/90 text-white badge-glow">
                Brouillon
              </span>
            </div>
          )}

          {/* Prix — bas gauche avec style or */}
          {prix && (
            <div className="absolute bottom-3 left-3">
              <div className="flex items-baseline gap-1 px-3 py-1.5 rounded-pill bg-white/95 backdrop-blur-sm badge-glow">
                <span className="font-mono text-sm font-bold text-[var(--primary)]">
                  {prix.value}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-sans">
                  FCFA{prix.suffix}
                </span>
              </div>
            </div>
          )}

          {/* Favori placeholder haut droite si pas brouillon */}
          {statut !== 'brouillon' && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="w-8 h-8 rounded-full glass flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* ── Infos ── */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-sans font-semibold text-[var(--text)] text-sm leading-snug line-clamp-2 mb-2 group-hover:text-[var(--primary)] transition-colors duration-200">
            {titre}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-sans mb-3.5">
            <svg width="11" height="11" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none" className="flex-shrink-0 text-[var(--secondary)]">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="line-clamp-1">
              {quartier ? `${quartier}, ` : ''}{commune}
            </span>
          </div>

          {/* Stats */}
          {(surface_m2 || nb_pieces) && (
            <div className="flex items-center gap-4 pt-3 border-t border-[var(--border)] mt-auto">
              {surface_m2 && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-sans">
                  <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-[var(--primary)]/50">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18M9 21V9"/>
                  </svg>
                  <span className="font-medium text-[var(--text)]">{surface_m2}</span>
                  <span>m²</span>
                </div>
              )}
              {nb_pieces && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-sans">
                  <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-[var(--primary)]/50">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  </svg>
                  <span className="font-medium text-[var(--text)]">{nb_pieces}</span>
                  <span>pièce{nb_pieces > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
