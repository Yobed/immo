const stats = [
  { value: '2 450', label: 'Biens disponibles',  suffix: '',  icon: '🏘️' },
  { value: '12',   label: 'Communes couvertes', suffix: '',  icon: '📍' },
  { value: '98',   label: 'Satisfaction client', suffix: '%', icon: '⭐' },
  { value: '4.8',  label: 'Note moyenne',        suffix: '/5',icon: '🏆' },
]

export function Stats() {
  return (
    <section className="py-20 relative overflow-hidden bg-[var(--primary)]">
      <div className="absolute inset-0 bg-gradient-animated opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-dots opacity-25 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[var(--secondary)]/8 blur-3xl pointer-events-none" />

      <div className="relative container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="font-sans text-sm font-semibold text-[var(--secondary)] uppercase tracking-widest mb-3">
            Nos résultats
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
            Immo CI en chiffres
          </h2>
          <p className="font-sans text-white/60 text-base max-w-lg mx-auto">
            La confiance de milliers d&apos;ivoiriens, prouvée par les données.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="group relative bg-white/8 border border-white/12 rounded-[20px] p-6 text-center overflow-hidden hover:bg-white/12 transition-colors duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="text-3xl mb-3">{stat.icon}</div>
                <p className="font-mono text-4xl md:text-5xl font-bold mb-1"
                  style={{
                    background: 'linear-gradient(135deg,#E8B84B,#BF8C2C)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                  {stat.value}
                  <span className="text-2xl">{stat.suffix}</span>
                </p>
                <p className="font-sans text-white/65 text-sm leading-tight">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
