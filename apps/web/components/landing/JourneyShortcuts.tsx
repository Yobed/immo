'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Sparkles, ArrowUpRight, Home as HomeIcon, Building2, Search, Flame, MessageCircle, Crown, Compass } from 'lucide-react'
import { useT } from '@/lib/i18n/client'
import { GuidedSearchWizard } from './GuidedSearchWizard'

const TALLY_FORM_URL = 'https://tally.so/r/QKxNNp'

interface SecondaryJourney {
  label: string
  title: string
  description: string
  cta: string
  href: string
  external?: boolean
  image?: string
}

/**
 * Choix primaire en 2 voies : Locataire/Acheteur vs Propriétaire/Agence.
 * Sous chaque voie, 2 boutons maximum (CTA principal + secondaire).
 * Remplace l'ancienne grille de 5 cartes saturées.
 */
export function JourneyShortcuts() {
  const t = useT()
  const [wizardOpen, setWizardOpen] = useState(false)

  return (
    <section className="relative py-16 md:py-24 bg-[var(--background)] overflow-hidden">
      {/* Top divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[#C5A059]/40 to-transparent" />

      <div className="relative z-10 mx-auto px-4 md:px-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-amber-700" />
            <p className="text-[10px] font-medium tracking-[0.5em] uppercase text-amber-700">
              {t.journey.kicker}
            </p>
            <div className="h-px w-8 bg-amber-700" />
          </div>
          <h2 className="font-display text-3xl md:text-5xl text-[var(--text)] leading-[1.05] tracking-tight">
            {t.journey.iAm}
          </h2>
          <p className="font-sans text-sm md:text-base text-[var(--text-muted)] mt-4 leading-relaxed">
            Deux voies, choisis la tienne.
          </p>
        </div>

        {/* 2 voies — Locataire/Acheteur vs Propriétaire/Agence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Voie 1 — Locataire / Acheteur */}
          <PathCard
            accent="luxury"
            icon={Search}
            label="Locataire · Acheteur"
            title="Je cherche un bien"
            desc="Catalogue vérifié + offres flash en temps réel sur le marché ivoirien."
            primary={{
              label: 'Trouver mon bien en 30s',
              icon: Sparkles,
              onClick: () => setWizardOpen(true),
            }}
            secondary={{
              label: 'Voir les annonces',
              icon: HomeIcon,
              href: '/catalogue',
            }}
          />

          {/* Voie 2 — Propriétaire / Agence */}
          <PathCard
            accent="blue"
            icon={Building2}
            label="Propriétaire · Agence"
            title="Je publie un bien"
            desc="Express via WhatsApp (1 min) ou compte Pro avec gestion complète."
            primary={{
              label: 'Publier via WhatsApp',
              icon: MessageCircle,
              href: TALLY_FORM_URL,
              external: true,
            }}
            secondary={{
              label: 'Créer un compte Pro',
              icon: Crown,
              href: '/login?next=/mes-biens/nouveau',
            }}
          />
        </div>

        {/* ─── Bloc secondaire — 5 sous-parcours ─── */}
        <div className="mt-16 md:mt-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <Compass className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">
                Ou explore autrement
              </p>
            </div>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
              5 portes d&apos;entrée selon ton profil exact.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            <SubJourneyCard
              label={t.journey.j1Label}
              title={t.journey.j1Title}
              description={t.journey.j1Desc}
              cta={t.journey.j1Cta}
              href="/catalogue"
              image="/journey/je-cherche.png"
            />
            <SubJourneyCard
              label={t.journey.j2Label}
              title={t.journey.j2Title}
              description={t.journey.j2Desc}
              cta={t.journey.j2Cta}
              href="/offre-flash"
              image="/journey/offres-flash.png"
            />
            <SubJourneyCard
              label={t.journey.j3Label}
              title={t.journey.j3Title}
              description={t.journey.j3Desc}
              cta={t.journey.j3Cta}
              href="/catalogue"
              image="/journey/recherche-avancee.png"
            />
            <SubJourneyCard
              label={t.journey.j4Label}
              title={t.journey.j4Title}
              description={t.journey.j4Desc}
              cta={t.journey.j4Cta}
              href="/login?next=/mes-biens/nouveau"
              image="/journey/proprietaire.png"
            />
            <SubJourneyCard
              label={t.journey.j5Label}
              title={t.journey.j5Title}
              description={t.journey.j5Desc}
              cta={t.journey.j5Cta}
              href={TALLY_FORM_URL}
              external
              image="/journey/publier-whatsapp.png"
            />
          </div>
        </div>

        <GuidedSearchWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      </div>
    </section>
  )
}

/** Carte secondaire compacte — image + chevron hover, pas de texte overlay
 *  (les images embarquent déjà persona + titre + description). */
