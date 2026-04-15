'use client'
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { MAPBOX_TOKEN, ABIDJAN_CENTER } from '@/lib/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import Map, { Marker, Popup } from 'react-map-gl/mapbox'

export interface BienMarker {
  id: string
  titre: string
  commune: string
  quartier: string | null
  type_bien: string
  latitude: number | null
  longitude: number | null
  prix_mois_fcfa: number | null
  prix_nuit_fcfa: number | null
  prix_vente_fcfa: number | null
  photo_url?: string | null
}

const TYPE_LABELS: Record<string, string> = {
  appartement: 'Appartement',
  maison: 'Maison',
  villa: 'Villa',
  studio: 'Studio',
  bureau: 'Bureau',
  commerce: 'Commerce',
  terrain: 'Terrain',
  residence_meublee: 'Résidence meublée',
}

function formatFCFA(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M FCFA`
  if (n >= 1_000) return `${Math.round(n / 1_000)} k FCFA`
  return `${n} FCFA`
}

function getPrix(b: BienMarker): { label: string; suffix: string } | null {
  if (b.prix_nuit_fcfa) return { label: formatFCFA(b.prix_nuit_fcfa), suffix: '/nuit' }
  if (b.prix_mois_fcfa) return { label: formatFCFA(b.prix_mois_fcfa), suffix: '/mois' }
  if (b.prix_vente_fcfa) return { label: formatFCFA(b.prix_vente_fcfa), suffix: '' }
  return null
}

interface PropertiesMapProps {
  biens: BienMarker[]
  hauteur?: number
  mapTheme?: string
  targetCenter?: { lat: number; lng: number } | null
}

export function PropertiesMap({
  biens,
  hauteur = 500,
  mapTheme = 'mapbox://styles/mapbox/streets-v12',
  targetCenter = null,
}: PropertiesMapProps) {
  const [selectedBien, setSelectedBien] = useState<BienMarker | null>(null)
  const mapRef = useRef<MapRef>(null)

  const handleMarkerClick = useCallback((bien: BienMarker) => {
    setSelectedBien((prev) => (prev?.id === bien.id ? null : bien))
  }, [])

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    if (targetCenter) {
      map.flyTo({ center: [targetCenter.lng, targetCenter.lat], zoom: 13, duration: 1400, essential: true })
    } else {
      map.flyTo({ center: [ABIDJAN_CENTER.longitude, ABIDJAN_CENTER.latitude], zoom: ABIDJAN_CENTER.zoom, duration: 1400, essential: true })
    }
  }, [targetCenter])

  const biensWithCoords = useMemo(
    () => biens.filter((b) => b.latitude !== null && b.longitude !== null),
    [biens]
  )

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full rounded-card bg-surface flex items-center justify-center border border-border" style={{ height: hauteur }}>
        <p className="text-muted font-sans text-sm">Carte en chargement...</p>
      </div>
    )
  }

  const prix = selectedBien ? getPrix(selectedBien) : null

  return (
    <div className="w-full rounded-card overflow-hidden border border-border" style={{ height: hauteur }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={ABIDJAN_CENTER}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapTheme}
      >
        {biensWithCoords.map((bien) => (
          <Marker
            key={bien.id}
            longitude={Number(bien.longitude)}
            latitude={Number(bien.latitude)}
            anchor="bottom"
          >
            <button
              onClick={() => handleMarkerClick(bien)}
              className="group relative"
              title={bien.titre}
            >
              {/* Pin label with price */}
              <span className="flex items-center gap-1 bg-[var(--secondary)] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg ring-2 ring-white group-hover:scale-110 transition-transform duration-200 whitespace-nowrap">
                {getPrix(bien)?.label ?? '—'}
              </span>
              {/* Triangle pointer */}
              <span className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-[var(--secondary)]" />
            </button>
          </Marker>
        ))}

        {selectedBien && selectedBien.longitude && selectedBien.latitude && (
          <Popup
            longitude={Number(selectedBien.longitude)}
            latitude={Number(selectedBien.latitude)}
            anchor="top"
            onClose={() => setSelectedBien(null)}
            closeButton={true}
            closeOnClick={false}
            maxWidth="240px"
          >
            <div className="overflow-hidden rounded-lg" style={{ minWidth: 200 }}>
              {/* Photo */}
              {selectedBien.photo_url ? (
                <div className="relative h-28 bg-gray-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedBien.photo_url} alt={selectedBien.titre} className="w-full h-full object-cover" />
                  <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-sans">
                    {TYPE_LABELS[selectedBien.type_bien] ?? selectedBien.type_bien}
                  </span>
                </div>
              ) : (
                <div className="h-16 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <span className="text-xs text-muted font-sans">{TYPE_LABELS[selectedBien.type_bien] ?? selectedBien.type_bien}</span>
                </div>
              )}

              {/* Info */}
              <div className="p-2.5">
                <p className="font-sans text-sm font-semibold text-[var(--text)] line-clamp-2 leading-tight mb-1">
                  {selectedBien.titre}
                </p>
                <p className="text-[11px] text-muted font-sans mb-1.5 flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                  {selectedBien.quartier ? `${selectedBien.quartier}, ` : ''}{selectedBien.commune}
                </p>
                {prix && (
                  <p className="font-bold text-sm text-[var(--primary)]">
                    {prix.label}
                    <span className="font-normal text-[11px] text-muted ml-0.5">{prix.suffix}</span>
                  </p>
                )}
                <Link
                  href={`/biens/${selectedBien.id}`}
                  className="mt-2 flex items-center justify-center w-full bg-[var(--primary)] text-white text-xs font-sans font-semibold py-1.5 rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
                >
                  Voir la fiche →
                </Link>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
