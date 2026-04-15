'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const PropertiesMap = dynamic(
  () => import('@/components/map/PropertiesMap').then((m) => m.PropertiesMap),
  { ssr: false, loading: () => <div style={{ height: 550 }} className="w-full rounded-[20px] bg-white/10 animate-pulse" /> }
)

const communesCoords: Record<string, { lat: number, lng: number }> = {
  'Cocody': { lat: 5.345, lng: -3.985 },
  'Plateau': { lat: 5.326, lng: -4.017 },
  'Marcory': { lat: 5.304, lng: -3.974 },
  'Yopougon': { lat: 5.334, lng: -4.053 },
  'Adjamé': { lat: 5.356, lng: -4.020 },
  'Abobo': { lat: 5.421, lng: -4.017 },
  'Koumassi': { lat: 5.295, lng: -3.945 },
  'Port-Bouet': { lat: 5.253, lng: -3.944 },
  'Bingerville': { lat: 5.353, lng: -3.886 },
  'Attécoubé': { lat: 5.332, lng: -4.032 },
  'Treichville': { lat: 5.303, lng: -4.008 },
  'Songon': { lat: 5.312, lng: -4.225 }
}
const communes = Object.keys(communesCoords)

interface BienMarker {
  id: string
  titre: string
  commune: string
  latitude: number | null
  longitude: number | null
  prix_mois_fcfa: number | null
  prix_vente_fcfa: number | null
}

export function MapZones({ biens }: { biens: BienMarker[] }) {
  const [activeCommune, setActiveCommune] = useState<string | null>(null)
  const biensWithCoords = biens.filter(b => b.latitude && b.longitude)

  const filteredBiens = activeCommune 
    ? biensWithCoords.filter(b => b.commune === activeCommune)
    : biensWithCoords;

  const targetCenter = activeCommune ? communesCoords[activeCommune] : null;

  return (
    <section className="py-24 bg-[#0C2D5E] relative overflow-hidden">
      {/* Texture bg */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} 
      />
      
      <div className="container relative z-10 mx-auto px-4">
        <ScrollReveal className="text-center mb-16">
          <p className="font-sans text-xs font-bold text-[var(--secondary)] uppercase tracking-[0.2em] mb-4">
            Couverture Nationale
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
            Découvrez nos exclusivités sur la carte
          </h2>
          <p className="font-sans text-white/70 text-lg md:text-xl max-w-2xl mx-auto">
            Filtrez par commune pour naviguer visuellement dans notre catalogue géolocalisé.
          </p>
        </ScrollReveal>

        {biensWithCoords.length > 0 && (
          <ScrollReveal delay={0.2} className="max-w-6xl mx-auto rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 p-1.5 bg-white/5 backdrop-blur-xl mb-16">
            <div className="rounded-[20px] overflow-hidden relative">
               <PropertiesMap 
                 biens={filteredBiens} 
                 hauteur={550} 
                 mapTheme="mapbox://styles/mapbox/streets-v12" 
                 targetCenter={targetCenter}
               />
            </div>
          </ScrollReveal>
        )}

        <ScrollReveal delay={0.3} className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {communes.map((commune) => {
            const isActive = activeCommune === commune
            return (
              <button
                key={commune}
                onClick={() => setActiveCommune(isActive ? null : commune)}
                className={`inline-flex items-center px-4 py-2 rounded-full border transition-all duration-300 backdrop-blur ${
                  isActive 
                  ? 'bg-[var(--secondary)] border-[var(--secondary)] text-white shadow-lg scale-105'
                  : 'bg-white/5 border-white/10 text-white font-sans hover:bg-white/20 hover:border-white/30'
                } text-sm font-medium focus:outline-none`}
              >
                {commune}
              </button>
            )
          })}
        </ScrollReveal>

        <ScrollReveal delay={0.4} className="text-center mt-10 font-sans text-white/40 text-xs tracking-wider uppercase">
          + Bouaké, Yamoussoukro, San-Pédro et d&apos;autres villes à venir
        </ScrollReveal>
      </div>
    </section>
  )
}
