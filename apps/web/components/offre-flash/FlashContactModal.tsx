'use client'
import { useState, useEffect } from 'react'
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
  const [form, setForm] = useState({
    name: initialName,
    phone: initialPhone,
    email: initialEmail,
    reason: '',
  })

  useEffect(() => {
    if (open) {
      // Reset success message when reopening
      setStatus('idle')
      setErrorMsg(null)
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
        Contacter via BOGBE&apos;S
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="flash-contact-title"
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="relative w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer la fenêtre de contact"
              className="absolute top-3 right-3 z-10 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {status === 'success' ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h2 className="font-display text-xl font-bold text-slate-900 mb-2">
                  Demande envoyée !
                </h2>
                <p className="text-sm text-slate-600 mb-6">
                  Notre conseiller va valider la disponibilité avec le propriétaire et te recontacte rapidement par WhatsApp.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6" noValidate>
                <Honeypot />
                <div className="mb-5">
                  <h2 id="flash-contact-title" className="font-display text-xl font-bold text-slate-900 mb-1">
                    Contacter via BOGBE&apos;S
                  </h2>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Bien : <span className="font-semibold text-slate-900">{bienTitre}</span>
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
                    <label htmlFor="fc-name" className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
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
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="fc-phone" className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
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
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="fc-email" className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
                      <Mail className="w-3 h-3" /> Email <span className="text-slate-500 normal-case font-normal">(optionnel)</span>
                    </label>
                    <input
                      id="fc-email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="prenom@email.com"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="fc-reason" className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                      Message <span className="text-slate-500 normal-case font-normal">(optionnel)</span>
                    </label>
                    <textarea
                      id="fc-reason"
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      placeholder="Précise tes besoins, dispos pour visiter, etc."
                      rows={3}
                      maxLength={500}
                      aria-describedby={errorMsg ? 'fc-error' : undefined}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition resize-none"
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

                <p className="text-[10px] text-slate-400 text-center mt-3 leading-relaxed">
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
