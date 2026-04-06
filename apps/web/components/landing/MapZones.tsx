const communes = [
  'Cocody',
  'Plateau',
  'Marcory',
  'Yopougon',
  'Adjamé',
  'Abobo',
  'Koumassi',
  'Port-Bouet',
  'Bingerville',
  'Attécoubé',
  'Treichville',
  'Songon',
]

export function MapZones() {
  return (
    <section className="py-20 bg-primary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Zones couvertes à Abidjan
          </h2>
          <p className="font-sans text-white/70 text-lg max-w-xl mx-auto">
            Immo CI couvre les 12 communes d&apos;Abidjan et s&apos;étend progressivement à tout le territoire ivoirien.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {communes.map((commune) => (
            <span
              key={commune}
              className="inline-flex items-center px-4 py-2 rounded-pill bg-white/10 border border-white/20 text-white font-sans text-sm font-medium hover:bg-white/20 transition-colors cursor-pointer"
            >
              {commune}
            </span>
          ))}
        </div>

        <p className="text-center mt-10 font-sans text-white/50 text-sm">
          + Bouaké, Yamoussoukro, San-Pédro et d&apos;autres villes à venir
        </p>
      </div>
    </section>
  )
}
