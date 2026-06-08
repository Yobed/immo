'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Map, { Marker, Popup, NavigationControl, type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_TOKEN, ABIDJAN_CENTER } from '@/lib/mapbox'
import { lookupCommune, jitterAround } from '@/lib/geo/commune-centroids'
import type { ConsolidatedBien } from '@/lib/catalogue/consolidated'
import { Building2, Palmtree, Home, Briefcase, Store, Shovel, Warehouse, BedDouble, MapPin, ShieldCheck, Flame, X } from 'lucide-react'
import { formatFCFACompact } from '@/lib/format'

interface CatalogueMapViewProps {
  items: ConsolidatedBien[]
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  appartement: Building2,
  villa: Palmtree,
  maison: Home,
  studio: Warehouse,
  bureau: Briefcase,
  commerce: Store,
  terrain: Shovel,
  residence_meublee: BedDouble,
}

interface MarkedBien extends ConsolidatedBien {
  _lat: number
  _lng: number
}

/**
 * Vue carte du catalogue. Affiche tous les biens disponibles sur une carte
 * Mapbox centrée sur Abidjan, avec markers personnalisés par type/source
 * et popup au click avec preview du bien.
 *
 * Particularités :
 *  - Quand pas de lat/lng exact, on utilise le centroid de la commune avec
 *    jitter déterministe (positions stables entre re-renders)
 *  - Biens dont la commune n'est pas connue sont skippés (count affiché en bas)
 *  - Markers BOGBE'S vérifiés ont un anneau doré ; flash ont un dot orange
 */
