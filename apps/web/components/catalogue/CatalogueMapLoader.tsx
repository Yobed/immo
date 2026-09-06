'use client'

import dynamic from 'next/dynamic'

// Next 15 : `ssr: false` avec next/dynamic est interdit dans un Server Component.
// On isole donc le chargement dynamique de la carte (Mapbox = gros bundle,
// client-only) dans ce module client, importé par la page catalogue (serveur).
export const CatalogueMapView = dynamic(
  () => import('./CatalogueMapView').then((m) => m.CatalogueMapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[60vh] flex items-center justify-center bg-[var(--surface-card)] rounded-2xl border border-[var(--border)]">
        <p className="text-[var(--text-muted)] text-sm">Chargement de la carte...</p>
      </div>
    ),
  },
)
