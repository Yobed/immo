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

const TYPE_COLORS: Record<string, string> = {
  villa:             'bg-purple-100 text-purple-700',
  appartement:       'bg-blue-100 text-blue-700',
  studio:            'bg-cyan-100 text-cyan-700',
  maison:            'bg-orange-100 text-orange-700',
  residence_meublee: 'bg-amber-100 text-amber-700',
  bureau:            'bg-gray-100 text-gray-700',
  commerce:          'bg-green-100 text-green-700',
  terrain:           'bg-lime-100 text-lime-700',
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

  const typeColor = TYPE_COLORS[type_bien] ?? 'bg-gray-100 text-gray-700'

  return (
    <Link href={`/biens/${id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden border border-[var(--border)] hover:border-primary/30 hover:shadow-lg transition-all duration-200">

        {/* Photo */}
        <div className="relative aspect-[4/3] bg-[var(--surface)] overflow-hidden">
          {photo_url ? (
            <Image
              src={photo_url}
              alt={titre}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted/40">
              <svg width="40" height="40" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <p className="text-xs font-sans">Aucune photo</p>
            </div>
          )}

          {/* Overlay gradient bas */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {/* Type badge */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-sans font-medium shadow-sm ${typeColor}`}>
              {TYPES_BIEN_LABELS[type_bien] ?? type_bien}
            </span>
          </div>

          {/* Statut brouillon */}
          {statut === 'brouillon' && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-sans font-medium bg-warning/90 text-white shadow-sm">
                Brouillon
              </span>
            </div>
          )}

          {/* Prix en bas de l'image */}
          {prix && (
            <div className="absolute bottom-3 left-3">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-sm">
                <span className="font-mono text-sm font-bold text-primary">
                  {prix.value}
                </span>
                <span className="text-xs text-muted font-sans"> FCFA{prix.suffix}</span>
              </div>
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="p-4">
          <h3 className="font-sans font-semibold text-[var(--text)] text-sm line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
            {titre}
          </h3>

          <div className="flex items-center gap-1 text-xs text-muted font-sans mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="flex-shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="line-clamp-1">{quartier ? `${quartier}, ` : ''}{commune}</span>
          </div>

          {/* Stats */}
          {(surface_m2 || nb_pieces) && (
            <div className="flex items-center gap-3 pt-3 border-t border-[var(--border)]">
              {surface_m2 && (
                <div className="flex items-center gap-1 text-xs text-muted font-sans">
                  <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                  <span>{surface_m2} m²</span>
                </div>
              )}
              {nb_pieces && (
                <div className="flex items-center gap-1 text-xs text-muted font-sans">
                  <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                  <span>{nb_pieces} pièce{nb_pieces > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
