'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { MapPin, Wallet, Send, X, ArrowRight, ArrowLeft, Check, MessageCircle, Search, Building2 } from 'lucide-react'
import { useT } from '@/lib/i18n/client'
import { CommuneAutocomplete } from '@/components/ui/CommuneAutocomplete'
import { formatFCFACompact } from '@/lib/format'

const ADVISOR_PHONE = '2250544872051' // Sapphire advisor (also in WhatsAppConcierge)

interface GuidedSearchWizardProps {
  open: boolean
  onClose: () => void
  /** Optionnellement préfixer un parcours : "louer" force type_offre=location */
  intent?: 'louer' | 'acheter' | null
}

type TypeOffre = 'location' | 'vente'

/** Presets budget — adapted to Abidjan rental/sale market reality. */
const RENT_PRESETS = [
  { label: '< 150 k', max: 150_000 },
  { label: '150 – 300 k', max: 300_000 },
  { label: '300 – 600 k', max: 600_000 },
  { label: '600 k – 1 M', max: 1_000_000 },
  { label: '> 1 M', max: null },
]
const SALE_PRESETS = [
  { label: '< 30 M', max: 30_000_000 },
  { label: '30 – 80 M', max: 80_000_000 },
  { label: '80 – 200 M', max: 200_000_000 },
  { label: '200 – 500 M', max: 500_000_000 },
  { label: '> 500 M', max: null },
]

