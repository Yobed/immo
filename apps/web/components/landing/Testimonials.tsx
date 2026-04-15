'use client'
import { useInView } from '@/hooks/useInView'

const testimonials = [
  {
    id: 1,
    name: 'Kouassi Yao',
    role: 'Propriétaire',
    location: 'Cocody',
    avatar: 'KY',
    rating: 5,
    text: "Grâce à Immo CI, j'ai loué mon appartement en moins d'une semaine. Les paiements via Wave arrivent directement sur mon compte. Je recommande vivement !",
    color: '#F97316',
  },
  {
    id: 2,
    name: 'Aminata Koné',
    role: 'Locataire',
    location: 'Plateau',
    avatar: 'AK',
    rating: 5,
    text: "J'ai trouvé mon studio au Plateau en 3 jours. La visite virtuelle 360° m'a permis de choisir sans me déplacer. Le contrat OHADA est rassurant.",
    color: '#0D9F6E',
  },
  {
    id: 3,
    name: 'Prestige Immo',
    role: 'Agence partenaire',
    location: 'Marcory',
    avatar: 'PI',
    rating: 5,
    text: "Notre agence gère plus de 200 biens sur Immo CI. Le dashboard analytics nous donne une visibilité parfaite et les leads sont toujours qualifiés.",
    color: '#1A4D8F',
  },
]

export function Testimonials() {
  const { ref, visible } = useInView(0.1)

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="py-20 sm:py-28 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F0F5FF 100%)' }}
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid opacity-25 pointer-events-none" />

      {/* Orb */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(249,115,22,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }}
      />

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <div className={`text-center mb-16 sr sr-up ${visible ? 'visible' : ''}`}>
          {/* Stars row */}
          <div className="flex justify-center gap-1 mb-4">
            {[1,2,3,4,5].map(i => (
              <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#F97316">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            ))}
          </div>
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full border border-secondary/25 bg-secondary/8 text-secondary text-xs font-bold uppercase tracking-wider font-sans">
            Témoignages
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary mb-4 mt-2">
            Ce que disent nos utilisateurs
          </h2>
          <p className="font-sans text-muted text-lg max-w-xl mx-auto leading-relaxed">
            Des milliers de propriétaires, locataires et agences nous font confiance chaque jour.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={t.id}
              className={`sr sr-up ${visible ? 'visible' : ''} group relative bg-white rounded-[22px] p-7 flex flex-col gap-4 transition-all duration-700 hover:-translate-y-2`}
              style={{
                transitionDelay: visible ? `${80 + i * 130}ms` : '0ms',
                boxShadow: '0 2px 20px rgba(12,45,94,0.06), 0 0 0 1px rgba(12,45,94,0.06)',
              }}
            >
              {/* Top accent */}
              <div
                className="absolute top-0 left-7 right-7 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${t.color}, transparent)` }}
              />

              {/* Quote icon */}
              <svg className="absolute top-5 right-5 opacity-8" width="36" height="36" viewBox="0 0 24 24" fill={t.color}>
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
              </svg>

              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={t.color}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>

              {/* Text */}
              <p className="font-sans text-base text-gray-600 leading-relaxed flex-1 italic">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-mono text-xs font-bold shrink-0"
                  style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}80)` }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="font-sans text-base font-bold text-primary">{t.name}</p>
                  <p className="font-sans text-sm text-muted">{t.role} · {t.location}</p>
                </div>
                {/* Verified badge */}
                <div className="ml-auto flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={t.color}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="font-sans text-[10px] text-muted">Vérifié</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom counter */}
        <div className={`sr sr-up ${visible ? 'visible' : ''} text-center mt-14`} style={{ transitionDelay: visible ? '450ms' : '0ms' }}>
          <p className="font-sans text-sm text-muted">
            Rejoignez{' '}
            <span className="font-bold text-primary">+2 450 utilisateurs</span>{' '}
            qui nous font déjà confiance
          </p>
        </div>
      </div>
    </section>
  )
}
