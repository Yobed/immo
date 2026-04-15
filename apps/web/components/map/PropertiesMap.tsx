'use client'
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { MAPBOX_TOKEN, ABIDJAN_CENTER } from '@/lib/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import Map, { Marker } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

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
  residence_meublee: 'Rés. meublée',
}

function formatPrice(b: BienMarker): { label: string; suffix: string } | null {
  if (b.prix_nuit_fcfa) {
    const v = b.prix_nuit_fcfa
    return { label: v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1_000)}k`, suffix: '/nuit' }
  }
  if (b.prix_mois_fcfa) {
    const v = b.prix_mois_fcfa
    return { label: v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1_000)}k`, suffix: '/mois' }
  }
  if (b.prix_vente_fcfa) {
    const v = b.prix_vente_fcfa
    return { label: v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1_000)}k`, suffix: '' }
  }
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

  // ── Fly-to when commune filter changes ───────────────────────────────────
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    if (targetCenter) {
      map.flyTo({ center: [targetCenter.lng, targetCenter.lat], zoom: 13, duration: 1300, essential: true })
    } else {
      map.flyTo({ center: [ABIDJAN_CENTER.longitude, ABIDJAN_CENTER.latitude], zoom: ABIDJAN_CENTER.zoom, duration: 1300, essential: true })
    }
    setSelectedBien(null) // close panel on commune change
  }, [targetCenter])

  const biensWithCoords = useMemo(
    () => biens.filter((b) => b.latitude !== null && b.longitude !== null && b.latitude !== 0 && b.longitude !== 0),
    [biens]
  )

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full rounded-card bg-surface flex items-center justify-center border border-border" style={{ height: hauteur }}>
        <p className="text-muted font-sans text-sm">Token Mapbox manquant</p>
      </div>
    )
  }

  const prix = selectedBien ? formatPrice(selectedBien) : null

  return (
    <div className="w-full rounded-card overflow-hidden border border-border relative" style={{ height: hauteur }}>
      {/* ── Mapbox Map ─────────────────────────────────────────────────────── */}
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={ABIDJAN_CENTER}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapTheme}
        onClick={() => setSelectedBien(null)}
      >
        {biensWithCoords.map((bien) => {
          const p = formatPrice(bien)
          return (
            <Marker
              key={bien.id}
              longitude={Number(bien.longitude)}
              latitude={Number(bien.latitude)}
              anchor="bottom"
            >
              <button
                onClick={(e) => { e.stopPropagation(); handleMarkerClick(bien) }}
                style={{
                  background: selectedBien?.id === bien.id ? '#0C2D5E' : '#F97316',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'DM Sans, sans-serif',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  border: '2px solid white',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'transform 0.15s ease',
                  transform: selectedBien?.id === bien.id ? 'scale(1.15)' : 'scale(1)',
                  lineHeight: 1.3,
                }}
              >
                {p ? `${p.label} FCFA` : '—'}
              </button>
            </Marker>
          )
        })}
      </Map>

      {/* ── Custom info panel (outside Mapbox DOM — full Tailwind support) ── */}
      {selectedBien && (
        <div
          className="absolute top-3 right-3 z-10 bg-white rounded-xl shadow-xl overflow-hidden animate-scale-in"
          style={{ width: 230, maxWidth: 'calc(100vw - 24px)' }}
        >
          {/* Photo */}
          {selectedBien.photo_url ? (
            <div className="relative h-28 bg-gray-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedBien.photo_url}
                alt={selectedBien.titre}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-sans">
                {TYPE_LABELS[selectedBien.type_bien] ?? selectedBien.type_bien}
              </span>
            </div>
          ) : (
            <div className="h-14 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <span className="text-xs text-muted font-sans font-medium">
                {TYPE_LABELS[selectedBien.type_bien] ?? selectedBien.type_bien}
              </span>
            </div>
          )}

          {/* Info */}
          <div className="p-3">
            <p className="font-sans text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-1">
              {selectedBien.titre}
            </p>
            <p className="text-xs text-gray-500 font-sans flex items-center gap-1 mb-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-gray-400">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              </svg>
              {selectedBien.quartier ? `${selectedBien.quartier}, ` : ''}{selectedBien.commune}
            </p>
            {prix && (
              <p className="font-bold text-base text-primary mb-2.5">
                {prix.label}{' '}
                <span className="font-normal text-xs text-gray-400">FCFA{prix.suffix}</span>
              </p>
            )}
            <Link
              href={`/biens/${selectedBien.id}`}
              className="flex items-center justify-center w-full bg-primary text-white text-xs font-sans font-semibold py-2 rounded-lg hover:bg-primary-mid transition-colors"
            >
              Voir la fiche →
            </Link>
          </div>

          {/* Close button */}
          <button
            onClick={() => setSelectedBien(null)}
            className="absolute top-2 right-2 w-6 h-6 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors z-10"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Biens count badge on the map */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm text-xs font-sans font-medium text-gray-700 px-3 py-1.5 rounded-full shadow-md border border-gray-100">
        {biensWithCoords.length} bien{biensWithCoords.length !== 1 ? 's' : ''} sur la carte
      </div>
    </div>
  )
}
