'use client'

import { useEffect, useRef, useState } from 'react'
import Map, { Marker, MapRef } from 'react-map-gl/mapbox'
import { Search, Loader2, Crosshair, MapPin, X, Maximize2, Minimize2 } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
const ABIDJAN = { latitude: 5.3189, longitude: -4.0167 }

interface MapboxFeature {
  id: string
  place_name: string
  center: [number, number]
  text?: string
  context?: { text: string }[]
}

interface LocationPickerProps {
  latitude?: number | null
  longitude?: number | null
  onChange: (coords: { latitude: number; longitude: number; address?: string }) => void
}

export function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const hasInitialCoords = latitude != null && longitude != null
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    hasInitialCoords ? { lat: Number(latitude), lng: Number(longitude) } : null
  )

  const [viewState, setViewState] = useState({
    latitude: marker?.lat ?? ABIDJAN.latitude,
    longitude: marker?.lng ?? ABIDJAN.longitude,
    zoom: marker ? 15 : 11,
  })

  const [search, setSearch] = useState('')
  const [results, setResults] = useState<MapboxFeature[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mapRef = useRef<MapRef | null>(null)

  // Recherche d'adresse (Mapbox Geocoding) avec debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (search.trim().length < 3) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(search)}.json?access_token=${MAPBOX_TOKEN}&country=ci&language=fr&limit=5&proximity=-4.0167,5.3189`
        const res = await fetch(url)
        const data = await res.json()
        setResults((data.features ?? []) as MapboxFeature[])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  const setCoords = (lat: number, lng: number, address?: string, zoom?: number) => {
    setMarker({ lat, lng })
    setViewState(v => ({ ...v, latitude: lat, longitude: lng, zoom: zoom ?? Math.max(v.zoom, 15) }))
    onChange({ latitude: lat, longitude: lng, address })
  }

  const handleMapClick = (e: { lngLat: { lat: number; lng: number } }) => {
    setCoords(e.lngLat.lat, e.lngLat.lng)
  }

  const handleResultClick = (f: MapboxFeature) => {
    setSearch(f.place_name)
    setResults([])
    setSearchOpen(false)
    setCoords(f.center[1], f.center[0], f.place_name, 16)
  }

  const handleLocateMe = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(pos.coords.latitude, pos.coords.longitude, undefined, 17)
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const clearMarker = () => {
    setMarker(null)
    onChange({ latitude: NaN, longitude: NaN })
  }

  // Echap pour quitter plein écran
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [fullscreen])

  const mapJSX = (wrapperCls: string) => (
    <div className={`w-full relative overflow-hidden ${wrapperCls}`}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        onClick={handleMapClick}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        attributionControl={false}
        cursor="crosshair"
      >
        {marker && (
          <Marker
            longitude={marker.lng}
            latitude={marker.lat}
            anchor="bottom"
            draggable
            onDragEnd={(e) => setCoords(e.lngLat.lat, e.lngLat.lng)}
          >
            <div className="relative cursor-grab active:cursor-grabbing">
              <div className="absolute -inset-3 bg-[#D97706] rounded-full animate-ping opacity-30" />
              <div className="relative w-10 h-10 bg-[#D97706] rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
          </Marker>
        )}
      </Map>

      {/* Bouton géoloc */}
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={locating}
        className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-lg border border-slate-200 text-slate-600 hover:text-slate-900 active:scale-95 transition-all disabled:opacity-60"
        title="Utiliser ma position GPS"
      >
        {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
      </button>

      {/* Bouton plein écran / réduire */}
      <button
        type="button"
        onClick={() => setFullscreen(f => !f)}
        className="absolute top-3 right-15 w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-lg border border-slate-200 text-slate-600 hover:text-slate-900 active:scale-95 transition-all"
        style={{ right: '60px' }}
        title={fullscreen ? 'Quitter le plein écran' : 'Plein écran'}
      >
        {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {!marker && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-slate-200 pointer-events-none">
          <p className="text-xs font-bold text-slate-700">Cliquez sur la carte pour placer un marqueur</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-3">
      {/* Recherche d'adresse */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSearchOpen(true) }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Rechercher une adresse, un quartier, un point d'intérêt..."
            className="w-full pl-10 pr-10 py-2.5 bg-[var(--surface-card)] border border-[var(--border)] rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        {searchOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden max-h-[260px] overflow-y-auto">
            {results.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleResultClick(f)}
                className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-accent-luxury shrink-0" />
                <span className="text-xs text-slate-700 leading-snug">{f.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Carte inline (cachée si plein écran) */}
      {!fullscreen && mapJSX('h-[360px] rounded-2xl border border-slate-200 shadow-md')}

      {/* Plein écran modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-[500] bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shrink-0">
            <div>
              <p className="font-bold text-slate-900 text-sm leading-none">Choisir l'emplacement</p>
              <p className="text-slate-400 text-xs mt-0.5">Cliquez ou recherchez une adresse</p>
            </div>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5 text-slate-700" />
            </button>
          </div>

          {/* Search dans le modal */}
          <div className="px-4 py-3 bg-white border-b border-slate-100 relative shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSearchOpen(true) }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Rechercher une adresse, un quartier..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {searchOpen && results.length > 0 && (
              <div className="absolute top-full left-4 right-4 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden max-h-[260px] overflow-y-auto">
                {results.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleResultClick(f)}
                    className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-accent-luxury shrink-0" />
                    <span className="text-xs text-slate-700 leading-snug">{f.place_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 relative">
            {mapJSX('h-full')}
          </div>
        </div>
      )}

      {/* Coords + clear */}
      {marker && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-emerald-800">
            <MapPin className="w-3.5 h-3.5" />
            <span className="font-mono">{marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}</span>
          </div>
          <button
            type="button"
            onClick={clearMarker}
            className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100 rounded-md font-medium transition-colors"
          >
            <X className="w-3 h-3" />
            Effacer
          </button>
        </div>
      )}
    </div>
  )
}
