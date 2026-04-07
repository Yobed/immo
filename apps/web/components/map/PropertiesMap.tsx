'use client'
// ANTI-PATTERN CRITIQUE: Ne jamais importer mapbox-gl ou react-map-gl en import statique au top
// mapbox-gl accède à window sur import — dynamic import obligatoire pour éviter SSR crash
import dynamic from 'next/dynamic'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { MAPBOX_TOKEN, ABIDJAN_CENTER } from '@/lib/mapbox'

// Imports dynamiques obligatoires — ssr: false empêche mapbox-gl d'accéder à window côté serveur
const Map = dynamic(() => import('react-map-gl').then((m) => m.Map), { ssr: false })
const Marker = dynamic(() => import('react-map-gl').then((m) => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-map-gl').then((m) => m.Popup), { ssr: false })

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
}

export function PropertiesMap({ biens, hauteur = 500 }: PropertiesMapProps) {
  const [selectedBien, setSelectedBien] = useState<BienMarker | null>(null)

  const handleMarkerClick = useCallback((bien: BienMarker) => {
    setSelectedBien((prev) => (prev?.id === bien.id ? null : bien))
  }, [])

  const biensWithCoords = biens.filter(
    (b) => b.latitude !== null && b.longitude !== null
  )

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className="w-full rounded-card bg-[var(--surface)] flex items-center justify-center border border-[var(--border)]"
        style={{ height: hauteur }}
      >
        <p className="text-muted font-sans text-sm">
          Carte non disponible — configurer NEXT_PUBLIC_MAPBOX_TOKEN
        </p>
      </div>
    )
  }

  return (
    <div
      className="w-full rounded-card overflow-hidden border border-[var(--border)]"
      style={{ height: hauteur }}
    >
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={ABIDJAN_CENTER}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {biensWithCoords.map((bien) => (
          <Marker
            key={bien.id}
            longitude={bien.longitude!}
            latitude={bien.latitude!}
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
            longitude={selectedBien.longitude}
            latitude={selectedBien.latitude}
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
