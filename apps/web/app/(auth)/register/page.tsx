'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const registerSchema = z.object({
  full_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse e-mail invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  role: z.enum(['locataire', 'proprietaire']),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'locataire' },
  })

  const supabase = createClient()

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    setError(null)
    const origin = window.location.origin
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })
    setGoogleLoading(false)
  }

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: data.role,
        },
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Cette adresse e-mail est déjà utilisée.')
      } else {
        setError("Une erreur est survenue lors de l'inscription. Veuillez réessayer.")
      }
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[var(--text)]">Inscription réussie !</h2>
        <p className="text-muted">
          Un e-mail de confirmation a été envoyé à votre adresse. Veuillez cliquer
          sur le lien pour activer votre compte.
        </p>
        <Link
          href="/login"
          className="inline-block mt-4 text-primary hover:underline font-medium"
        >
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md w-full space-y-8">
      {/* En-tête */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary font-display">
          Immo CI
        </h1>
        <h2 className="mt-4 text-2xl font-semibold text-[var(--text)]">
          S&apos;inscrire
        </h2>
        <p className="mt-2 text-sm text-muted">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-secondary hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-danger/5 border border-danger/20 text-danger px-4 py-3 rounded-card text-sm">
          {error}
        </div>
      )}

      {/* Bouton Google */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[var(--border)] rounded-btn bg-white text-[var(--text)] font-medium hover:bg-[var(--surface)] transition-colors disabled:opacity-50"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {googleLoading ? 'Redirection...' : 'Continuer avec Google'}
      </button>

      {/* Séparateur */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-surface text-muted">ou</span>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-[var(--text)] mb-1">
            Nom complet
          </label>
          <input
            id="full_name"
            type="text"
            autoComplete="name"
            {...register('full_name')}
            className="w-full px-4 py-3 border border-[var(--border)] rounded-btn focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
            placeholder="Kouassi Jean-Baptiste"
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-danger">{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--text)] mb-1">
            Adresse e-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="w-full px-4 py-3 border border-[var(--border)] rounded-btn focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
            placeholder="vous@exemple.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-danger">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--text)] mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className="w-full px-4 py-3 border border-[var(--border)] rounded-btn focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
            placeholder="Au moins 8 caractères"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-danger">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-2">
            Je suis un(e)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="relative flex items-center justify-center p-4 border-2 rounded-card cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 border-[var(--border)]">
              <input
                type="radio"
                value="locataire"
                {...register('role')}
                className="sr-only"
              />
              <div className="text-center">
                <div className="text-2xl mb-1">🏠</div>
                <span className="text-sm font-medium text-[var(--text)]">Locataire</span>
              </div>
            </label>
            <label className="relative flex items-center justify-center p-4 border-2 rounded-card cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 border-[var(--border)]">
              <input
                type="radio"
                value="proprietaire"
                {...register('role')}
                className="sr-only"
              />
              <div className="text-center">
                <div className="text-2xl mb-1">🔑</div>
                <span className="text-sm font-medium text-[var(--text)]">Propriétaire</span>
              </div>
            </label>
          </div>
          {errors.role && (
            <p className="mt-1 text-sm text-danger">{errors.role.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-secondary text-white font-semibold rounded-btn hover:bg-secondary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Inscription en cours...' : "S'inscrire"}
        </button>
      </form>

      <p className="text-xs text-center text-muted">
        En vous inscrivant, vous acceptez nos{' '}
        <Link href="/mentions-legales" className="underline">
          conditions d&apos;utilisation
        </Link>
        .
      </p>
    </div>
  )
}
