'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Navigation, MapPin, Layers, ZoomIn, ZoomOut, Compass, 
  ExternalLink, Check, Calendar, MessageCircle, X, ChevronRight,
  Maximize2, RotateCcw
} from 'lucide-react';
import { Property, Visit } from '@/lib/types';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';

// Import Leaflet dynamically in useEffect to prevent SSR window issues
import type * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface AbidjanOpenStreetMapProps {
  visits: Visit[];
  properties: Property[];
  onSelectVisit?: (visit: Visit) => void;
}

// Coordonnées géographiques d'Abidjan
const ABIDJAN_CENTER = { lat: 5.3450, lng: -3.9900, zoom: 12 };

// Propriétés avec coordonnées exactes à Abidjan
const PROPERTY_COORDS: Record<string, { lat: number; lng: number; priceLabel: string; commune: string }> = {
  'prop-001': { lat: 5.3475, lng: -3.9785, priceLabel: '3.8 M/mois', commune: 'Cocody Riviera Golf' },
  'prop-002': { lat: 5.2950, lng: -3.9920, priceLabel: '2.8 M/mois', commune: 'Marcory Zone 4' },
  'prop-003': { lat: 5.3260, lng: -4.0200, priceLabel: '1.8 M/mois', commune: 'Plateau' },
  'prop-004': { lat: 5.3580, lng: -3.9650, priceLabel: '4.2 M/mois', commune: 'Riviera Beverly Hills' },
  'prop-005': { lat: 5.1320, lng: -3.2840, priceLabel: '5.5 M/mois', commune: 'Assinie-Mafia PK 9' },
  'prop-006': { lat: 5.3380, lng: -4.0010, priceLabel: '3.2 M/mois', commune: 'Cocody Danga' },
};

