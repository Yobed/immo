const StatIcon = ({ type }: { type: string }) => {
  if (type === 'biens') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/80 mx-auto">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )
  if (type === 'communes') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/80 mx-auto">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  )
  if (type === 'satisfaction') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/80 mx-auto">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
      <line x1="9" y1="9" x2="9.01" y2="9"/>
      <line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  )
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/80 mx-auto">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

const stats = [
  { value: '2 450', label: 'Biens disponibles',  suffix: '',  iconType: 'biens' },
  { value: '12',   label: 'Communes couvertes', suffix: '',  iconType: 'communes' },
  { value: '98',   label: 'Satisfaction client', suffix: '%', iconType: 'satisfaction' },
  { value: '4.8',  label: 'Note moyenne',        suffix: '/5',iconType: 'note' },
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
                <div className="mb-3"><StatIcon type={stat.iconType} /></div>
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
