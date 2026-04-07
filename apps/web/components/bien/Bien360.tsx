'use client'
import dynamic from 'next/dynamic'

// Import dynamique obligatoire — pannellum-react accède à window sur import
// NE PAS importer pannellum-react en statique (crash SSR)
const Pannellum = dynamic(
  () => import('pannellum-react').then((m) => m.Pannellum),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[320px] bg-gray-900 rounded-card flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
          <span className="text-white/50 text-sm font-sans">Chargement vue 360°...</span>
        </div>
      </div>
    ),
  }
)

interface Hotspot {
  pitch: number
  yaw: number
  texte: string
}

interface Bien360Props {
  panoramaUrl: string
  hotspots?: Hotspot[]
  hauteur?: number
  className?: string
}

export function Bien360({
  panoramaUrl,
  hotspots = [],
  hauteur = 320,
  className = '',
}: Bien360Props) {
  return (
    <div
      className={`w-full rounded-card overflow-hidden relative ${className}`}
      style={{ height: hauteur }}
    >
      <Pannellum
        width="100%"
        height={`${hauteur}px`}
        image={panoramaUrl}
        pitch={10}
        yaw={180}
        hfov={110}
        autoLoad
        autoRotate={-2}
        compass
        showZoomCtrl
        showFullscreenCtrl
        hotSpots={hotspots.map((h) => ({
          pitch: h.pitch,
          yaw: h.yaw,
          type: 'info',
          text: h.texte,
          cssClass: 'custom-hotspot',
        }))}
      />
      {/* Indicateur overlaid */}
      <div className="absolute top-3 left-3 bg-purple-100 text-purple-700 text-xs font-sans font-medium px-2 py-1 rounded-pill pointer-events-none">
        Vue 360° — Glisser pour naviguer
      </div>
    </div>
  )
}
