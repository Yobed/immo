'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { MessageCircle, X, Loader2, CheckCircle2, Phone, User, Mail, AlertCircle } from 'lucide-react'
import { Honeypot } from '@/components/ui/Honeypot'
import { HONEYPOT_NAME } from '@/lib/honeypot'

interface FlashContactModalProps {
  locauxId: number
  bienTitre: string
  /** Pré-remplit le nom si l'utilisateur est connecté */
  initialName?: string
  /** Pré-remplit l'email si l'utilisateur est connecté */
  initialEmail?: string
  /** Pré-remplit le téléphone si l'utilisateur est connecté */
  initialPhone?: string
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function FlashContactModal({
  locauxId,
  bienTitre,
  initialName = '',
  initialEmail = '',
  initialPhone = '',
}: FlashContactModalProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Pré-remplissage prioritaire :
  //   1. URL params (?prefill_name, ?prefill_phone) — utilisé par Sapphire WhatsApp
  //      qui forwarde le pushName + jid du client.
  //   2. Props (utilisateur connecté → profil DB).
  // Permet à un client venant de Sapphire d'avoir nom + tél déjà remplis.
  const searchParams = useSearchParams()
  const prefillName = searchParams.get('prefill_name') ?? ''
  const prefillPhone = searchParams.get('prefill_phone') ?? ''
  const prefillEmail = searchParams.get('prefill_email') ?? ''

  const [form, setForm] = useState({
    name: prefillName || initialName,
    phone: prefillPhone || initialPhone,
    email: prefillEmail || initialEmail,
    reason: '',
  })

  useEffect(() => {
    if (open) {
      // Reset success message when reopening
      setStatus('idle')
      setErrorMsg(null)
      // Lock body scroll pendant que la modal est ouverte
      // (évite le scroll arrière-plan visible derrière le backdrop sur mobile).
      const prevOverflow = document.body.style.overflow
      const prevPaddingRight = document.body.style.paddingRight
      // Compense la barre de scroll qui disparaît pour éviter le shift de mise en page
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
      return () => {
        document.body.style.overflow = prevOverflow
        document.body.style.paddingRight = prevPaddingRight
      }
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const honeypot = (fd.get(HONEYPOT_NAME) as string | null) ?? ''
    setStatus('submitting')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/flash-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locauxId,
          visitorName: form.name.trim(),
          visitorPhone: form.phone.trim(),
          visitorEmail: form.email.trim() || undefined,
          reason: form.reason.trim() || undefined,
          [HONEYPOT_NAME]: honeypot,
        }),
      })

      const data = (await res.json()) as { error?: string; message?: string }

      if (!res.ok) {
        setErrorMsg(data.error || `Erreur (${res.status})`)
        setStatus('error')
        return
      }

      setStatus('success')
    } catch (err) {
      setErrorMsg((err as Error).message || 'Erreur réseau')
      setStatus('error')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
      >
        <MessageCircle className="w-4 h-4" />
        Demander une visite
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="flash-contact-title"
          className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-black/75 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="relative w-full max-w-md bg-[var(--surface-card)] text-[var(--text)] rounded-2xl shadow-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer la fenêtre de contact"
              className="absolute top-3 right-3 z-10 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-[var(--surface-hover)] hover:bg-[var(--surface-hover)] text-[var(--text)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {status === 'success' ? (
              <div className="p-6 md:p-8">
                {/* Header succès */}
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-[var(--text)] mb-1">
                    Demande envoyée !
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    On prend le relais. Voici la suite.
                  </p>
                </div>

                {/* Roadmap 4 étapes — ce qui se passe ensuite */}
                <ol className="space-y-3 mb-6">
                  <RoadmapStep
                    num={1}
                    emoji="📞"
                    title="Notre conseiller t'appelle"
                    desc="Dans l'heure en journée, par WhatsApp ou téléphone."
                  />
                  <RoadmapStep
                    num={2}
                    emoji="✅"
                    title="Vérification avec le propriétaire"
                    desc="On confirme la disponibilité du bien et le créneau qui te convient."
                  />
                  <RoadmapStep
                    num={3}
                    emoji="📅"
                    title="Visite organisée"
                    desc="Adresse et horaire confirmés. Conseiller présent pour t'accompagner."
                  />
                  <RoadmapStep
                    num={4}
                    emoji="🏠"
                    title="Suivi jusqu'à la signature"
                    desc="Si tu valides, on coordonne contrat + paiements sécurisés."
                  />
                </ol>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full inline-flex justify-center items-center px-5 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors"
                >
                  Compris, merci
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6" noValidate>
                <Honeypot />
                <div className="mb-5">
                  <h2 id="flash-contact-title" className="font-display text-xl font-bold text-[var(--text)] mb-1">
                    Demander une visite
                  </h2>
                  <p className="text-xs text-[var(--text)] leading-relaxed">
                    Bien : <span className="font-semibold text-[var(--text)]">{bienTitre}</span>
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-5 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Notre conseiller vérifie d&apos;abord la disponibilité avec le propriétaire avant d&apos;organiser une visite. Réponse sous 1h en journée.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="fc-name" className="text-[10px] font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5 mb-1.5">
                      <User className="w-3 h-3" /> Ton nom <span className="text-red-600" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="fc-name"
                      type="text"
                      required
                      aria-required="true"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Prénom Nom"
                      className="w-full px-4 py-2.5 bg-[var(--surface-card)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="fc-phone" className="text-[10px] font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5 mb-1.5">
                      <Phone className="w-3 h-3" /> Téléphone WhatsApp <span className="text-red-600" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="fc-phone"
                      type="tel"
                      required
                      aria-required="true"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="07 12 34 56 78"
                      className="w-full px-4 py-2.5 bg-[var(--surface-card)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="fc-email" className="text-[10px] font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5 mb-1.5">
                      <Mail className="w-3 h-3" /> Email <span className="text-[var(--text-muted)] normal-case font-normal">(optionnel)</span>
                    </label>
                    <input
                      id="fc-email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="prenom@email.com"
                      className="w-full px-4 py-2.5 bg-[var(--surface-card)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="fc-reason" className="text-[10px] font-bold uppercase tracking-wider text-[var(--text)] mb-1.5 block">
                      Message <span className="text-[var(--text-muted)] normal-case font-normal">(optionnel)</span>
                    </label>
                    <textarea
                      id="fc-reason"
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      placeholder="Précise tes besoins, dispos pour visiter, etc."
                      rows={3}
                      maxLength={500}
                      aria-describedby={errorMsg ? 'fc-error' : undefined}
                      className="w-full px-4 py-2.5 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition resize-none"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div id="fc-error" role="alert" className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      Envoyer ma demande
                    </>
                  )}
                </button>

                <p className="text-[10px] text-[var(--text-subtle)] text-center mt-3 leading-relaxed">
                  🔒 Tes coordonnées restent privées et ne sont partagées qu&apos;avec notre conseiller BOGBE&apos;S.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/** Étape du roadmap post-envoi — numéro + emoji + titre + description courte */
function RoadmapStep({ num, emoji, title, desc }: { num: number; emoji: string; title: string; desc: string }) {
  return (
    <li className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--surface-card)] border border-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--text)]">
        {num}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[var(--text)] leading-tight mb-0.5">
          <span aria-hidden className="mr-1.5">{emoji}</span>
          {title}
        </p>
        <p className="text-xs text-[var(--text-muted)] leading-snug">{desc}</p>
      </div>
    </li>
  )
}