function SubJourneyCard({ label, title, description, cta, href, external, image }: SecondaryJourney) {
  const [imgError, setImgError] = useState(false)
  const showImage = image && !imgError

  const linkProps = external
    ? { href, target: '_blank' as const, rel: 'noopener' }
    : { href }

  if (showImage) {
    return (
      <Link
        {...linkProps}
        aria-label={`${title} — ${label}`}
        title={`${title} — ${cta}`}
        className="group relative block aspect-[4/3] sm:aspect-[5/4] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface-card)] transition-all duration-500 hover:-translate-y-1 hover:border-accent-luxury/60 shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--accent-luxury)] focus-visible:ring-offset-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={`${title} — ${label}`}
          loading="lazy"
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover motion-safe:group-hover:scale-[1.03] transition-transform duration-700"
        />
        <span
          className="absolute bottom-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/95 backdrop-blur-md text-[var(--accent-luxury)] shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0"
          aria-hidden="true"
        >
          <ArrowUpRight className="w-4 h-4" />
        </span>
        <span className="sr-only">{title}. {description}. {cta}.</span>
      </Link>
    )
  }

  // Fallback texte (si l'image ne charge pas)
  return (
    <Link
      {...linkProps}
      className="group relative flex flex-col aspect-[4/3] sm:aspect-[5/4] bg-[var(--surface-card)] rounded-2xl p-4 border border-[var(--border)] hover:border-accent-luxury/60 hover:shadow-md transition-all"
    >
      <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
        {label}
      </p>
      <h3 className="font-display text-base font-bold text-[var(--text)] leading-tight mb-2">
        {title}
      </h3>
      <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mb-auto">
        {description}
      </p>
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-luxury)] mt-2 group-hover:gap-2 transition-all">
        {cta} <ArrowUpRight className="w-3 h-3" />
      </p>
    </Link>
  )
}

type PathCardAction =
  | { label: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void; href?: undefined; external?: undefined }
  | { label: string; icon: React.ComponentType<{ className?: string }>; href: string; external?: boolean; onClick?: undefined }

interface PathCardProps {
  accent: 'luxury' | 'blue'
  icon: React.ComponentType<{ className?: string }>
  label: string
  title: string
  desc: string
  primary: PathCardAction
  secondary: PathCardAction
}

function PathCard({ accent, icon: Icon, label, title, desc, primary, secondary }: PathCardProps) {
  const accentColors = {
    luxury: {
      iconBg: 'bg-accent-luxury/10 border-accent-luxury/30 text-[var(--accent-luxury)]',
      primaryBtn: 'bg-[var(--accent-luxury)] text-[var(--on-accent)] hover:opacity-90',
      label: 'text-[var(--accent-luxury)]',
    },
    blue: {
      iconBg: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
      primaryBtn: 'bg-blue-600 text-white hover:bg-blue-500',
      label: 'text-blue-600',
    },
  }[accent]

  return (
    <div className="relative flex flex-col bg-[var(--surface-card)] rounded-3xl p-6 md:p-8 border border-[var(--border)] hover:border-accent-luxury/30 hover:shadow-md transition-all duration-300">
      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 ${accentColors.iconBg}`}>
        <Icon className="w-6 h-6" />
      </div>

      <p className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-2 ${accentColors.label}`}>
        {label}
      </p>
      <h3 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)] mb-3 tracking-tight">
        {title}
      </h3>
      <p className="font-sans text-sm text-[var(--text-muted)] leading-relaxed mb-6 flex-1">
        {desc}
      </p>

      {/* 2 boutons MAX par voie : primaire + secondaire */}
      <div className="flex flex-col sm:flex-row gap-2.5 mt-auto">
        <ActionButton action={primary} variant="primary" accentClass={accentColors.primaryBtn} />
        <ActionButton action={secondary} variant="secondary" />
      </div>
    </div>
  )
}

interface ActionButtonProps {
  action: PathCardAction
  variant: 'primary' | 'secondary'
  accentClass?: string
}

function ActionButton({ action, variant, accentClass = '' }: ActionButtonProps) {
  const Icon = action.icon
  const baseClass =
    'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all active:scale-95'
  const className =
    variant === 'primary'
      ? `${baseClass} ${accentClass} shadow-sm flex-1`
      : `${baseClass} bg-transparent border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent-luxury)] flex-1`

  if (action.onClick) {
    return (
      <button type="button" onClick={action.onClick} className={className}>
        <Icon className="w-3.5 h-3.5" />
        {action.label}
      </button>
    )
  }

  if (action.external) {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer" className={className}>
        <Icon className="w-3.5 h-3.5" />
        {action.label}
      </a>
    )
  }

  return (
    <Link href={action.href!} className={className}>
      <Icon className="w-3.5 h-3.5" />
      {action.label}
    </Link>
  )
}
