'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MAPBOX_TOKEN, ABIDJAN_CENTER } from '@/lib/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'

// Import statique — on est déjà dans un composant 'use client', SSR désactivé via le composant parent
import Map, { Marker, Popup } from 'react-map-gl/mapbox'

interface BienMarker {
  id: string
  titre: string
  commune: string
  latitude: number | null
  longitude: number | null
  prix_mois_fcfa: number | null
  prix_vente_fcfa: number | null
}

function formatFCFA(n: number): string {
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(n)
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

  // flyTo quand la commune cible change
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    if (targetCenter) {
      map.flyTo({
        center: [targetCenter.lng, targetCenter.lat],
        zoom: 13,
        duration: 1400,
        essential: true,
      })
    } else {
      map.flyTo({
        center: [ABIDJAN_CENTER.longitude, ABIDJAN_CENTER.latitude],
        zoom: ABIDJAN_CENTER.zoom,
        duration: 1400,
        essential: true,
      })
    }
  }, [targetCenter])

  const biensWithCoords = biens.filter(
    (b) => b.latitude !== null && b.longitude !== null
  )

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className="w-full rounded-card bg-[var(--surface)] flex items-center justify-center border border-[var(--border)]"
        style={{ height: hauteur }}
      >
        <p className="text-muted font-sans text-sm">Carte en chargement...</p>
      </div>
    )
  }

  return (
    <div
      className="w-full rounded-card overflow-hidden border border-[var(--border)]"
      style={{ height: hauteur }}
    >
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
              className="bg-secondary text-white text-xs font-mono px-2 py-1 rounded-pill shadow-md hover:bg-secondary/90 transition-colors whitespace-nowrap"
            >
              {bien.prix_mois_fcfa
                ? formatFCFA(bien.prix_mois_fcfa)
                : bien.prix_vente_fcfa
                ? formatFCFA(bien.prix_vente_fcfa)
                : '—'}
            </button>
          </Marker>
        ))}

        {selectedBien && selectedBien.longitude && selectedBien.latitude && (
          <Popup
            longitude={Number(selectedBien.longitude)}
            latitude={Number(selectedBien.latitude)}
            anchor="top"
            onClose={() => setSelectedBien(null)}
            closeButton
            closeOnClick={false}
          >
            <div className="p-2 max-w-[200px]">
              <p className="font-sans text-sm font-medium text-[var(--text)] line-clamp-2 mb-1">
                {selectedBien.titre}
              </p>
              <p className="text-xs text-muted font-sans mb-2">{selectedBien.commune}</p>
              <Link
                href={`/biens/${selectedBien.id}`}
                className="text-xs text-primary font-sans underline hover:no-underline"
              >
                Voir la fiche →
              </Link>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
