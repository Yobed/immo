'use client'
import Map, { Marker } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
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
    ? { latitude: Number(latitude), longitude: Number(longitude) }
    : ABIDJAN_CENTER

  return (
    <div 
      className="w-full rounded-[2rem] overflow-hidden border border-white/10 relative shadow-xl"
      style={{ height: hauteur }}
    >
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: center.longitude, latitude: center.latitude, zoom: hasCoords ? 14 : 11 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
      >
        {hasCoords && (
          <Marker longitude={center.longitude} latitude={center.latitude} anchor="bottom">
            <div className="relative group">
              {/* L'EFFET DE COULEUR / CLIGNOTEMENT LUXURY */}
              <div className="absolute -inset-4 bg-[#D4AF37] rounded-full animate-ping opacity-25" />
              <div className="absolute -inset-2 bg-[#D4AF37] rounded-full animate-pulse opacity-40 blur-sm" />
              
              <div
                title={titre}
                className="relative w-10 h-10 bg-[#D4AF37] rounded-full border-2 border-white shadow-2xl flex items-center justify-center text-black"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
            </div>
          </Marker>
        )}
      </Map>
      {!hasCoords && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <span className="bg-black/80 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
            Position approximative{commune ? ` · ${commune}` : ''}
          </span>
        </div>
      )}
    </div>
  )
}
