import { MapPin, Home, Building2, Palmtree, Briefcase, Store, Shovel, Warehouse, BedDouble, Info } from 'lucide-react'
import { getStaticMapUrl } from '@/lib/mapbox-static'
import { getCommuneCoords, hasKnownCoords } from '@/lib/commune-coords'

/**
 * Placeholder visuel honnête pour les offres flash sans photo.
 *
 * Principe : ne JAMAIS afficher une image stock générique qui créerait
 * une fausse attente. À la place :
 *  1. Une map du quartier en arrière-plan (visualisation spatiale = la 2e
 *     info la plus puissante après le visuel intérieur).
 *  2. Une carte d'identité minimaliste qui montre exactement ce qu'on sait.
 *  3. Un disclaimer clair : "Photos non disponibles, position approximative".
 *
 * L'absence de photo devient un signal de transparence, pas un défaut.
 *
 * Variant :
 *   - 'card'  : affichage compact (utilisé dans la grille)
 *   - 'hero'  : affichage pleine page (utilisé sur la fiche détail)
 */

type IconType = React.ComponentType<{ className?: string }>

const TYPE_ICONS: Record<string, IconType> = {
  appartement: Building2,
  villa: Palmtree,
  maison: Home,
  studio: Warehouse,
  bureau: Briefcase,
  commerce: Store,
  terrain: Shovel,
  residence_meublee: BedDouble,
}

function getTypeIcon(typeBien: string): IconType {
  return TYPE_ICONS[typeBien] ?? Home
}

interface FlashPlaceholderProps {
  typeBien: string
  commune: string
  quartier?: string | null
  variant?: 'card' | 'hero'
}

export function FlashPlaceholder({
  typeBien,
  commune,
  quartier,
  variant = 'card',
}: FlashPlaceholderProps) {
  const Icon = getTypeIcon(typeBien)
  const typeLabel = typeBien.replace(/_/g, ' ')
  const lieu = [quartier, commune].filter(Boolean).join(' · ')

  const coords = getCommuneCoords(commune, quartier)
  const knownLocation = hasKnownCoords(commune, quartier)

  if (variant === 'hero') {
    const mapUrl = getStaticMapUrl({
      lat: coords.lat,
      lng: coords.lng,
      zoom: knownLocation ? 14 : 11,
      width: 1200,
      height: 600,
      pin: knownLocation ? { color: 'f97316', size: 'l' } : false,
    })

    return (
      <div className="absolute inset-0 overflow-hidden bg-slate-100">
        {/* Map en arrière-plan, ou gradient sobre si pas de token Mapbox */}
        {mapUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mapUrl}
            alt={`Carte de ${lieu || 'la zone'}`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
        )}

        {/* Overlay sombre pour lisibilité de l'info par-dessus la map */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-slate-900/40 to-slate-900/85" />

        {/* Contenu en bas — type + lieu + disclaimer */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 md:p-8 text-white">
          <div className="flex items-end justify-between gap-3 max-w-3xl">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-md shrink-0">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <p className="font-display text-lg sm:text-2xl md:text-3xl font-bold capitalize tracking-tight truncate">
                  {typeLabel}
                </p>
              </div>
              {lieu && (
                <p className="inline-flex items-center gap-1 text-sm sm:text-base text-white/90">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">{lieu}</span>
                </p>
              )}
            </div>
          </div>

          {/* Disclaimer compact */}
          <div className="mt-4 inline-flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/95 text-amber-950 max-w-md backdrop-blur-sm">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div className="text-[11px] sm:text-xs leading-snug">
              <strong className="block mb-0.5">Photos non disponibles · Position approximative</strong>
              Annonce sans média (groupe WhatsApp public). Notre conseiller peut solliciter les photos auprès du propriétaire.
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Variant 'card' (compact pour la grille) — map en background + overlay sobre
  const cardMapUrl = getStaticMapUrl({
    lat: coords.lat,
    lng: coords.lng,
    zoom: knownLocation ? 13 : 11,
    width: 400,
    height: 300,
    pin: knownLocation ? { color: 'f97316', size: 's' } : false,
  })

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-100">
      {cardMapUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cardMapUrl}
          alt={`Carte de ${lieu || 'la zone'}`}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
      )}

      {/* Overlay sombre pour lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-slate-900/30 to-slate-900/80" />

      <div className="absolute inset-x-0 bottom-0 p-2.5 text-white">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-white text-slate-900 flex items-center justify-center shadow-sm shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xs font-bold capitalize truncate">
              {typeLabel}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-white/70 font-semibold">
              Sans photo
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
