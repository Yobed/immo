'use client'
import { useState, useCallback } from 'react'
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox'
import { Navigation, Loader2, Maximize2, X, RefreshCw } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
const ABIDJAN_CENTER = { latitude: 5.3189, longitude: -4.0167 }

const routeLayer = {
  id: 'route',
  type: 'line' as const,
  layout: { 'line-join': 'round' as const, 'line-cap': 'round' as const },
  paint: { 'line-color': '#2563EB', 'line-width': 4, 'line-opacity': 0.9 },
}

const routeLayerFS = {
  id: 'route-fs',
  type: 'line' as const,
  layout: { 'line-join': 'round' as const, 'line-cap': 'round' as const },
  paint: { 'line-color': '#2563EB', 'line-width': 5, 'line-opacity': 0.95 },
}

interface BienMapProps {
  latitude?: number | null
  longitude?: number | null
  titre: string
  commune?: string | null
  hauteur?: number
}

export function BienMap({ latitude, longitude, titre, commune, hauteur = 300 }: BienMapProps) {
  const hasCoords = !!(latitude && longitude)
  const propLat = hasCoords ? Number(latitude) : ABIDJAN_CENTER.latitude
  const propLng = hasCoords ? Number(longitude) : ABIDJAN_CENTER.longitude

  const initialView = { longitude: propLng, latitude: propLat, zoom: hasCoords ? 14 : 11 }

  const [viewState, setViewState] = useState(initialView)
  const [fsViewState, setFsViewState] = useState(initialView)
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [route, setRoute] = useState<GeoJSON.Feature | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  const fetchRoute = useCallback(async () => {
    if (!hasCoords) return
    setLoading(true)
    setError(null)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 12000 })
      )
      const { latitude: uLat, longitude: uLng } = pos.coords
      setUserPos({ lat: uLat, lng: uLng })

      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${uLng},${uLat};${propLng},${propLat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
      )
      const data = await res.json()
      if (data.routes?.[0]) {
        const geo: GeoJSON.Feature = { type: 'Feature', properties: {}, geometry: data.routes[0].geometry }
        setRoute(geo)
        const mid = { longitude: (uLng + propLng) / 2, latitude: (uLat + propLat) / 2, zoom: 11 }
        setViewState(mid)
        setFsViewState(mid)
      } else {
        setError('Itinéraire introuvable')
      }
    } catch {
      setError('Activez la géolocalisation et réessayez')
    } finally {
      setLoading(false)
    }
  }, [hasCoords, propLat, propLng])

  const propertyPin = hasCoords ? (
    <Marker longitude={propLng} latitude={propLat} anchor="bottom">
      <div className="relative">
        <div className="absolute -inset-3 bg-[#D97706] rounded-full animate-ping opacity-30" />
        <div className="relative w-11 h-11 bg-[#D97706] rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      </div>
    </Marker>
  ) : null

  const userDot = userPos ? (
    <Marker longitude={userPos.lng} latitude={userPos.lat} anchor="center">
      <div className="w-5 h-5 bg-blue-500 border-2 border-white rounded-full shadow-lg ring-4 ring-blue-200" />
    </Marker>
  ) : null

  const routeBtn = (size: 'sm' | 'lg') => (
    <div className="relative">
      {!route && !loading && (
        <span className="absolute inset-0 rounded-2xl bg-amber-400/30 animate-ping pointer-events-none" />
      )}
      <button
        onClick={fetchRoute}
        disabled={loading}
        className={[
          size === 'lg'
            ? 'flex items-center gap-2 px-5 py-3 bg-white rounded-2xl font-bold text-[13px] text-slate-800 shadow-xl border border-slate-200 active:scale-95 transition-all disabled:opacity-60'
            : 'flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl font-bold text-[12px] text-slate-800 shadow-lg border border-slate-200 active:scale-95 transition-all disabled:opacity-60',
          !route && !loading ? 'shadow-amber-400/30' : '',
        ].join(' ')}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin text-blue-600" />Calcul en cours…</>
        ) : route ? (
          <><RefreshCw className="w-4 h-4 text-blue-600" />Rafraîchir ma position</>
        ) : (
          <><Navigation className="w-4 h-4 text-[#D97706] animate-pulse" />Itinéraire depuis ma position</>
        )}
      </button>
    </div>
  )

  return (
    <>
      {/* ── CARTE INLINE ── */}
      {!fullscreen && (
        <div
          className="w-full rounded-2xl overflow-hidden border border-slate-200 relative shadow-md"
          style={{ height: hauteur }}
        >
          <Map
            {...viewState}
            onMove={e => setViewState(e.viewState)}
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            attributionControl={false}
          >
            {route && (
              <Source type="geojson" data={route}>
                <Layer {...routeLayer} />
              </Source>
            )}
            {userDot}
            {propertyPin}
          </Map>

          {hasCoords && (
            <div className="absolute bottom-3 left-3">{routeBtn('sm')}</div>
          )}

          <button
            onClick={() => setFullscreen(true)}
            className="absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-lg border border-slate-200 text-slate-600 hover:text-slate-900 active:scale-95 transition-all"
            title="Plein écran"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {error && (
            <div className="absolute bottom-14 left-3 right-14 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-2 rounded-xl">
              {error}
            </div>
          )}

          {!hasCoords && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
              <span className="bg-white/90 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow border border-slate-200">
                Position approximative{commune ? ` · ${commune}` : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL PLEIN ÉCRAN ── */}
      {fullscreen && (
        <div className="fixed inset-0 z-[500] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shrink-0 shadow-sm">
            <div>
              <p className="font-bold text-slate-900 text-sm leading-none">{titre}</p>
              {commune && <p className="text-slate-400 text-xs mt-0.5">{commune}</p>}
            </div>
            <button
              onClick={() => setFullscreen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5 text-slate-700" />
            </button>
          </div>

          {/* Carte plein écran */}
          <div className="flex-1 relative">
            <Map
              {...fsViewState}
              onMove={e => setFsViewState(e.viewState)}
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              attributionControl={false}
            >
              {route && (
                <Source type="geojson" data={route}>
                  <Layer {...routeLayerFS} />
                </Source>
              )}
              {userDot}
              {propertyPin}
            </Map>

            {hasCoords && (
              <div className="absolute bottom-8 left-4">{routeBtn('lg')}</div>
            )}

            {error && (
              <div className="absolute bottom-20 left-4 right-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-2xl shadow">
                {error}
              </div>
            )}

            {!hasCoords && (
              <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
                <span className="bg-white/90 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow border border-slate-200">
                  Position approximative{commune ? ` · ${commune}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
