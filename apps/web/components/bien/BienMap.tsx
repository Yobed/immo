'use client'
import Map, { Marker } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

// Centre d'Abidjan par défaut
const ABIDJAN_CENTER = { latitude: 5.3189, longitude: -4.0167 }

interface BienMapProps {
  latitude?: number | null
  longitude?: number | null
  titre: string
  commune?: string | null
  hauteur?: number
}

export function BienMap({ latitude, longitude, titre, commune, hauteur = 256 }: BienMapProps) {
  const hasCoords = !!(latitude && longitude)
  const center = hasCoords
    ? { latitude: latitude!, longitude: longitude! }
    : ABIDJAN_CENTER

  return (
    <div 
      className="w-full rounded-card overflow-hidden border border-[var(--border)] relative"
      style={{ height: hauteur }}
    >
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: center.longitude, latitude: center.latitude, zoom: hasCoords ? 14 : 11 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {hasCoords && (
          <Marker longitude={longitude!} latitude={latitude!} anchor="bottom">
            <div
              title={titre}
              className="w-8 h-8 bg-primary rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-xs"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="0">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          </Marker>
        )}
      </Map>
      {!hasCoords && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
          <span className="bg-black/60 text-white text-xs font-sans px-3 py-1 rounded-pill backdrop-blur-sm flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            Position approximative{commune ? ` · ${commune}` : ''}
          </span>
        </div>
      )}
    </div>
  )
}
