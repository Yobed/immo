'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const supabase = createClient()

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true)
    setError(null)

    const origin = window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${origin}/reset-password`,
    })

    if (error) {
      setError("Une erreur est survenue lors de l'envoi de l'e-mail.")
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-black text-[var(--text)] font-display tracking-tight uppercase italic">
          E-mail envoyé
        </h2>
        <p className="text-[13px] text-[var(--text-muted)] font-medium max-w-[280px] mx-auto leading-relaxed">
          Si un compte est associé à cette adresse e-mail, vous recevrez un lien pour réinitialiser votre mot de passe.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent-luxury)] border-b border-accent-luxury/20 pb-0.5 hover:border-[var(--accent-luxury)] transition-all"
        >
          Retourner à la connexion <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full space-y-10"
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-accent-luxury/10 text-[var(--accent-luxury)] mb-2 shadow-inner border border-accent-luxury/20">
          <KeyRound size={28} strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-[var(--text)] font-display tracking-tight uppercase italic leading-none">
          Mot de passe oublié
        </h1>
        <p className="text-[13px] text-[var(--text-muted)] font-medium tracking-wide max-w-[260px] mx-auto leading-relaxed">
          Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-black text-center uppercase tracking-wider"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="forgot-email" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] ml-1">
              <Mail size={12} className="text-[var(--accent-luxury)]" /> Adresse e-mail
            </label>
            <input
              id="forgot-email"
              {...register('email')}
              type="email"
              placeholder="votre@email.com"
              autoComplete="email"
              aria-required="true"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'forgot-email-error' : undefined}
              className="w-full px-6 h-[64px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--accent-glow)] focus:border-[var(--accent-luxury)] transition-all text-base font-bold text-[var(--text)] placeholder:text-muted/20"
            />
            {errors.email && (
              <p id="forgot-email-error" role="alert" className="text-[10px] font-bold text-red-500 ml-1 uppercase tracking-wider">{errors.email.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 h-[64px] bg-[var(--accent-luxury)] hover:bg-accent-luxury/90 text-[var(--on-accent)] font-black uppercase tracking-[0.3em] text-[12px] rounded-2xl shadow-xl shadow-[var(--accent-glow)] transition-all active:scale-[0.98] disabled:opacity-50 border border-white/20 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          {loading ? 'Envoi...' : (
            <>
              Envoyer le lien <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-6">
        <Link href="/login" className="text-[13px] text-[var(--text-muted)] font-medium hover:text-[var(--text)] transition-colors">
          Retour à la connexion
        </Link>
      </div>
    </motion.div>
  )
}
