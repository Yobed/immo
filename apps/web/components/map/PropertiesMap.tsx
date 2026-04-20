'use client'
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { MAPBOX_TOKEN, ABIDJAN_CENTER } from '@/lib/mapbox'
import Map, { Marker, Source, Layer, GeolocateControl, NavigationControl, type MapRef } from 'react-map-gl/mapbox'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
export interface BienMarker {
  id: string
  titre: string
  commune: string
  quartier: string | null
  type_bien: string
  latitude: number | string | null
  longitude: number | string | null
  prix_mois_fcfa: number | string | null
  prix_nuit_fcfa: number | string | null
  prix_vente_fcfa: number | string | null
  photo_url?: string | null
  est_disponible?: boolean
  is_verifie?: boolean
  equipements?: string[] | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toNum(v: number | string | null | undefined): number {
  if (v == null) return 0
  return typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v)
}

function formatPrice(b: BienMarker): string {
  const nuit = toNum(b.prix_nuit_fcfa)
  const mois = toNum(b.prix_mois_fcfa)
  const vente = toNum(b.prix_vente_fcfa)
  const v = nuit || mois || vente
  if (!v) return '—'
  const label = v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1_000)}k`
  const suffix = nuit ? '/nuit' : mois ? '/mois' : ''
  return `${label}${suffix}`
}

// ── Inline CSS (injected once, avoids external CSS issues with Mapbox) ────────
const MAP_STYLES = `
  /* Shared pulse animation — used by both user dot and bien dots */
  @keyframes gps-pulse {
    0%   { transform: translate(-50%,-50%) scale(0.6); opacity: 0.9; }
    100% { transform: translate(-50%,-50%) scale(3.0); opacity: 0; }
  }

  /* ── User GPS dot (blue) ── */
  .user-dot {
    width: 16px; height: 16px;
    background: #3b82f6;
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 12px rgba(59,130,246,0.8);
    position: relative;
    z-index: 2;
  }
  .user-ring {
    position: absolute;
    top: 50%; left: 50%;
    width: 36px; height: 36px;
    border: 2.5px solid #3b82f6;
    border-radius: 50%;
    animation: gps-pulse 2s ease-out infinite;
    pointer-events: none;
  }
  .user-ring.delay { animation-delay: 0.9s; }

  /* ── Bien marker dot (gold) — SAME structure as user dot ── */
  .bien-dot {
    width: 18px; height: 18px;
    background: #D4AF37;
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 15px rgba(212,175,55,0.9), 0 0 30px rgba(212,175,55,0.4);
    position: relative;
    z-index: 10;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .bien-dot.selected {
    width: 24px; height: 24px;
    background: #fff;
    border: 4px solid #D4AF37;
    box-shadow: 0 0 30px rgba(212,175,55,1), 0 0 60px rgba(212,175,55,0.6);
  }
  .bien-ring {
    position: absolute;
    top: 50%; left: 50%;
    width: 44px; height: 44px;
    border: 3px solid #D4AF37;
    border-radius: 50%;
    animation: gps-pulse 2.5s ease-out infinite;
    pointer-events: none;
    z-index: 5;
  }
  .bien-ring.delay { animation-delay: 1.2s; }

  /* ── Price label above the dot ── */
  .bien-price {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
    padding: 5px 12px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.05em;
    white-space: nowrap;
    background: rgba(10,10,25,0.95);
    color: #D4AF37;
    border: 1.5px solid rgba(212,175,55,0.7);
    box-shadow: 0 8px 24px rgba(0,0,0,0.7);
    backdrop-filter: blur(12px);
    pointer-events: none;
    z-index: 15;
    transition: all 0.3s;
  }
  .bien-price.selected {
    background: #D4AF37;
    color: #000;
    border-color: #fff;
    box-shadow: 0 0 22px rgba(212,175,55,0.9);
  }
`

// ── Props ─────────────────────────────────────────────────────────────────────
interface PropertiesMapProps {
  biens: BienMarker[]
  hauteur?: number
  mapTheme?: string
  targetCenter?: { lat: number; lng: number } | null
  highlightedId?: string | null
  selectedId?: string | null
  userLocation?: { lat: number; lng: number } | null
  onSelect?: (id: string | null) => void
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PropertiesMap({
  biens,
  hauteur = 600,
  mapTheme = 'mapbox://styles/mapbox/dark-v11',
  targetCenter = null,
  highlightedId = null,
  selectedId: externalSelectedId = null,
  userLocation: externalUserLocation = null,
  onSelect,
}: PropertiesMapProps) {

  const mapRef = useRef<MapRef>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [routeGeometry, setRouteGeometry] = useState<any>(null)
  const [internalUserLoc, setInternalUserLoc] = useState<{ lat: number; lng: number } | null>(null)

  const userLocation = externalUserLocation || internalUserLoc

  // ── Normalise coordinates ──────────────────────────────────────────────────
  const markers = useMemo(() => {
    return (biens || [])
      .map(b => ({ ...b, lat: toNum(b.latitude), lng: toNum(b.longitude) }))
      .filter(b => b.lat !== 0 && b.lng !== 0 && !isNaN(b.lat) && !isNaN(b.lng))
  }, [biens])

  // ── Sync external selectedId ───────────────────────────────────────────────
  useEffect(() => {
    setSelectedId(externalSelectedId ?? null)
  }, [externalSelectedId])

  // ── Fly to selected marker ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedId || !isMapLoaded) return
    const m = markers.find(b => b.id === selectedId)
    if (m) {
      mapRef.current?.flyTo({ center: [m.lng, m.lat], zoom: 14, duration: 1400 })
    }
  }, [selectedId, markers, isMapLoaded])

  const hasFittedBoundsRef = useRef(false)
  const lastMarkersCount = useRef(0)

  // ── Fit all markers and user position to screen on load ──────────────────
  useEffect(() => {
    if (!isMapLoaded || (markers.length === 0 && !userLocation)) return
    
    // Si on a déjà fit les bounds avec le même nombre de markers, on ne refait pas 
    // à moins que ce soit le premier passage réussi.
    if (hasFittedBoundsRef.current && markers.length === lastMarkersCount.current) return

    try {
      const bounds = new mapboxgl.LngLatBounds()
      if (userLocation) {
        bounds.extend([userLocation.lng, userLocation.lat])
      }
      markers.forEach(m => bounds.extend([m.lng, m.lat]))
      
      if (!bounds.isEmpty()) {
        mapRef.current?.getMap()?.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 1800 })
        hasFittedBoundsRef.current = true
        lastMarkersCount.current = markers.length
      }
    } catch {}
  }, [isMapLoaded, markers, userLocation])

  // ── Fly to targetCenter (commune filter) ──────────────────────────────────
  useEffect(() => {
    if (!isMapLoaded || !targetCenter) return
    mapRef.current?.flyTo({ center: [targetCenter.lng, targetCenter.lat], zoom: 13, duration: 1300 })
  }, [targetCenter, isMapLoaded])

  // ── Fetch route when bien is selected ─────────────────────────────────────
  useEffect(() => {
    if (!selectedId || !userLocation) { setRouteGeometry(null); return }
    const m = markers.find(b => b.id === selectedId)
    if (!m) { setRouteGeometry(null); return }

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.lng.toFixed(6)},${userLocation.lat.toFixed(6)};${m.lng.toFixed(6)},${m.lat.toFixed(6)}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
    fetch(url)
      .then(r => r.json())
      .then(json => {
        if (json.code === 'Ok' && json.routes?.[0]) {
          setRouteGeometry(json.routes[0].geometry)
        }
      })
      .catch(() => {})
  }, [selectedId, userLocation, markers])

  // ── Handle marker click ────────────────────────────────────────────────────
  const handleClick = useCallback((id: string) => {
    const next = selectedId === id ? null : id
    setSelectedId(next)
    onSelect?.(next)
  }, [selectedId, onSelect])

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full rounded-2xl bg-gray-900 flex items-center justify-center" style={{ height: hauteur }}>
        <p className="text-gray-400 text-sm">Token Mapbox manquant</p>
      </div>
    )
  }

  return (
    <div className="w-full relative overflow-hidden rounded-[2rem]" style={{ height: hauteur }}>
      {/* Inject CSS once */}
      <style dangerouslySetInnerHTML={{ __html: MAP_STYLES }} />

      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={ABIDJAN_CENTER}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapTheme}
        onLoad={() => setIsMapLoaded(true)}
        onClick={() => { setSelectedId(null); onSelect?.(null) }}
      >
        {/* ── Vibrancy Blue itinerary route ── */}
        {routeGeometry && (
          <Source id="route" type="geojson" data={{ type: 'Feature', properties: {}, geometry: routeGeometry }}>
            {/* Ultra Glow */}
            <Layer id="route-glow-outer" type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{ 'line-color': '#3b82f6', 'line-width': 26, 'line-opacity': 0.2, 'line-blur': 12 }}
            />
            {/* Inner Neon Glow */}
            <Layer id="route-glow-inner" type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{ 'line-color': '#60a5fa', 'line-width': 10, 'line-opacity': 0.5, 'line-blur': 3 }}
            />
            {/* Solid Core */}
            <Layer id="route-core" type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{ 'line-color': '#0055ff', 'line-width': 6, 'line-opacity': 1 }}
            />
            {/* Precise Center Line */}
            <Layer id="route-center" type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{ 'line-color': '#ffffff', 'line-width': 2, 'line-opacity': 0.8 }}
            />
          </Source>
        )}

        {/* ── GPS / GeolocateControl ── */}
        <GeolocateControl
          position="bottom-right"
          trackUserLocation
          showUserHeading
          onGeolocate={(e) => setInternalUserLoc({ lng: e.coords.longitude, lat: e.coords.latitude })}
        />
        <NavigationControl position="bottom-right" />

        {/* ── User position dot ── */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div style={{ position: 'relative', width: 14, height: 14 }}>
              <div className="user-ring" />
              <div className="user-ring delay" />
              <div className="user-dot" />
            </div>
          </Marker>
        )}

        {/* ── Property markers — gold dot + pulsing rings, identical to GPS dot ── */}
        {markers.map((bien) => {
          const isSelected = selectedId === bien.id
          const price = formatPrice(bien)

          return (
            <Marker
              key={bien.id}
              longitude={bien.lng}
              latitude={bien.lat}
              anchor="center"
              onClick={(e) => { e.originalEvent.stopPropagation(); handleClick(bien.id) }}
              style={{ zIndex: isSelected ? 100 : 10 }}
            >
              {/* Outer wrapper */}
              <div style={{ position: 'relative', cursor: 'pointer' }}>

                {/* Price label floating above */}
                <div className={`bien-price${isSelected ? ' selected' : ''}`}>
                  {price}
                </div>

                {/* Gold pulsing rings — same animation as user-ring/user-dot */}
                <div className="bien-ring" style={{ animationDelay: `${(bien.id.charCodeAt(0) % 5) * 0.3}s` }} />
                <div className="bien-ring delay" />

                {/* Solid gold dot — center anchor */}
                <div className={`bien-dot${isSelected ? ' selected' : ''}`} />
              </div>
            </Marker>
          )
        })}
      </Map>

      {/* ── Stats overlay (Top Left) ── */}
      <div className="absolute top-4 left-4 z-10 flex flex-row sm:flex-col gap-2 sm:gap-2.5 max-w-[calc(100%-2rem)] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2.5 px-3 sm:px-4 py-2 sm:py-2 bg-black/85 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-[rgba(212,175,55,0.4)] shadow-2xl whitespace-nowrap">
          <div className="user-dot shrink-0" style={{ width: 10, height: 10, border: '2px solid #fff' }} />
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-white leading-tight">
              Ma position
            </span>
            <span className="text-[8px] font-semibold text-white/50 leading-tight">GPS Actif</span>
          </div>
        </div>

        {markers.length > 0 && (
          <div className="flex items-center gap-2.5 px-3 sm:px-4 py-2 sm:py-2 bg-black/85 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl whitespace-nowrap">
            <span className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white leading-tight">
                {markers.length} Biens
              </span>
              <span className="text-[8px] font-semibold text-white/50 leading-tight">Filtrés</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Selected bien info panel (Bottom Sheet on Mobile, Top Right on Desktop) ── */}
      {selectedId && (() => {
        const bien = markers.find(b => b.id === selectedId)
        if (!bien) return null
        return (
          <div className="absolute inset-x-0 bottom-0 sm:bottom-auto sm:top-16 sm:right-16 z-20 transition-all duration-500 ease-out sm:w-[320px]">
            <div className="bg-[#0a0a12]/95 backdrop-blur-[20px] border-t sm:border border-[rgba(212,175,55,0.4)] rounded-t-[2.5rem] sm:rounded-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.8)] sm:shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Mobile Grab Handle */}
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

              {/* 1. Image Header - Adjusted for mobile to avoid hiding the route */}
              {/* 1. Header with Image (Desktop Only) */}
              <div className="hidden sm:block h-44 w-full relative">
                {bien.photo_url ? (
                  <img 
                    src={bien.photo_url} 
                    alt={bien.titre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1a1a2e] flex items-center justify-center">
                    <MapPin className="text-[#D4AF37] opacity-20" size={32} />
                  </div>
                )}
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/20 to-transparent" />
                
                {/* Close button for desktop */}
                <button
                  className="absolute top-4 right-4 p-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                  onClick={(e) => { e.stopPropagation(); setSelectedId(null); onSelect?.(null) }}
                >
                  ✕
                </button>
              </div>

              {/* Close Button for Mobile (Standalone) */}
              <button
                className="sm:hidden absolute top-3 right-3 p-2 bg-white/5 border border-white/10 rounded-full text-white/40 z-50"
                onClick={(e) => { e.stopPropagation(); setSelectedId(null); onSelect?.(null) }}
              >
                ✕
              </button>

              {/* 2. Content */}
              <div className="px-6 py-8 sm:pb-10 sm:-mt-6 relative">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#D4AF37] mb-2">
                  {bien.commune}{bien.quartier ? ` · ${bien.quartier}` : ''}
                </p>
                <h3 className="text-white text-xl sm:text-lg font-bold leading-tight mb-3 tracking-tight">
                  {bien.titre}
                </h3>
                <p className="text-[#D4AF37] text-2xl sm:text-xl font-black mb-5 flex items-baseline gap-1.5">
                  {formatPrice(bien).split('/')[0]}
                  <span className="text-[11px] font-bold opacity-60 uppercase">
                    {formatPrice(bien).includes('/') ? `/ ${formatPrice(bien).split('/')[1]}` : 'FCFA'}
                  </span>
                </p>
                
                {routeGeometry && (
                  <div className="flex items-center gap-3 p-3.5 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-6 group">
                    <div className="relative">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                      <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-40 scale-150" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-blue-400 text-[10px] font-black uppercase tracking-wider">
                        Itinéraire Optimisé
                      </p>
                      <p className="text-blue-500/60 text-[9px] font-bold">
                        Calculé depuis votre position
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Link
                    href={`/biens/${bien.id}`}
                    className="flex-1 text-center py-4.5 bg-[#D4AF37] text-black rounded-2xl text-[12px] font-black uppercase tracking-[0.15em] shadow-lg shadow-[#D4AF37]/20 hover:scale-[1.02] active:scale-95 transition-all"
                    onClick={e => e.stopPropagation()}
                  >
                    Consulter les détails
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
