'use client'
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { MAPBOX_TOKEN, ABIDJAN_CENTER } from '@/lib/mapbox'
import Map, { Marker, Source, Layer, GeolocateControl, NavigationControl, type MapRef } from 'react-map-gl/mapbox'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

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
  equipements?: string[]
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
  const p_nuit = Number(typeof b.prix_nuit_fcfa === 'string' ? b.prix_nuit_fcfa.replace(',', '.') : b.prix_nuit_fcfa);
  const p_mois = Number(typeof b.prix_mois_fcfa === 'string' ? b.prix_mois_fcfa.replace(',', '.') : b.prix_mois_fcfa);
  const p_vente = Number(typeof b.prix_vente_fcfa === 'string' ? b.prix_vente_fcfa.replace(',', '.') : b.prix_vente_fcfa);

  if (p_nuit) {
    const v = p_nuit
    return { label: v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1_000)}k`, suffix: '/nuit' }
  }
  if (p_mois) {
    const v = p_mois
    return { label: v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1_000)}k`, suffix: '/mois' }
  }
  if (p_vente) {
    const v = p_vente
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
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ 
    distance: number; 
    duration: number; 
    geometry: any;
    isValid: boolean;
  } | null>(null)
  const mapRef = useRef<MapRef>(null)

  const handleMarkerClick = useCallback((bien: BienMarker) => {
    setSelectedBien((prev) => (prev?.id === bien.id ? null : bien))
  }, [])

  // ── Fly-to when commune/position changes ────────────────────────────────
  useEffect(() => {
    if (!isMapLoaded) return
    const map = mapRef.current?.getMap()
    if (!map) return

    const center = targetCenter 
      ? [targetCenter.lng, targetCenter.lat] 
      : [ABIDJAN_CENTER.longitude, ABIDJAN_CENTER.latitude]
    
    const zoom = targetCenter ? 13 : ABIDJAN_CENTER.zoom

    // Validate center before flying
    if (typeof center[0] === 'number' && typeof center[1] === 'number' && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo({ 
        center: center as [number, number], 
        zoom, 
        duration: 1300, 
        essential: true 
      })
    }
    
    setSelectedBien(null)
  }, [targetCenter, isMapLoaded])

  // ── Routing Calculation ────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedBien || !userLocation || !selectedBien.latitude || !selectedBien.longitude) {
      setRouteInfo(null)
      return
    }

    const fetchRoute = async () => {
      try {
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.lng},${userLocation.lat};${selectedBien.longitude},${selectedBien.latitude}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`,
          { method: 'GET' }
        )
        const json = await query.json()
        if (json.code === 'Ok') {
          const data = json.routes[0]
          setRouteInfo({
            distance: data.distance / 1000, // km
            duration: Math.round(data.duration / 60), // min
            geometry: data.geometry,
            isValid: true
          })
        }
      } catch (err) {
        console.error('Error fetching route:', err)
      }
    }

    fetchRoute()
  }, [selectedBien, userLocation])

  // Filtrage robuste des biens avec coordonnées valides
  const biensWithCoords = useMemo(
    () => (biens || []).filter((b) => {
      if (!b) return false;
      const latVal = typeof b.latitude === 'string' ? b.latitude.replace(',', '.') : b.latitude;
      const lngVal = typeof b.longitude === 'string' ? b.longitude.replace(',', '.') : b.longitude;
      const lat = Number(latVal);
      const lng = Number(lngVal);
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    }),
    [biens]
  )

  // Auto-ajustement de la vue pour inclure tous les biens au chargement
  useEffect(() => {
    if (!isMapLoaded || biensWithCoords.length === 0 || targetCenter) return
    
    const map = mapRef.current?.getMap()
    if (!map) return

    try {
      const bounds = new mapboxgl.LngLatBounds()
      biensWithCoords.forEach(b => {
        const lat = Number(typeof b.latitude === 'string' ? b.latitude.replace(',', '.') : b.latitude);
        const lng = Number(typeof b.longitude === 'string' ? b.longitude.replace(',', '.') : b.longitude);
        bounds.extend([lng, lat])
      })
      
      map.fitBounds(bounds, { padding: 100, maxZoom: 15, duration: 2000 })
    } catch (e) {
      console.warn('Error fitting bounds:', e)
    }
  }, [isMapLoaded, biensWithCoords.length, targetCenter])

  // ── Zoom controls ────────────────────────────────────────────────────────
  const zoomIn  = () => mapRef.current?.getMap()?.zoomIn({ duration: 300 })
  const zoomOut = () => mapRef.current?.getMap()?.zoomOut({ duration: 300 })

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

      <style>{`
        @keyframes sonar-wave {
          0% { transform: scale(0.6); opacity: 1; box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); }
          100% { transform: scale(2.5); opacity: 0; box-shadow: 0 0 0 20px rgba(249, 115, 22, 0); }
        }
        .sonar-effect {
          position: absolute;
          width: 44px; height: 44px;
          background: rgba(249, 115, 22, 0.3);
          border: 2px solid rgba(249, 115, 22, 0.5);
          border-radius: 50%;
          animation: sonar-wave 1.8s infinite ease-out;
          z-index: -1;
          pointer-events: none;
        }
        
        @keyframes marker-blink {
          0%, 100% { transform: scale(1); opacity: 1; filter: brightness(1); }
          50% { transform: scale(1.1); opacity: 0.9; filter: brightness(1.3); }
        }
        .marker-blink-animation {
          animation: marker-blink 1s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }

        .premium-glow {
          box-shadow: 0 0 15px rgba(249, 115, 22, 0.5), 0 0 30px rgba(249, 115, 22, 0.3);
        }

        @keyframes user-pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .user-dot-pulse {
          width: 16px; height: 16px; background: #3b82f6; border: 3px solid white;
          border-radius: 50%; box-shadow: 0 4px 8px rgba(0,0,0,0.4);
          animation: user-pulse 2s infinite;
        }
      `}</style>

      {/* ── Mapbox Map ─────────────────────────────────────────────────────── */}
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={ABIDJAN_CENTER}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapTheme}
        onClick={() => setSelectedBien(null)}
        onLoad={() => setIsMapLoaded(true)}
      >
        {/* Route Source & Layer */}
        {routeInfo?.geometry && (
          <Source id="route" type="geojson" data={{ type: 'Feature', properties: {}, geometry: routeInfo.geometry }}>
            <Layer
              id="route-line"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{ 'line-color': '#F97316', 'line-width': 5, 'line-opacity': 0.75 }}
            />
          </Source>
        )}

        <NavigationControl position="bottom-right" />
        <GeolocateControl 
          position="bottom-right" 
          trackUserLocation 
          showUserHeading 
          onGeolocate={(e) => setUserLocation({ lng: e.coords.longitude, lat: e.coords.latitude })}
        />

        {/* User Location Marker fallback if needed */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="user-dot-pulse" />
          </Marker>
        )}
        {biensWithCoords.map((bien, index) => {
          const p = formatPrice(bien)
          const isSelected = selectedBien?.id === bien.id
          const isMeublee = bien.type_bien === 'residence_meublee'
          
          return (
            <Marker
              key={bien.id || index}
              longitude={Number(typeof bien.longitude === 'string' ? bien.longitude.replace(',', '.') : bien.longitude)}
              latitude={Number(typeof bien.latitude === 'string' ? bien.latitude.replace(',', '.') : bien.latitude)}
              anchor="bottom"
              style={{ zIndex: isSelected ? 100 : 1 }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); handleMarkerClick(bien) }}
                className={`group relative flex flex-col items-center outline-none transition-all duration-300 ${!isSelected ? 'marker-blink-animation' : ''}`}
                title={bien.titre}
              >
                {/* Energetic Pulsing Ring for "Clignotant" effect */}
                {!isSelected && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="sonar-effect" />
                  </div>
                )}

                {/* Price bubble / Icon */}
                <div
                  className={`relative transition-all duration-300 ${isSelected ? 'scale-110 -translate-y-2' : 'hover:scale-105'}`}
                  style={{ marginBottom: '4px' }}
                >
                  {/* Availability Dot */}
                  {bien.est_disponible && (
                    <div className="absolute -top-1.5 -right-1.5 z-50 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white shadow-lg"></span>
                    </div>
                  )}

                  {/* Icon for Meublée */}
                  {isMeublee && (
                    <div className="absolute -top-2 -left-2 z-50 text-[16px] drop-shadow-lg">
                      💎
                    </div>
                  )}
                  
                  <div
                    className={`${isSelected ? 'premium-glow' : ''}`}
                    style={{
                      background: isSelected 
                        ? 'var(--accent-luxury)' 
                        : isMeublee 
                          ? 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)'
                          : '#F97316',
                      color: isSelected ? 'var(--midnight)' : '#fff',
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '6px 14px',
                      borderRadius: '16px',
                      boxShadow: isSelected 
                        ? '0 12px 24px rgba(212,175,55,0.7)' 
                        : '0 6px 16px rgba(0,0,0,0.3)',
                      border: isSelected ? '2px solid white' : '1.5px solid white',
                      whiteSpace: 'nowrap',
                      backdropFilter: 'blur(8px)',
                      cursor: 'pointer',
                    }}
                  >
                    <span className="flex items-center gap-1">
                      {p ? `${p.label} FCFA` : TYPE_LABELS[bien.type_bien] ?? bien.type_bien}
                    </span>
                  </div>
                </div>

                {/* Arrow indicator */}
                <div className={`w-3 h-3 rotate-45 -mt-2.5 bg-current border-r border-b border-white ${isSelected ? 'text-[var(--accent-luxury)]' : isMeublee ? 'text-[#B8860B]' : 'text-[#F97316]'}`} />
              </button>
            </Marker>
          )
        })}
      </Map>

      {/* ── Custom info panel ────────────────────────────────────────────────── */}
      {selectedBien && (
        <div
          className="absolute top-3 right-3 z-10 bg-[var(--surface-card)] rounded-xl shadow-xl overflow-hidden animate-scale-in"
          style={{ width: 230, maxWidth: 'calc(100vw - 24px)' }}
        >
          {selectedBien.photo_url ? (
            <div className="relative h-28 bg-gray-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedBien.photo_url} alt={selectedBien.titre} className="w-full h-full object-cover" />
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
          <div className="p-3">
            <p className="font-sans text-sm font-semibold text-[var(--text)] line-clamp-2 leading-tight mb-1">{selectedBien.titre}</p>
            <p className="text-xs text-[var(--text-muted)] font-sans flex items-center gap-1 mb-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-[var(--text-muted)]">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              </svg>
              {selectedBien.quartier ? `${selectedBien.quartier}, ` : ''}{selectedBien.commune}
            </p>
            {prix && (
              <p className="font-bold text-base text-[var(--accent-luxury)] mb-2.5">
                {prix.label}{' '}<span className="font-normal text-xs text-[var(--text-muted)]">FCFA{prix.suffix}</span>
              </p>
            )}
            {routeInfo && (
              <div className="flex items-center justify-between mb-3 bg-[var(--background)]/50 p-2 rounded-lg border border-[var(--border)]">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Distance</span>
                  <span className="text-xs font-bold">{routeInfo.distance.toFixed(1)} km</span>
                </div>
                <div className="h-8 w-px bg-[var(--border)]" />
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">En voiture</span>
                  <span className="text-xs font-bold">~{routeInfo.duration} min</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/biens/${selectedBien.id}`}
                className="flex items-center justify-center bg-[var(--primary)] text-white text-[10px] font-sans font-bold py-2.5 rounded-lg hover:bg-[var(--primary-mid)] transition-colors"
              >
                Voir fiche
              </Link>
              {userLocation && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedBien.latitude},${selectedBien.longitude}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center bg-white text-black text-[10px] border border-black/10 font-sans font-bold py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Itinéraire
                </a>
              )}
            </div>
          </div>
          <button
            onClick={() => setSelectedBien(null)}
            className="absolute top-2 right-2 w-6 h-6 bg-[var(--background)]/40 hover:bg-[var(--background)]/60 text-[var(--text)] rounded-full flex items-center justify-center transition-colors z-10"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Biens count badge */}
      <div className="absolute bottom-3 left-3 z-10 bg-[var(--background)]/90 backdrop-blur-sm text-xs font-sans font-medium text-[var(--text)] px-3 py-1.5 rounded-full shadow-md border border-[var(--border)]">
        📍 {biensWithCoords.length} bien{biensWithCoords.length !== 1 ? 's' : ''} sur la carte
      </div>
    </div>
  )
}
