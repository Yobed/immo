const stats = [
  {
    value: '2 450',
    label: 'Biens disponibles',
    suffix: '',
  },
  {
    value: '12',
    label: 'Communes couvertes',
    suffix: '',
  },
  {
    value: '98',
    label: 'Satisfaction client',
    suffix: '%',
  },
  {
    value: '4.8',
    label: 'Note moyenne',
    suffix: '/5',
  },
]

export function Stats() {
  return (
    <section className="py-20 bg-primary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Immo CI en chiffres
          </h2>
          <p className="font-sans text-white/70 text-lg max-w-xl mx-auto">
            La confiance de milliers d&apos;ivoiriens, prouvée par les données.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-mono text-4xl md:text-5xl font-bold text-secondary mb-2">
                {stat.value}
                <span className="text-2xl md:text-3xl">{stat.suffix}</span>
              </p>
              <p className="font-sans text-white/70 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
