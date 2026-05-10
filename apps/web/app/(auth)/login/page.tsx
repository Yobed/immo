'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useT } from '@/lib/i18n/client'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { resolvePostLoginPath } from '@/app/actions/post-login'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginContent() {
  const router = useRouter()
  const t = useT()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const supabase = createClient()

  // Get redirect URL from search params (null si non fourni → on choisira selon le rôle)
  const explicitRedirect = searchParams.get('redirect')
  const redirectUrl = explicitRedirect || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setError('Identifiants incorrects. Veuillez réessayer.')
      setLoading(false)
    } else {
      const path = await resolvePostLoginPath(explicitRedirect)
      router.push(path)
      router.refresh()
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)

    const origin = window.location.origin
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/callback?next=${encodeURIComponent(redirectUrl)}`,
      },
    })
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full space-y-10"
    >
      {/* Header — Editorial Style */}
      <div className="text-center space-y-4">
        <Image
          src="/bogbes-logo.png"
          alt="BOGBE'S GROUPE"
          width={72}
          height={72}
          className="mx-auto mb-2 object-contain"
        />
        <h1 className="text-3xl md:text-4xl font-black text-[var(--text)] font-display tracking-tight uppercase italic leading-none">
          {t.auth.loginTitle}
        </h1>
        <p className="text-[13px] text-[var(--text-muted)] font-medium tracking-wide max-w-[260px] mx-auto leading-relaxed">
          {t.auth.loginSubtitle}
        </p>
      </div>

      {/* Social Login */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-4 px-6 h-[64px] border border-[var(--border)] rounded-2xl bg-[var(--surface)] text-[var(--text)] font-black text-[12px] uppercase tracking-[0.2em] hover:border-[var(--accent-luxury)] transition-all active:scale-[0.98] shadow-sm group"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleLoading ? t.auth.googleLoading : t.auth.googleContinue}
        </button>

        <div className="relative flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-[9px] font-black text-[var(--text-subtle)] uppercase tracking-widest">{t.auth.orEmail}</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>
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
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] ml-1">
              <Mail size={12} className="text-[var(--accent-luxury)]" /> {t.auth.email}
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder={t.auth.emailPlaceholder}
              className="w-full px-6 h-[64px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--accent-glow)] focus:border-[var(--accent-luxury)] transition-all text-base font-bold text-[var(--text)] placeholder:text-[var(--text-muted)]/20"
            />
            {errors.email && (
              <p className="text-[10px] font-bold text-red-500 ml-1 uppercase tracking-wider">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                <Lock size={12} className="text-[var(--accent-luxury)]" /> {t.auth.password}
              </label>
              <Link href="/forgot-password" className="text-[10px] font-black text-[var(--accent-luxury)] uppercase tracking-widest hover:underline">
                {t.auth.forgotPassword}
              </Link>
            </div>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="w-full px-6 h-[64px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--accent-glow)] focus:border-[var(--accent-luxury)] transition-all text-base font-bold text-[var(--text)] placeholder:text-[var(--text-muted)]/20"
            />
            {errors.password && (
              <p className="text-[10px] font-bold text-red-500 ml-1 uppercase tracking-wider">{errors.password.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 h-[64px] bg-[var(--accent-luxury)] hover:bg-[var(--accent-luxury)]/90 text-[var(--on-accent)] font-black uppercase tracking-[0.3em] text-[12px] rounded-2xl shadow-xl shadow-[var(--accent-glow)] transition-all active:scale-[0.98] disabled:opacity-50 border border-white/20 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          {loading ? t.auth.loading : (
            <>
              {t.auth.submitLogin} <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-6">
        <p className="text-[13px] text-[var(--text-muted)] font-medium">
          {t.auth.noAccount}{' '}
          <Link href="/register" className="text-[var(--text)] hover:text-[var(--accent-luxury)] font-black uppercase tracking-widest text-[11px] transition-colors border-b border-[var(--text)]/20 ml-1 pb-0.5">
            {t.auth.createAccount}
          </Link>
        </p>
      </div>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full flex items-center justify-center p-8 text-[var(--text-muted)] text-[12px] uppercase tracking-widest font-black">Chargement...</div>}>
      <LoginContent />
    </Suspense>
  )
}
