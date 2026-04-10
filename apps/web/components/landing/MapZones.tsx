'use client'
import { useInView } from '@/hooks/useInView'

const communes = [
  'Cocody', 'Plateau', 'Marcory', 'Yopougon', 'Adjamé', 'Abobo',
  'Koumassi', 'Port-Bouet', 'Bingerville', 'Attécoubé', 'Treichville', 'Songon',
]

export function MapZones() {
  const { ref, visible } = useInView(0.1)

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-20 bg-primary">
      <div className="container mx-auto px-4">
        <div className={`text-center mb-12 sr sr-up ${visible ? 'visible' : ''}`}>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Zones couvertes à Abidjan
          </h2>
          <p className="font-sans text-white/70 text-lg max-w-xl mx-auto">
            Immo CI couvre les 12 communes d&apos;Abidjan et s&apos;étend progressivement à tout le territoire ivoirien.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {communes.map((commune, i) => (
            <span
              key={commune}
              className={`sr sr-scale ${visible ? 'visible' : ''} inline-flex items-center px-4 py-2 rounded-pill bg-white/10 border border-white/20 text-white font-sans text-sm font-medium hover:bg-white/20 hover:border-white/40 hover:scale-105 transition-all duration-300 cursor-pointer`}
              style={{ transitionDelay: visible ? `${i * 50}ms` : '0ms' }}
            >
              {commune}
            </span>
          ))}
        </div>

        <p className={`sr sr-up ${visible ? 'visible' : ''} text-center mt-10 font-sans text-white/50 text-sm`}
          style={{ transitionDelay: visible ? '650ms' : '0ms' }}>
          + Bouaké, Yamoussoukro, San-Pédro et d&apos;autres villes à venir
        </p>
      </div>
    </section>
  )
}
