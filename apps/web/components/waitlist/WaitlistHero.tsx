'use client'

import { useState, useEffect } from 'react'
import { track } from '@/lib/analytics/events'

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type Profil = 'chercheur' | 'proprietaire' | 'agence'
type ContactType = 'whatsapp' | 'email'
type Step = 'form' | 'success'

/* ─────────────────────────────────────────────
   STATS ANIMÉES (compteur live)
───────────────────────────────────────────── */
function useCounter(target: number, duration = 1600) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setValue(target); clearInterval(timer) }
      else setValue(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return value
}

/* ─────────────────────────────────────────────
   SOCIAL PROOF BAR
───────────────────────────────────────────── */
function SocialProofBar() {
  const count = useCounter(347)
  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Avatars */}
      <div className="flex -space-x-2">
        {['🧑🏿', '👩🏾', '👨🏿', '👩🏿'].map((e, i) => (
          <div
            key={i}
            className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-600
                       border-2 border-[var(--background)] flex items-center justify-center text-xs"
          >
            {e}
          </div>
        ))}
      </div>
      <span className="text-[var(--text-subtle)]">
        <span className="text-orange-400 font-bold">{count.toLocaleString()}</span>
        {' '}personnes déjà inscrites
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────
   TRUST BADGES
───────────────────────────────────────────── */
function TrustBadges() {
  const badges = [
    { icon: '🔐', label: 'Paiement Wave & OM sécurisé' },
    { icon: '📄', label: 'Contrat OHADA légal' },
    { icon: '✅', label: 'Propriétaires vérifiés KYC' },
    { icon: '🤖', label: 'Chatbot IA en français CI' },
  ]
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {badges.map((b) => (
        <div
          key={b.label}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                     bg-white/5 border border-white/10 text-xs text-[var(--text-subtle)]"
        >
          <span>{b.icon}</span>
          <span>{b.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   FEATURE CARDS
───────────────────────────────────────────── */
function FeatureCards() {
  const features = [
    {
      icon: '🏠',
      title: 'Annonces vérifiées',
      desc: 'Chaque bien est contrôlé. Photos 360°, vidéo, score IA de qualité.',
      color: 'from-blue-500/20 to-blue-600/5',
      border: 'border-blue-500/20',
    },
    {
      icon: '📱',
      title: 'Payez avec Wave',
      desc: 'Caution, loyer, tout se règle en 30 secondes depuis votre téléphone.',
      color: 'from-orange-500/20 to-orange-600/5',
      border: 'border-orange-500/20',
    },
    {
      icon: '📋',
      title: 'Contrat automatique',
      desc: 'Bail conforme au droit ivoirien OHADA généré et signé en ligne.',
      color: 'from-green-500/20 to-green-600/5',
      border: 'border-green-500/20',
    },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {features.map((f) => (
        <div
          key={f.title}
          className={`relative rounded-2xl border ${f.border} bg-gradient-to-b ${f.color}
                      p-5 backdrop-blur-sm text-left`}
        >
          <div className="text-2xl mb-3">{f.icon}</div>
          <h3 className="font-semibold text-white mb-1 text-sm">{f.title}</h3>
          <p className="text-[var(--text-subtle)] text-xs leading-relaxed">{f.desc}</p>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   SUCCESS STATE
───────────────────────────────────────────── */
function SuccessState({ profil, contact }: { profil: Profil; contact: string }) {
  const messages: Record<Profil, string> = {
    chercheur: 'On vous envoie les premières annonces dès l\'ouverture !',
    proprietaire: 'Vous aurez accès en premier pour publier vos biens gratuitement.',
    agence: 'Notre équipe vous contactera pour votre espace pro.',
  }
  return (
    <div className="text-center space-y-6 py-6">
      {/* Checkmark animé */}
      <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center animate-[scaleIn_0.4s_ease]">
        <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white font-display">Vous êtes sur la liste !</h2>
        <p className="text-[var(--text-subtle)] text-sm max-w-xs mx-auto">{messages[profil]}</p>
      </div>

      {/* Partage WhatsApp */}
      <a
        onClick={() => track.share({ method: 'whatsapp', content_type: 'waitlist' })}
        href={`https://wa.me/?text=${encodeURIComponent(
          "🏠 J'ai rejoint BOGBE'S GROUPE — la nouvelle plateforme immo de CI sans arnaque !\nInscrivez-vous ici : " +
          (typeof window !== 'undefined' ? window.location.href : `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.bogbesgroup.com'}/acces-anticipe`)
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl
                   bg-green-600 hover:bg-green-500 transition-colors
                   text-white font-medium text-sm"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.12 1.524 5.854L.036 24l6.306-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.003-1.371l-.36-.213-3.737.98.998-3.645-.234-.374A9.818 9.818 0 1112 21.818z" />
        </svg>
        Partager sur WhatsApp
      </a>

      <p className="text-[var(--text-muted)] text-xs">
        Partagez avec vos proches qui cherchent un logement à Abidjan 🙏
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export function WaitlistHero() {
  const [step, setStep] = useState<Step>('form')
  const [profil, setProfil] = useState<Profil>('chercheur')
  const [contactType, setContactType] = useState<ContactType>('whatsapp')
  const [nom, setNom] = useState('')
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const profilOptions: { value: Profil; label: string; emoji: string }[] = [
    { value: 'chercheur', label: 'Je cherche un logement', emoji: '🔍' },
    { value: 'proprietaire', label: 'Je suis propriétaire', emoji: '🏠' },
    { value: 'agence', label: 'Je suis une agence', emoji: '🏢' },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!contact.trim()) {
      setError('Veuillez entrer votre ' + (contactType === 'whatsapp' ? 'numéro WhatsApp' : 'email'))
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, contact, type_contact: contactType, profil, source: 'acces-anticipe' }),
      })
      const data = await res.json()
      if (data.success) {
        track.waitlistSignup({ profil, type_contact: contactType, source: 'acces-anticipe' })
        setStep('success')
      } else {
        setError(data.error || 'Une erreur est survenue. Réessayez.')
      }
    } catch {
      setError('Connexion impossible. Vérifiez votre réseau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 bg-amber-500/8 rounded-full blur-3xl" />
      </div>

      {/* Nav minimaliste */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center">
            <span className="text-sm">🏠</span>
          </div>
          <span className="font-bold text-white font-display tracking-tight">BOGBE'S GROUPE</span>
        </div>
        <a
          href="/"
          className="text-sm text-[var(--text-subtle)] hover:text-white transition-colors"
        >
          Voir les annonces →
        </a>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-10">

          {/* ── HEADER ── */}
          <div className="text-center space-y-5">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                            bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-400" />
              </span>
              Bêta — Accès anticipé ouvert
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-[1.08] tracking-tight font-display">
              Trouvez votre logement<br />
              <span className="text-[var(--accent-luxury)] italic font-light">sans arnaque</span>{' '}à Abidjan
            </h1>

            <p className="text-lg text-[var(--text-subtle)] max-w-md mx-auto leading-relaxed">
              BOGBE'S GROUPE arrive. Photos 360°, paiement Wave en 30 secondes,
              contrat de bail légal automatique.
            </p>

            <SocialProofBar />
          </div>

          {/* ── FORM CARD ── */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-7 sm:p-9 space-y-7">
            {step === 'success' ? (
              <SuccessState profil={profil} contact={contact} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>

                {/* Profil selector */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--text-subtle)] uppercase tracking-wide">
                    Je suis…
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {profilOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setProfil(opt.value)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs
                                    font-medium transition-all duration-200
                                    ${profil === opt.value
                                      ? 'border-orange-500/60 bg-orange-500/15 text-orange-300'
                                      : 'border-white/10 bg-white/5 text-[var(--text-subtle)] hover:border-white/25 hover:text-slate-200'
                                    }`}
                      >
                        <span className="text-xl">{opt.emoji}</span>
                        <span className="text-center leading-tight">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nom (optionnel) */}
                <div className="space-y-1.5">
                  <label htmlFor="wl-nom" className="text-xs font-medium text-[var(--text-subtle)] uppercase tracking-wide">
                    Votre prénom <span className="normal-case text-[var(--text-muted)]">(facultatif)</span>
                  </label>
                  <input
                    id="wl-nom"
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Aminata, Konan, Marc…"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5
                               text-white placeholder:text-[var(--text-muted)] text-sm
                               focus:outline-none focus:border-orange-500/60 focus:bg-orange-500/5
                               transition-all"
                  />
                </div>

                {/* Contact type toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[var(--text-subtle)] uppercase tracking-wide">
                      Comment vous contacter ?
                    </label>
                    <div className="flex rounded-lg border border-white/10 overflow-hidden">
                      {(['whatsapp', 'email'] as ContactType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => { setContactType(t); setContact('') }}
                          className={`px-3 py-1 text-xs font-medium transition-colors ${
                            contactType === t
                              ? 'bg-orange-500 text-white'
                              : 'text-[var(--text-subtle)] hover:text-slate-200'
                          }`}
                        >
                          {t === 'whatsapp' ? '📱 WhatsApp' : '✉️ Email'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {contactType === 'whatsapp' ? (
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm select-none">
                        🇨🇮 +225
                      </span>
                      <input
                        id="wl-contact"
                        type="tel"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="07 12 34 56 78"
                        className="w-full pl-20 pr-4 py-3 rounded-xl border border-white/10 bg-white/5
                                   text-white placeholder:text-[var(--text-muted)] text-sm
                                   focus:outline-none focus:border-orange-500/60 focus:bg-orange-500/5
                                   transition-all"
                        required
                      />
                    </div>
                  ) : (
                    <input
                      id="wl-contact"
                      type="email"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="votre@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5
                                 text-white placeholder:text-[var(--text-muted)] text-sm
                                 focus:outline-none focus:border-orange-500/60 focus:bg-orange-500/5
                                 transition-all"
                      required
                    />
                  )}
                </div>

                {/* Error */}
                {error && (
                  <p className="text-red-400 text-sm flex items-center gap-1.5">
                    <span>⚠️</span> {error}
                  </p>
                )}

                {/* CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl font-bold text-base text-white
                             bg-gradient-to-r from-orange-500 to-amber-500
                             hover:from-orange-400 hover:to-amber-400
                             disabled:opacity-60 disabled:cursor-not-allowed
                             transition-all duration-200 shadow-lg shadow-orange-500/25
                             hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0
                             flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Inscription…
                    </>
                  ) : (
                    <>
                      🚀 Rejoindre la liste d&apos;attente
                    </>
                  )}
                </button>

                <p className="text-center text-[var(--text-muted)] text-xs">
                  Gratuit · Sans spam · Désabonnement en 1 clic
                </p>
              </form>
            )}
          </div>

          {/* ── FEATURES ── */}
          <FeatureCards />

          {/* ── TRUST BADGES ── */}
          <TrustBadges />

          {/* ── TESTIMONIAL ── */}
          <div className="text-center space-y-3">
            <blockquote className="text-[var(--text-subtle)] italic text-base leading-relaxed max-w-sm mx-auto">
              &ldquo;Enfin une plateforme qui comprend comment ça marche vraiment en Côte d&apos;Ivoire.
              Paiement Wave, contrat légal, photos de qualité — c&apos;est ce qu&apos;on attendait.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-xs">
                K
              </div>
              <span className="text-[var(--text-muted)]">Konan B. · Propriétaire, Cocody</span>
            </div>
          </div>

        </div>
      </div>

      {/* Footer minimaliste */}
      <footer className="relative z-10 text-center py-5 text-[var(--text)] text-xs">
        © 2026 BOGBE'S GROUPE · La plateforme immobilière de confiance en Côte d&apos;Ivoire
      </footer>
    </div>
  )
}
