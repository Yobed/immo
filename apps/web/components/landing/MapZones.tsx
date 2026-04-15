'use client'
import { PropertiesMap } from '@/components/map/PropertiesMap'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const communes = [
  'Cocody', 'Plateau', 'Marcory', 'Yopougon', 'Adjamé', 'Abobo',
  'Koumassi', 'Port-Bouet', 'Bingerville', 'Attécoubé', 'Treichville', 'Songon',
]

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
  const biensWithCoords = biens.filter(b => b.latitude && b.longitude)

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
            Passez la carte en revue et naviguez visuellement dans notre catalogue géolocalisé pour trouver la perle rare.
          </p>
        </ScrollReveal>

        {biensWithCoords.length > 0 && (
          <ScrollReveal delay={0.2} className="max-w-6xl mx-auto rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 p-1.5 bg-white/5 backdrop-blur-xl mb-16">
            <div className="rounded-[20px] overflow-hidden relative">
               <PropertiesMap biens={biensWithCoords} hauteur={550} mapTheme="mapbox://styles/mapbox/dark-v11" />
            </div>
          </ScrollReveal>
        )}

        <ScrollReveal delay={0.3} className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {communes.map((commune) => (
            <span
              key={commune}
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white font-sans text-sm font-medium hover:bg-[var(--secondary)] hover:border-transparent transition-all duration-300 backdrop-blur cursor-pointer"
            >
              {commune}
            </span>
          ))}
        </ScrollReveal>

        <ScrollReveal delay={0.4} className="text-center mt-10 font-sans text-white/40 text-xs tracking-wider uppercase">
          + Bouaké, Yamoussoukro, San-Pédro et d&apos;autres villes à venir
        </ScrollReveal>
      </div>
    </section>
  )
}