export default function AbidjanOpenStreetMap({ visits, properties, onSelectVisit }: AbidjanOpenStreetMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('TOUS');
  const [selectedPropId, setSelectedPropId] = useState<string | null>('prop-001');
  const [mapLayerType, setMapLayerType] = useState<'satellite' | 'streets'>('satellite');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>({ lat: 5.3350, lng: -3.9850 }); // Agence Cocody
  const [itineraryActive, setItineraryActive] = useState(true);

  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Selected property
  const selectedProperty = properties.find(p => p.id === selectedPropId) || properties[0];
  const selectedVisit = visits.find(v => v.property_id === selectedPropId);

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const leaflet = await import('leaflet');

      // Create map instance
      const map = leaflet.map(mapContainerRef.current, {
        center: [ABIDJAN_CENTER.lat, ABIDJAN_CENTER.lng],
        zoom: ABIDJAN_CENTER.zoom,
        zoomControl: false, // We use custom zoom controls
        attributionControl: false
      });

      // Add Tile Layer (Satellite Esri or OpenStreetMap)
      const tileUrl = mapLayerType === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const tileLayer = leaflet.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;

      // Add custom scale / attribution in corner
      leaflet.control.attribution({ position: 'bottomright', prefix: '© OpenStreetMap · Esri Satellite' }).addTo(map);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Layer when mapLayerType changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((leaflet) => {
      if (!mapInstanceRef.current) return;
      if (tileLayerRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      }
      const newUrl = mapLayerType === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const newTileLayer = leaflet.tileLayer(newUrl, {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(mapInstanceRef.current);

      tileLayerRef.current = newTileLayer;
    });
  }, [mapLayerType]);

  // Update Markers & Itinerary
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import('leaflet').then((leaflet) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Remove existing markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
        routePolylineRef.current = null;
      }

      // Filtered properties
      const filteredProps = properties.filter(p => {
        if (activeTypeFilter === 'TOUS') return true;
        if (activeTypeFilter === 'LOCATION') return p.operation === 'rent';
        if (activeTypeFilter === 'VENTE') return p.operation === 'sale';
        if (activeTypeFilter === 'Villas de Luxe') return p.property_type === 'villa';
        if (activeTypeFilter === 'Appartements') return p.property_type === 'appartement';
        if (activeTypeFilter === 'Bureaux') return p.property_type === 'bureau';
        return true;
      });

      // Add User Location Marker
      if (userPos) {
        const userIcon = leaflet.divIcon({
          className: 'custom-user-marker',
          html: `
            <div style="position:relative; width:22px; height:22px;">
              <div style="position:absolute; inset:-8px; border-radius:50%; background:rgba(59,130,246,0.3); animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
              <div style="width:20px; height:20px; border-radius:50%; background:#2563EB; border:3px solid #FFFFFF; box-shadow:0 0 10px rgba(0,0,0,0.5);"></div>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        if (userMarkerRef.current) userMarkerRef.current.remove();
        userMarkerRef.current = leaflet.marker([userPos.lat, userPos.lng], { icon: userIcon }).addTo(map);
      }

      // Add Property Markers
      filteredProps.forEach(prop => {
        const coords = PROPERTY_COORDS[prop.id];
        if (!coords) return;

        const isSelected = selectedPropId === prop.id;

        const customMarkerIcon = leaflet.divIcon({
          className: 'custom-prop-marker',
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer; transform:translateY(${isSelected ? '-6px' : '0'}); transition:all 0.2s;">
              
              <!-- Price Pill Badge (Exactement comme le screenshot de référence) -->
              <div style="
                background: ${isSelected ? '#FFD84D' : 'rgba(23, 24, 29, 0.88)'}; 
                color: ${isSelected ? '#15161A' : '#FFFFFF'}; 
                border: 1.5px solid ${isSelected ? '#FFFFFF' : 'rgba(255, 216, 77, 0.6)'}; 
                padding: 4px 10px; 
                border-radius: 9999px; 
                font-family: ui-sans-serif, system-ui, sans-serif;
                font-size: 11px; 
                font-weight: 800; 
                box-shadow: 0 4px 15px rgba(0,0,0,0.4); 
                backdrop-filter: blur(8px);
                white-space: nowrap;
                margin-bottom: 4px;
              ">
                ${coords.priceLabel}
              </div>

              <!-- Center Dot with Pulse -->
              <div style="position:relative; width:16px; height:16px;">
                <div style="
                  position: absolute; 
                  inset: -6px; 
                  border-radius: 50%; 
                  background: ${isSelected ? 'rgba(255, 216, 77, 0.4)' : 'rgba(46, 91, 255, 0.3)'}; 
                  animation: ping 2.5s cubic-bezier(0,0,0.2,1) infinite;
                "></div>
                <div style="
                  width: 16px; 
                  height: 16px; 
                  border-radius: 50%; 
                  background: ${isSelected ? '#FFD84D' : '#2E5BFF'}; 
                  border: 2.5px solid #FFFFFF; 
                  box-shadow: 0 2px 8px rgba(0,0,0,0.6);
                "></div>
              </div>

            </div>
          `,
          iconSize: [80, 50],
          iconAnchor: [40, 48]
        });

        const marker = leaflet.marker([coords.lat, coords.lng], { icon: customMarkerIcon }).addTo(map);
        
        marker.on('click', () => {
          setSelectedPropId(prop.id);
          const v = visits.find(vis => vis.property_id === prop.id);
          if (v && onSelectVisit) onSelectVisit(v);
        });

        markersRef.current.push(marker);
      });

      // Draw Itinerary Route if active
      if (itineraryActive && selectedPropId && userPos && PROPERTY_COORDS[selectedPropId]) {
        const dest = PROPERTY_COORDS[selectedPropId];
        
        // Polyline connecting user to selected property
        const route = leaflet.polyline([
          [userPos.lat, userPos.lng],
          [(userPos.lat + dest.lat) / 2 + 0.005, (userPos.lng + dest.lng) / 2], // Slight bend over Boulevard
          [dest.lat, dest.lng]
        ], {
          color: '#3B82F6',
          weight: 5,
          opacity: 0.85,
          dashArray: '8, 8',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        routePolylineRef.current = route;
      }
    });
  }, [properties, visits, activeTypeFilter, selectedPropId, userPos, itineraryActive, onSelectVisit]);

  // Center map on selected property
  const handleFlyTo = (propId: string) => {
    setSelectedPropId(propId);
    const coords = PROPERTY_COORDS[propId];
    if (coords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([coords.lat, coords.lng], 14, { duration: 1.2 });
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleCenterUser = () => {
    if (userPos && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userPos.lat, userPos.lng], 13, { duration: 1 });
    }
  };

  return (
    <div className="w-full rounded-3xl overflow-hidden bg-[#0F172A] border border-slate-800 shadow-warm-xl relative font-sans text-white">
      
      {/* ========================================================================= */}
      {/* 1. TOP BAR DE FILTRES HORIZONTAUX (STYLE DU SCREENSHOT DE RÉFÉRENCE)      */}
      {/* ========================================================================= */}
      <div className="p-3 sm:p-4 bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-20 relative">
        
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none flex-1">
          {[
            'TOUS', 
            'LOCATION', 
            'VENTE', 
            'Villas de Luxe', 
            'Appartements', 
            'Bureaux'
          ].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveTypeFilter(type)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTypeFilter === type
                  ? 'bg-white text-slate-900 shadow-md scale-102'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Layer Switcher (Satellite vs OpenStreetMap) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-0.5 bg-slate-800 rounded-xl border border-slate-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMapLayerType('satellite')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                mapLayerType === 'satellite' ? 'bg-[#FFD84D] text-[#15161A] font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite HD
            </button>
            <button
              type="button"
              onClick={() => setMapLayerType('streets')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                mapLayerType === 'streets' ? 'bg-white text-slate-900 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              OpenStreetMap
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. CONTENEUR CARTE PLEINE LARGEUR (LEAFLET + TILES ABIDJAN SATELLITE/OSM) */}
      {/* ========================================================================= */}
      <div className="relative w-full h-[540px] sm:h-[620px]">
        
        {/* Carte Leaflet */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Top-Left Floating Pills (Comme sur l'image de référence) */}
        <div className="absolute top-4 left-4 z-10 space-y-2 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#15161A]/90 backdrop-blur-md border border-slate-700/80 text-xs font-semibold shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
            <span className="text-white text-[11px]">MA POSITION · GPS Actif</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#15161A]/90 backdrop-blur-md border border-slate-700/80 text-xs font-semibold shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#FFD84D]" />
            <span className="text-[#FFD84D] text-[11px] font-bold">
              {properties.length} RÉSIDENCES &amp; BAUX
            </span>
          </div>
        </div>

        {/* Right Map Controls (Zoom & Localisation) */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-9 h-9 rounded-xl bg-[#15161A]/90 hover:bg-black text-white border border-slate-700 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
            title="Zoom avant"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-9 h-9 rounded-xl bg-[#15161A]/90 hover:bg-black text-white border border-slate-700 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
            title="Zoom arrière"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCenterUser}
            className="w-9 h-9 rounded-xl bg-[#15161A]/90 hover:bg-black text-white border border-slate-700 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
            title="Centrer sur ma position"
          >
            <Navigation className="w-4 h-4 text-[#3B82F6]" />
          </button>
        </div>

        {/* POPUP FLOTTANTE À DROITE (STYLE DU SCREENSHOT DE RÉFÉRENCE) */}
        {selectedProperty && (
          <div className="absolute top-4 right-16 sm:right-16 z-10 w-72 sm:w-80 bg-[#161D2B]/95 backdrop-blur-xl rounded-2xl border border-slate-700/80 p-4 shadow-2xl pointer-events-auto text-white space-y-3 animate-in fade-in slide-in-from-right-4 duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#FFD84D]">
                ABIDJAN · {selectedProperty.district}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPropId(null)}
                className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Photo & Titre */}
            <div className="space-y-1.5">
              {selectedProperty.images[0] && (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-700/80">
                  <Image 
                    src={selectedProperty.images[0]} 
                    alt={selectedProperty.title} 
                    fill 
                    className="object-cover" 
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white">
                    Réf. {selectedProperty.reference}
                  </div>
                </div>
              )}

              <h4 className="font-bold text-sm text-white line-clamp-2 leading-snug">
                {selectedProperty.title}
              </h4>

              <div className="text-base font-extrabold text-[#FFD84D]">
                {formatFCFA(selectedProperty.price)} <span className="text-xs font-normal text-slate-400">/ mois</span>
              </div>
            </div>

            {/* Détails Visite Associée */}
            {selectedVisit && (
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold">Visite Terrain :</span>
                  <span className="text-amber-400 font-bold">
                    {new Date(selectedVisit.scheduled_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {new Date(selectedVisit.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Négociateur : {selectedVisit.agent_name}
                </div>
              </div>
            )}

            {/* Bouton Consulter les Détails (Doré comme sur l'image) */}
            <div className="pt-1 flex gap-2">
              <Link
                href={`/biens/${selectedProperty.id}`}
                target="_blank"
                className="flex-1 py-2.5 rounded-xl bg-[#D9A05B] hover:bg-[#c9904b] text-[#15161A] font-bold text-xs text-center uppercase tracking-wider transition-all shadow-md active:scale-98"
              >
                Consulter les détails
              </Link>
            </div>

          </div>
        )}

        {/* BOTTOM FLOATING ITINERARY STRIP (STYLE DU SCREENSHOT DE RÉFÉRENCE) */}
        {selectedProperty && itineraryActive && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 z-10 pointer-events-auto">
            <div className="bg-[#15161A]/95 backdrop-blur-md rounded-2xl border border-slate-700 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
              
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-3 h-3 rounded-full bg-[#3B82F6] animate-pulse shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#FFD84D] block truncate">
                    Itinéraire vers : {selectedProperty.title}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium block truncate">
                    Départ : Agence Cocody • Traversée Boulevard Mitterrand / HKB • ~14 minutes
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedProperty.address + ', ' + selectedProperty.city)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Démarrer GPS</span>
                </a>

                <button
                  type="button"
                  onClick={() => setItineraryActive(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Fermer l'itinéraire"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Mini Liste de Raccourcis Rapides vers les Biens */}
      <div className="p-3 bg-[#0B1120] border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
        <span className="text-slate-400 font-semibold uppercase text-[10px] shrink-0 mr-1">Secteurs Abidjan :</span>
        {properties.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleFlyTo(p.id)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedPropId === p.id 
                ? 'bg-[#FFD84D] text-[#15161A] font-bold' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {p.district.split(' ')[0]} ({formatFCFA(p.price).replace(' FCFA', '')})
          </button>
        ))}
      </div>

    </div>
  );
}
