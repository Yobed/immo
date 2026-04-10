'use client'
import { useInView } from '@/hooks/useInView'

const testimonials = [
  {
    id: 1,
    name: 'Kouassi Yao',
    role: 'Propriétaire — Cocody',
    avatar: 'KY',
    rating: 5,
    text: "Grâce à Immo CI, j'ai loué mon appartement en moins d'une semaine. Le processus est simple, les paiements via Wave arrivent directement sur mon compte. Je recommande vivement !",
  },
  {
    id: 2,
    name: 'Aminata Koné',
    role: 'Locataire — Plateau',
    avatar: 'AK',
    rating: 5,
    text: "J'ai trouvé mon studio au Plateau en 3 jours. La visite virtuelle 360° m'a permis de choisir sans même me déplacer. Le contrat OHADA est rassurant et tout est professionnel.",
  },
  {
    id: 3,
    name: 'Agence Prestige Immo',
    role: 'Agence — Marcory',
    avatar: 'PI',
    rating: 5,
    text: "Notre agence gère plus de 200 biens sur Immo CI. Le dashboard analytics nous donne une visibilité parfaite. Les leads sont qualifiés et le support client est excellent.",
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Note: ${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? 'text-secondary' : 'text-[var(--border)]'} aria-hidden="true">
          &#9733;
        </span>
      ))}
    </div>
  )
}

export function Testimonials() {
  const { ref, visible } = useInView(0.1)

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-14 sm:py-20 bg-[var(--primary)] relative overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-0 w-80 h-80 rounded-full bg-[var(--secondary)]/6 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/4 blur-3xl pointer-events-none" />

      <div className="relative container mx-auto px-4">
        <div className={`text-center mb-14 sr sr-up ${visible ? 'visible' : ''}`}>
          <p className="font-sans text-sm font-semibold text-[var(--secondary)] uppercase tracking-widest mb-3">
            Témoignages
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Ce que disent nos utilisateurs
          </h2>
          <p className="font-sans text-white/60 text-base max-w-xl mx-auto">
            Des milliers de propriétaires, locataires et agences nous font confiance chaque jour.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={t.id}
              className={`sr sr-up ${visible ? 'visible' : ''} bg-white/8 border border-white/12 rounded-[20px] p-6 flex flex-col gap-4 hover:bg-white/12 transition-all duration-700`}
              style={{ transitionDelay: visible ? `${80 + i * 120}ms` : '0ms' }}
            >
              <StarRating rating={t.rating} />
              <p className="font-sans text-sm text-white/80 leading-relaxed flex-1">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-white/15">
                <div className="w-10 h-10 rounded-full bg-[var(--secondary)] flex items-center justify-center text-white font-mono text-xs font-semibold shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-sans text-sm font-semibold text-white">{t.name}</p>
                  <p className="font-sans text-xs text-white/50">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