export function CatalogueMapView({ items }: CatalogueMapViewProps) {
  const mapRef = useRef<MapRef | null>(null)
  const [selected, setSelected] = useState<MarkedBien | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  // Résout chaque bien à une position lat/lng exploitable.
  const markedItems: MarkedBien[] = useMemo(() => {
    const out: MarkedBien[] = []
    for (const b of items) {
      const c = lookupCommune(b.commune)
      if (!c) continue // skip si commune inconnue
      const pos = jitterAround(c, b.sourceId)
      out.push({ ...b, _lat: pos.latitude, _lng: pos.longitude })
    }
    return out
  }, [items])

  const skippedCount = items.length - markedItems.length

  // Fit bounds au mount pour voir tous les marqueurs (ou rester sur Abidjan)
  useEffect(() => {
    if (!mapRef.current || markedItems.length === 0) return
    const lats = markedItems.map(m => m._lat)
    const lngs = markedItems.map(m => m._lng)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    // Padding 8% pour ne pas coller aux bords
    mapRef.current.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: 60, duration: 800, maxZoom: 13 },
    )
  }, [markedItems])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl">
        <p className="text-[var(--text-muted)] text-sm">
          La vue carte nécessite une clé Mapbox configurée.
        </p>
      </div>
    )
  }

  if (markedItems.length === 0) {
    return (
      <div className="w-full h-[600px] flex flex-col items-center justify-center bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl gap-2">
        <MapPin className="w-8 h-8 text-[var(--text-muted)] opacity-50" />
        <p className="text-[var(--text-muted)] text-sm">
          Aucun bien localisable pour les filtres actuels.
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[60vh] sm:h-[70vh] lg:h-[75vh] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface-card)]">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: ABIDJAN_CENTER.longitude,
          latitude: ABIDJAN_CENTER.latitude,
          zoom: ABIDJAN_CENTER.zoom,
        }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        attributionControl={false}
        reuseMaps
      >
        <NavigationControl position="top-right" showCompass={false} />

        {markedItems.map((b) => {
          const Icon = TYPE_ICONS[b.type_bien] ?? Home
          const isVerifie = b.source === 'bogbes' && b.is_verifie
          const isHovered = hovered === b.id
          const isSelected = selected?.id === b.id

          return (
            <Marker
              key={b.id}
              longitude={b._lng}
              latitude={b._lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                setSelected(b)
              }}
            >
              <button
                type="button"
                onMouseEnter={() => setHovered(b.id)}
                onMouseLeave={() => setHovered(null)}
                aria-label={b.titre}
                className={`group relative flex flex-col items-center cursor-pointer transition-transform ${
                  isSelected || isHovered ? 'scale-110 z-10' : 'scale-100'
                }`}
              >
                {/* Marker pin */}
                <div
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all
                    ${isVerifie
                      ? 'bg-white ring-2 ring-[var(--accent-luxury)] text-slate-900'
                      : b.source === 'flash'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-900 text-white'
                    }
                    ${isSelected ? 'ring-offset-2 ring-offset-white' : ''}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {/* Petite étoile or sur vérifiés */}
                  {isVerifie && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--accent-luxury)] flex items-center justify-center">
                      <ShieldCheck className="w-2 h-2 text-white" strokeWidth={3} />
                    </span>
                  )}
                  {/* Flame badge sur flash */}
                  {b.source === 'flash' && !isVerifie && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 flex items-center justify-center">
                      <Flame className="w-2 h-2 text-white" strokeWidth={3} />
                    </span>
                  )}
                </div>
                {/* Pointe du pin */}
                <div className={`-mt-1 w-2 h-2 rotate-45 ${
                  isVerifie ? 'bg-white' : b.source === 'flash' ? 'bg-orange-500' : 'bg-slate-900'
                }`} />
              </button>
            </Marker>
          )
        })}

        {/* Popup au click sur marker */}
        {selected && (
          <Popup
            longitude={selected._lng}
            latitude={selected._lat}
            anchor="bottom"
            offset={28}
            onClose={() => setSelected(null)}
            closeButton={false}
            className="bogbes-popup"
            maxWidth="280px"
          >
            <div className="p-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-luxury)]">
                  {selected.type_bien.replace(/_/g, ' ')}
                </p>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Fermer"
                  className="w-5 h-5 -mt-0.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="font-sans font-semibold text-sm text-slate-900 leading-tight line-clamp-2 mb-1">
                {selected.titre}
              </p>
              <p className="text-xs text-slate-600 inline-flex items-center gap-1 mb-2">
                <MapPin className="w-3 h-3" />
                {selected.quartier ? `${selected.quartier} · ` : ''}{selected.commune}
              </p>
              {selected.prix_value && (
                <p className="font-display text-base font-black text-[var(--accent-luxury)] mb-2">
                  {formatFCFACompact(selected.prix_value, true)}
                  {selected.prix_period === 'mois' && <span className="text-xs font-medium opacity-70"> / mois</span>}
                  {selected.prix_period === 'nuit' && <span className="text-xs font-medium opacity-70"> / nuit</span>}
                </p>
              )}
              <Link
                href={selected.source === 'flash' ? `/offre-flash/${selected.sourceId}` : `/biens/${selected.sourceId}`}
                className="block w-full text-center px-3 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-800 transition-colors"
              >
                Voir le bien
              </Link>
            </div>
          </Popup>
        )}
      </Map>

      {/* Légende + compteur de biens non localisés */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/95 backdrop-blur-sm shadow-sm text-slate-900">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-white ring-2 ring-[var(--accent-luxury)]" />
          Vérifié BOGBE&apos;S
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/95 backdrop-blur-sm shadow-sm text-slate-900">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" />
          Offre flash
        </div>
        {skippedCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50/95 backdrop-blur-sm text-amber-900 text-[9px] mt-1">
            <MapPin className="w-2.5 h-2.5" />
            {skippedCount} bien{skippedCount > 1 ? 's' : ''} non localisé{skippedCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* CSS popup custom (Mapbox popup default est moche) */}
      <style jsx global>{`
        .bogbes-popup .mapboxgl-popup-content {
          background: rgb(var(--surface-card) / 1);
          color: rgb(var(--text) / 1);
          border-radius: 12px;
          padding: 10px;
          box-shadow: 0 8px 32px -4px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04);
          background: #ffffff;
          color: #0f172a;
        }
        .bogbes-popup .mapboxgl-popup-tip {
          border-top-color: #ffffff !important;
        }
      `}</style>
    </div>
  )
}
