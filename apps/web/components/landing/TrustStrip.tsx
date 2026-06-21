import { Gift, ShieldCheck, Lock } from 'lucide-react'

/**
 * Bandeau confiance — répond aux 3 peurs immédiates d'un novice ivoirien
 * (coût caché, fausse annonce, arnaque) juste sous le hero, AVANT les chiffres.
 * Visible mobile inclus (l'intro du hero est masquée < md).
 */
const REASONS = [
  {
    icon: Gift,
    title: 'Gratuit pour vous',
    text: 'Chercher, visiter et réserver ne coûte rien. Vous ne payez que le loyer ou l’achat.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: ShieldCheck,
    title: 'Biens vérifiés',
    text: 'Propriétaire et documents contrôlés avant chaque visite. Pas de fausses annonces.',
    color: 'text-blue-600',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Lock,
    title: 'Zéro arnaque',
    text: 'Un conseiller BOGBE’S coordonne tout. Pas de contact direct, vos coordonnées restent protégées.',
    color: 'text-[var(--accent-luxury)]',
    bg: 'bg-accent-luxury/10',
  },
] as const

export function TrustStrip() {
  return (
    <section
      aria-labelledby="trust-heading"
      className="relative bg-[var(--background)] pt-8 md:pt-12 -mt-px"
    >
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <h2 id="trust-heading" className="text-center text-sm md:text-base font-bold text-[var(--text)] mb-5 md:mb-7">
          3 raisons de nous faire confiance
        </h2>
        <div className="grid gap-3 md:gap-5 sm:grid-cols-3">
          {REASONS.map((r) => (
            <div
              key={r.title}
              className="flex items-start gap-3 p-4 md:p-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border)]"
            >
              <div className={`w-10 h-10 rounded-xl ${r.bg} ${r.color} flex items-center justify-center shrink-0`}>
                <r.icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[var(--text)] text-sm md:text-base leading-tight mb-1">{r.title}</p>
                <p className="text-[12px] md:text-[13px] text-[var(--text-muted)] leading-snug">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