export function GuidedSearchWizard({ open, onClose, intent = null }: GuidedSearchWizardProps) {
  const router = useRouter()
  const t = useT()

  const [step, setStep] = useState(0)
  const [commune, setCommune] = useState('')
  const [typeBien, setTypeBien] = useState('')
  const [typeBienLabel, setTypeBienLabel] = useState<string | null>(null)
  const [typeOffre, setTypeOffre] = useState<TypeOffre>(intent === 'acheter' ? 'vente' : 'location')
  const [budgetMax, setBudgetMax] = useState<number | null>(null)
  const [budgetLabel, setBudgetLabel] = useState<string | null>(null)

  const dialogRef = useRef<HTMLDivElement>(null)

  // Portail vers document.body : indispensable pour échapper au contexte
  // d'empilement créé par les ancêtres framer-motion (transform) du Hero,
  // sinon l'overlay z-[300] reste piégé SOUS la MobileTabBar (z-100) et le
  // pied de page (bouton Suivant) est masqué en bas sur mobile.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Reset state when reopened with a fresh intent
  useEffect(() => {
    if (open) {
      setStep(0)
      setCommune('')
      setTypeBien('')
      setTypeBienLabel(null)
      setTypeOffre(intent === 'acheter' ? 'vente' : 'location')
      setBudgetMax(null)
      setBudgetLabel(null)
    }
  }, [open, intent])

  // Lock body scroll + ESC to close
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || !mounted) return null

  const presets = typeOffre === 'vente' ? SALE_PRESETS : RENT_PRESETS

  // Type de bien — mêmes valeurs que QuickFilters (labels FR, cohérents app-wide).
  const TYPE_BIENS: { value: string; label: string }[] = [
    { value: '', label: t.guided.anyType },
    { value: 'residence_meublee', label: 'Meublé' },
    { value: 'appartement', label: 'Appartement' },
    { value: 'villa', label: 'Villa' },
    { value: 'maison', label: 'Maison' },
    { value: 'studio', label: 'Studio' },
    { value: 'terrain', label: 'Terrain' },
    { value: 'bureau', label: 'Bureau' },
    { value: 'commerce', label: 'Commerce' },
  ]

  const LAST_STEP = 3
  // Seule l'étape commune (0) est obligatoire ; type/budget sont optionnels.
  const canNext = step !== 0 || commune.trim().length > 0

  function gotoCatalogue() {
    const params = new URLSearchParams()
    if (commune) params.set('commune', commune)
    if (typeBien) params.set('type_bien', typeBien)
    if (budgetMax) params.set('prix_max', String(budgetMax))
    params.set('type_offre', typeOffre)
    onClose()
    router.push(`/catalogue?${params.toString()}`)
  }

  function gotoWhatsApp() {
    const lines = [
      'Bonjour,',
      "j'utilise BOGBE'S et je cherche :",
      `• Commune : ${commune || 'à préciser'}`,
      `• Type de bien : ${typeBienLabel ?? 'à préciser'}`,
      `• Offre : ${typeOffre === 'vente' ? 'Achat' : 'Location'}`,
      `• Budget max : ${budgetLabel ?? 'à préciser'}`,
      '',
      'Pouvez-vous m\'aider à organiser une visite ?',
    ]
    const text = encodeURIComponent(lines.join('\n'))
    onClose()
    window.open(`https://wa.me/${ADVISOR_PHONE}?text=${text}`, '_blank', 'noopener')
  }

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guided-search-title"
      className="fixed inset-x-0 top-0 h-[100dvh] z-[300] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Bottom-sheet sur mobile : on force min-h-[85vh] pour que le sheet
          remonte presque jusqu'en haut de l'écran (au lieu de s'arrêter au
          milieu). Sur desktop, modal centrale classique. */}
      <div className="w-full max-w-lg bg-[var(--surface-card)] text-[var(--text)] rounded-t-3xl md:rounded-3xl shadow-md overflow-hidden max-h-[92dvh] min-h-[85dvh] md:min-h-0 md:max-h-[92vh] flex flex-col border border-[var(--border)]">
        {/* Header — progress + close */}
        <div className="relative px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            aria-label={t.guided.close}
            className="absolute top-3 right-3 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)]"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent-luxury)] mb-1">
            {t.guided.kicker}
          </p>
          <h2 id="guided-search-title" className="font-display text-xl md:text-2xl font-bold text-[var(--text)] leading-tight pr-12">
            {t.guided.title}
          </h2>

          {/* Progress steps */}
          <ol className="flex items-center gap-2 mt-4" aria-label="Progression">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    i <= step ? 'bg-[var(--accent-luxury)]' : 'bg-[var(--surface-hover)]'
                  }`}
                  aria-current={i === step ? 'step' : undefined}
                />
                <span className="sr-only">
                  Étape {i + 1} sur 4 {i < step ? '(terminée)' : i === step ? '(en cours)' : ''}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {/* Step 0 — commune */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-luxury-muted)] text-[var(--accent-luxury)] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">{t.guided.s1Title}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{t.guided.s1Hint}</p>
                </div>
              </div>

              <CommuneAutocomplete
                value={commune}
                onChange={setCommune}
                onSubmit={(v) => { setCommune(v); setStep(1) }}
                placeholder={t.guided.s1Placeholder}
              />

              {/* Quick-pick chips */}
              <div className="pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  {t.guided.popular}
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Cocody', 'Plateau', 'Marcory', 'Riviera', 'Yopougon', 'Bingerville'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCommune(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        commune === c
                          ? 'bg-[var(--accent-luxury)] text-[var(--on-accent)] border-[var(--accent-luxury)]'
                          : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-luxury)]/40 hover:text-[var(--text)]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1 — type de bien */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-luxury-muted)] text-[var(--accent-luxury)] flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">{t.guided.sTypeTitle}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{t.guided.sTypeHint}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TYPE_BIENS.map((tb) => {
                  const active = typeBien === tb.value
                  return (
                    <button
                      key={tb.value || 'any'}
                      type="button"
                      onClick={() => { setTypeBien(tb.value); setTypeBienLabel(tb.value ? tb.label : null) }}
                      aria-pressed={active}
                      className={`px-3 py-3 rounded-xl text-sm font-bold border transition-colors text-center ${
                        active
                          ? 'border-[var(--accent-luxury)] bg-[var(--accent-luxury-muted)] text-[var(--accent-luxury)]'
                          : 'border-[var(--border)] text-[var(--text)] hover:border-[var(--accent-luxury)]/40'
                      }`}
                    >
                      {tb.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2 — type d'offre + budget */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-luxury-muted)] text-[var(--accent-luxury)] flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">{t.guided.s2Title}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{t.guided.s2Hint}</p>
                </div>
              </div>

              {/* Type offre */}
              <div className="inline-flex p-1 rounded-full bg-[var(--surface-hover)]" role="radiogroup">
                {(['location', 'vente'] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={typeOffre === o}
                    onClick={() => {
                      setTypeOffre(o)
                      setBudgetMax(null)
                      setBudgetLabel(null)
                    }}
                    className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${
                      typeOffre === o ? 'bg-[var(--text)] text-[var(--background)]' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {o === 'location' ? t.guided.rent : t.guided.buy}
                  </button>
                ))}
              </div>

              {/* Budget presets */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  {t.guided.budget}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {presets.map((p) => {
                    const active = budgetLabel === p.label
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => { setBudgetMax(p.max); setBudgetLabel(p.label) }}
                        aria-pressed={active}
                        className={`px-3 py-3 rounded-xl text-sm font-bold border transition-colors text-left ${
                          active
                            ? 'border-[var(--accent-luxury)] bg-[var(--accent-luxury-muted)] text-[var(--accent-luxury)]'
                            : 'border-[var(--border)] text-[var(--text)] hover:border-[var(--accent-luxury)]/40'
                        }`}
                      >
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                          FCFA{typeOffre === 'location' ? '/mois' : ''}
                        </span>
                        {p.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — action */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-luxury-muted)] text-[var(--accent-luxury)] flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">{t.guided.s3Title}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{t.guided.s3Hint}</p>
                </div>
              </div>

              {/* Recap */}
              <div className="rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] p-4 space-y-1.5 text-sm">
                <Recap icon={<MapPin className="w-3.5 h-3.5" />} label={t.guided.s1Title} value={commune || '—'} />
                <Recap icon={<Building2 className="w-3.5 h-3.5" />} label={t.guided.sTypeTitle} value={typeBienLabel || t.guided.anyType} />
                <Recap icon={<Wallet className="w-3.5 h-3.5" />} label={typeOffre === 'location' ? t.guided.rent : t.guided.buy} value={budgetLabel || t.guided.anyBudget} />
              </div>

              {/* Action choices */}
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={gotoCatalogue}
                  className="group flex items-center gap-3 p-4 rounded-xl bg-[var(--accent-luxury)] text-[var(--on-accent)] font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all"
                >
                  <Search className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-left">
                    {t.guided.gotoCatalogue}
                    <span className="block text-[11px] font-normal opacity-80 mt-0.5">
                      {t.guided.gotoCatalogueDesc}
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={gotoWhatsApp}
                  className="group flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-luxury)]/40 font-bold text-sm text-[var(--text)] active:scale-[0.99] transition-all"
                >
                  <MessageCircle className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span className="flex-1 text-left">
                    {t.guided.gotoWhatsapp}
                    <span className="block text-[11px] font-normal text-[var(--text-muted)] mt-0.5">
                      {t.guided.gotoWhatsappDesc}
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer — navigation : Retour disponible dès l'étape 1 (y compris
            sur l'étape finale), Suivant masqué sur la dernière étape. */}
        <div className="px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-[var(--border)] flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-full text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              <ArrowLeft className="w-4 h-4" /> {t.guided.back}
            </button>
          ) : (
            <span aria-hidden="true" />
          )}
          {step < LAST_STEP ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(LAST_STEP, s + 1))}
              disabled={!canNext}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-5 py-2.5 rounded-full bg-[var(--accent-luxury)] text-[var(--on-accent)] font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 2 && budgetLabel ? <Check className="w-4 h-4" /> : null}
              {t.guided.next}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <span aria-hidden="true" />
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Recap({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[var(--text-muted)]">{icon}</span>
      <span className="text-[var(--text-muted)]">{label} :</span>
      <span className="font-semibold text-[var(--text)]">{value}</span>
    </div>
  )
}
