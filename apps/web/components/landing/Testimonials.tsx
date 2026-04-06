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
        <span
          key={i}
          className={i < rating ? 'text-secondary' : 'text-gray-200'}
          aria-hidden="true"
        >
          &#9733;
        </span>
      ))}
    </div>
  )
}

export function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Ce que disent nos utilisateurs
          </h2>
          <p className="font-sans text-muted text-lg max-w-xl mx-auto">
            Des milliers de propriétaires, locataires et agences nous font confiance chaque jour.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-surface rounded-card p-6 flex flex-col gap-4"
            >
              <StarRating rating={t.rating} />
              <p className="font-sans text-sm text-gray-700 leading-relaxed flex-1">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-mono text-xs font-semibold shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-sans text-sm font-semibold text-gray-800">{t.name}</p>
                  <p className="font-sans text-xs text-muted">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
