'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Wallet, Heart, MessageCircle, ArrowRight, Wand2 } from 'lucide-react'
import { GuidedSearchWizard } from './GuidedSearchWizard'

/**
 * Déroulement visuel des 3 étapes de la recherche guidée, sur la home.
 *
 * Pourquoi: le CTA "Trouvez votre bien en 30 secondes" annonce un parcours
 * mais ne le montre pas — un visiteur sceptique veut SAVOIR ce que ces 30
 * secondes contiennent avant de cliquer. Cette section dépile les 3 étapes
 * en aperçu, puis offre le CTA de lancement.
 *
 * Server-friendly: state interne pour ouvrir le wizard, mais le composant
 * lui-même est léger et SSR-renderable.
 */
export function GuidedSearchSteps() {
  const [wizardOpen, setWizardOpen] = useState(false)

  const steps = [
    {
      n: 1,
      icon: <MapPin className="w-5 h-5" />,
      label: 'Choisissez votre zone',
      desc: 'Commune ou quartier. Autocomplete sur Cocody, Plateau, Riviera, Marcory…',
    },
    {
      n: 2,
      icon: <Wallet className="w-5 h-5" />,
      label: 'Précisez votre budget',
      desc: 'Location ou achat, fourchette adaptée au marché ivoirien.',
    },
    {
      n: 3,
      icon: <MessageCircle className="w-5 h-5" />,
      label: 'Voyez les résultats ou parlez à un conseiller',
      desc: 'Catalogue filtré OU mise en relation WhatsApp pré-remplie.',
    },
  ]

  const lastIdx = steps.length - 1

  return (
    <section className="relative py-12 md:py-16 bg-[var(--background)]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        {/* Header — CTA cachée sur mobile (présent en bas), visible sur desktop */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6 mb-8 md:mb-10">
          <div className="max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-luxury)] mb-3">
              Recherche guidée · 30 secondes
            </p>
            <h2 className="font-display text-2xl md:text-4xl font-bold text-[var(--text)] leading-tight tracking-tight">
              Trois questions.{' '}
              <span className="italic font-light text-[var(--accent-luxury)]">Votre bien idéal.</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className="hidden md:inline-flex items-center gap-2 min-h-[48px] px-5 py-3 rounded-full bg-[var(--accent-luxury)] text-[var(--on-accent)] font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-md"
          >
            <Wand2 className="w-4 h-4" />
            Lancer la recherche guidée
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Steps timeline */}
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-0 md:bg-[var(--surface-card)] md:rounded-3xl md:border md:border-[var(--border)] md:overflow-hidden">
          {steps.map((s, i) => {
            const isLast = i === lastIdx
            return (
              <motion.li
                key={s.n}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`relative p-5 md:p-6 border rounded-2xl md:rounded-none md:border-0 ${
                  isLast
                    ? 'bg-[var(--accent-luxury-muted)] border-accent-luxury/40 md:bg-[var(--accent-luxury-muted)]'
                    : 'bg-[var(--surface-card)] border-[var(--border)]'
                } ${i > 0 ? 'md:border-l md:border-[var(--border)]' : ''}`}
              >
                {/* Number badge */}
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-full font-display font-bold text-base ${
                      isLast
                        ? 'bg-[var(--accent-luxury)] text-[var(--on-accent)]'
                        : 'bg-[var(--accent-luxury-muted)] text-[var(--accent-luxury)]'
                    }`}
                  >
                    {s.n}
                  </span>
                  <span className="text-[var(--accent-luxury)]" aria-hidden="true">
                    {s.icon}
                  </span>
                </div>

                <h3 className="font-display text-base md:text-lg font-bold text-[var(--text)] leading-tight mb-1.5">
                  {s.label}
                </h3>
                <p className="text-xs md:text-sm text-[var(--text-muted)] leading-relaxed">
                  {s.desc}
                </p>

                {/* Mobile inline CTA on the last step — l'utilisateur n'a pas besoin
                    de remonter en haut de la section pour lancer. */}
                {isLast && (
                  <button
                    type="button"
                    onClick={() => setWizardOpen(true)}
                    className="md:hidden mt-4 w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 rounded-xl bg-[var(--accent-luxury)] text-[var(--on-accent)] font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
                  >
                    <Wand2 className="w-4 h-4" />
                    Lancer maintenant
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {/* Connector arrow (desktop only, between cards) */}
                {!isLast && (
                  <ArrowRight
                    className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 bg-[var(--surface-card)] z-10"
                    aria-hidden="true"
                  />
                )}
              </motion.li>
            )
          })}
        </ol>

        {/* Reassurance — flex-wrap pour ne pas déborder sur écran étroit */}
        <div className="mt-6 flex flex-wrap items-start justify-center gap-1.5 text-center text-xs text-[var(--text-muted)] leading-relaxed px-2">
          <Heart className="w-3 h-3 text-[var(--accent-luxury)] shrink-0 mt-0.5" aria-hidden="true" />
          <span className="max-w-md">
            Chaque mise en relation passe par un conseiller dédié — WhatsApp, appel ou RDV terrain.
          </span>
        </div>
      </div>

      <GuidedSearchWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </section>
  )
}
