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
}

export function BienMap({ latitude, longitude, titre, commune }: BienMapProps) {
  const hasCoords = !!(latitude && longitude)
  const center = hasCoords
    ? { latitude: latitude!, longitude: longitude! }
    : ABIDJAN_CENTER

  return (
    <div className="w-full h-64 rounded-card overflow-hidden border border-[var(--border)] relative">
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
              📍
            </div>
          </Marker>
        )}
      </Map>
      {!hasCoords && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
          <span className="bg-black/60 text-white text-xs font-sans px-3 py-1 rounded-pill backdrop-blur-sm">
            📍 Position approximative{commune ? ` · ${commune}` : ''}
          </span>
        </div>
      )}
    </div>
  )
}
