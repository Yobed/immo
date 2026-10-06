'use client'

import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'next/navigation'
import { useT } from '@/lib/i18n/client'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { UserPlus, Mail, Lock, User, CheckCircle2, ArrowRight, Phone, Sparkles, Building2, Home, Compass } from 'lucide-react'

const registerSchema = z.object({
  full_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse e-mail invalide'),
  phone: z.string().trim().max(30, 'Numéro trop long').optional().or(z.literal('')),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  role: z.enum(['locataire', 'proprietaire', 'agence']),
})

type RegisterFormData = z.infer<typeof registerSchema>

function RegisterContent() {
  const t = useT()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref')
  const roleParam = (searchParams.get('role') || searchParams.get('type') || '').toLowerCase()

  const initialRole: 'locataire' | 'proprietaire' | 'agence' =
    roleParam === 'pro' || roleParam === 'agence' || roleParam === 'demarcheur' || roleParam === 'courtier'
      ? 'agence'
      : roleParam === 'proprietaire' || roleParam === 'bailleur'
      ? 'proprietaire'
      : 'locataire'

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: initialRole,
      phone: '',
    },
  })

  const currentRole = watch('role')

  const supabase = createClient()

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    setError(null)
    const origin = window.location.origin
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/callback`,
        queryParams: { referral_code: referralCode || '' }
      },
    })
  }

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true)
    setError(null)

    // Inscription via notre route serveur (compte confirmé d'office — évite le
    // rate limit e-mail Supabase qui bloquait les inscriptions sous trafic pub).
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, referral_code: referralCode }),
    })
    const payload = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(payload.error === 'already'
        ? 'Cette adresse e-mail est déjà utilisée.'
        : (payload.error || "Une erreur est survenue lors de l'inscription."))
      setLoading(false)
      return
    }

    // Compte créé + confirmé → connexion immédiate, puis redirection.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (signInError) {
      // Compte bien créé mais connexion auto KO → on invite à se connecter.
      setSuccess(true)
    } else {
      if (data.role === 'agence' || data.role === 'proprietaire') {
        window.location.assign('/dashboard')
      } else {
        window.location.assign('/profil')
      }
      return
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
          {t.auth.welcome}
        </h2>
        <p className="text-[13px] text-[var(--text-muted)] font-medium max-w-[280px] mx-auto leading-relaxed">
          {t.auth.confirmEmailSent}
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent-luxury)] border-b border-accent-luxury/20 pb-0.5 hover:border-[var(--accent-luxury)] transition-all"
        >
          {t.auth.backToLogin} <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-accent-luxury/10 text-[var(--accent-luxury)] mb-2 shadow-inner border border-accent-luxury/20">
          <UserPlus size={28} strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-[var(--text)] font-display tracking-tight uppercase italic leading-none">
          {currentRole === 'agence' ? 'Espace Professionnel' : currentRole === 'proprietaire' ? 'Espace Propriétaire' : t.auth.registerTitle}
        </h1>
        <p className="text-[13px] text-[var(--text-muted)] font-medium tracking-wide">
          {currentRole === 'agence'
            ? 'Démarcheurs, Agences & Courtiers : rejoignez notre réseau'
            : currentRole === 'proprietaire'
            ? 'Louez ou vendez vos biens en toute tranquillité'
            : t.auth.registerSubtitleShort}
        </p>
      </div>

      {/* Bannière d'accompagnement Pro / Propriétaire */}
      {currentRole === 'agence' ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-left text-xs leading-relaxed text-[var(--text)]">
            <span className="font-bold text-amber-600 dark:text-amber-400 block uppercase tracking-wider text-[11px] mb-0.5">
              Avantages Partenaire Pro
            </span>
            Publication assistée de vos biens, multidiffusion WhatsApp, réception directe des demandes de visite et gestion simplifiée de vos annonces.
          </div>
        </div>
      ) : currentRole === 'proprietaire' ? (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
          <Home className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="text-left text-xs leading-relaxed text-[var(--text)]">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider text-[11px] mb-0.5">
              Espace Bailleurs & Propriétaires
            </span>
            Sécurisez vos locations et ventes. Vos biens sont validés et mis en avant auprès de locataires et acheteurs sérieux.
          </div>
        </div>
      ) : null}

      {/* Social */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-4 px-6 py-4 border border-[var(--border)] rounded-2xl bg-[var(--surface)] text-[var(--text)] font-black text-[11px] uppercase tracking-[0.2em] hover:border-[var(--accent-luxury)] transition-all active:scale-[0.98] shadow-sm group"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleLoading ? t.auth.googleLoading : t.auth.googleSignup}
        </button>

        <div className="relative flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-[9px] font-black text-[var(--text-subtle)] uppercase tracking-widest">{t.auth.orEmail}</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-black text-center uppercase tracking-wider">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Sélection du rôle */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] ml-1">
              Vous êtes :
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <label className="relative group cursor-pointer">
                <input type="radio" value="locataire" {...register('role')} className="sr-only peer" />
                <div className="p-3 sm:p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-center peer-checked:border-[var(--accent-luxury)] peer-checked:bg-accent-luxury/10 peer-checked:shadow-sm transition-all flex flex-col items-center justify-center min-h-[82px]">
                  <Compass size={18} className="text-muted/60 mb-1 peer-checked:text-[var(--accent-luxury)]" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text)] leading-tight">
                    Particulier
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)] mt-0.5 leading-tight">
                    Locataire / Achat
                  </span>
                </div>
              </label>

              <label className="relative group cursor-pointer">
                <input type="radio" value="proprietaire" {...register('role')} className="sr-only peer" />
                <div className="p-3 sm:p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-center peer-checked:border-[var(--accent-luxury)] peer-checked:bg-accent-luxury/10 peer-checked:shadow-sm transition-all flex flex-col items-center justify-center min-h-[82px]">
                  <Home size={18} className="text-muted/60 mb-1 peer-checked:text-[var(--accent-luxury)]" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text)] leading-tight">
                    Propriétaire
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)] mt-0.5 leading-tight">
                    Bailleur / Vente
                  </span>
                </div>
              </label>

              <label className="relative group cursor-pointer">
                <input type="radio" value="agence" {...register('role')} className="sr-only peer" />
                <div className="p-3 sm:p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-center peer-checked:border-[var(--accent-luxury)] peer-checked:bg-accent-luxury/10 peer-checked:shadow-sm transition-all flex flex-col items-center justify-center min-h-[82px]">
                  <Building2 size={18} className="text-muted/60 mb-1 peer-checked:text-[var(--accent-luxury)]" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text)] leading-tight">
                    Pro Immo
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)] mt-0.5 leading-tight">
                    Démarcheur / Agence
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] ml-1">
              <User size={12} className="text-[var(--accent-luxury)]" /> {currentRole === 'agence' ? 'Nom commercial ou Nom complet' : t.auth.fullName}
            </label>
            <input
              {...register('full_name')}
              placeholder={currentRole === 'agence' ? 'Ex: Cabinet Kouassi / Roger Démarcheur' : t.auth.fullNamePlaceholderEx}
              autoComplete="name"
              aria-required="true"
              aria-invalid={errors.full_name ? 'true' : 'false'}
              aria-describedby={errors.full_name ? 'reg-fullname-error' : undefined}
              className="w-full px-6 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--accent-glow)] focus:border-[var(--accent-luxury)] transition-all text-base font-bold text-[var(--text)] placeholder:text-muted/20"
            />
            {errors.full_name && (
              <p id="reg-fullname-error" role="alert" className="text-[10px] font-bold text-red-500 ml-1 uppercase tracking-wider">{errors.full_name.message}</p>
            )}
          </div>

          {/* Numéro WhatsApp */}
          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                <Phone size={12} className="text-[var(--accent-luxury)]" /> Numéro WhatsApp
              </label>
              <span className="text-[9px] font-bold text-[var(--accent-luxury)] uppercase tracking-wider">
                {currentRole === 'agence' ? 'Fortement recommandé' : 'Optionnel'}
              </span>
            </div>
            <input
              {...register('phone')}
              placeholder="+225 07 00 00 00 00"
              type="tel"
              autoComplete="tel"
              className="w-full px-6 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--accent-glow)] focus:border-[var(--accent-luxury)] transition-all text-base font-bold text-[var(--text)] placeholder:text-muted/20"
            />
            <p className="text-[10px] text-[var(--text-muted)] ml-1">
              {currentRole === 'agence'
                ? 'Permet à l’équipe et aux prospects de vous joindre immédiatement pour vos annonces.'
                : 'Utilisé pour les confirmations de visites et le suivi WhatsApp.'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] ml-1">
              <Mail size={12} className="text-[var(--accent-luxury)]" /> {t.auth.email}
            </label>
            <input
              {...register('email')}
              placeholder={t.auth.emailPlaceholder}
              type="email"
              autoComplete="email"
              aria-required="true"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'reg-email-error' : undefined}
              className="w-full px-6 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--accent-glow)] focus:border-[var(--accent-luxury)] transition-all text-base font-bold text-[var(--text)] placeholder:text-muted/20"
            />
            {errors.email && (
              <p id="reg-email-error" role="alert" className="text-[10px] font-bold text-red-500 ml-1 uppercase tracking-wider">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] ml-1">
              <Lock size={12} className="text-[var(--accent-luxury)]" /> {t.auth.password}
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              aria-required="true"
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'reg-password-error' : undefined}
              className="w-full px-6 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--accent-glow)] focus:border-[var(--accent-luxury)] transition-all text-base font-bold text-[var(--text)] placeholder:text-muted/20"
            />
            {errors.password && (
              <p id="reg-password-error" role="alert" className="text-[10px] font-bold text-red-500 ml-1 uppercase tracking-wider">{errors.password.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-5 bg-[var(--accent-luxury)] hover:bg-accent-luxury/90 text-[var(--on-accent)] font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl shadow-xl shadow-[var(--accent-glow)] transition-all active:scale-[0.98] disabled:opacity-50 border border-white/20"
        >
          {loading ? t.auth.creating : (
            <>
              {currentRole === 'agence' ? 'Créer mon compte Pro' : t.auth.submitRegister} <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-[12px] text-[var(--text-muted)] font-medium">
          {t.auth.haveAccount}{' '}
          <Link href="/login" className="text-[var(--accent-luxury)] font-black hover:underline underline-offset-4 ml-1">
            {t.auth.loginLink}
          </Link>
        </p>
      </div>
    </motion.div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="h-40 flex items-center justify-center"><div className="w-8 h-8 border-4 border-[var(--accent-luxury)] border-t-transparent rounded-full animate-spin" /></div>}>
      <RegisterContent />
    </Suspense>
  )
}
