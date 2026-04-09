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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'locataire' },
  })

  const supabase = createClient()

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Inscription réussie !</h2>
          <p className="text-gray-600">
            Un e-mail de confirmation a été envoyé à votre adresse. Veuillez cliquer
            sur le lien pour activer votre compte.
          </p>
          <Link
            href="/login"
            className="inline-block mt-4 text-[#1A5276] hover:underline font-medium"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* En-tête */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1A5276]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Immo CI
          </h1>
          <h2 className="mt-4 text-2xl font-semibold text-gray-800">
            S&apos;inscrire
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-[#E67E22] hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet
            </label>
            <input
              id="full_name"
              type="text"
              autoComplete="name"
              {...register('full_name')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5276] focus:border-transparent"
              placeholder="Kouassi Jean-Baptiste"
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5276] focus:border-transparent"
              placeholder="vous@exemple.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5276] focus:border-transparent"
              placeholder="Au moins 8 caractères"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Je suis un(e)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer has-[:checked]:border-[#1A5276] has-[:checked]:bg-blue-50 border-gray-200">
                <input
                  type="radio"
                  value="locataire"
                  {...register('role')}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-2xl mb-1">🏠</div>
                  <span className="text-sm font-medium text-gray-700">Locataire</span>
                </div>
              </label>
              <label className="relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer has-[:checked]:border-[#1A5276] has-[:checked]:bg-blue-50 border-gray-200">
                <input
                  type="radio"
                  value="proprietaire"
                  {...register('role')}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-2xl mb-1">🔑</div>
                  <span className="text-sm font-medium text-gray-700">Propriétaire</span>
                </div>
              </label>
            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#E67E22] text-white font-semibold rounded-lg hover:bg-[#ca6f1e] transition-colors disabled:opacity-50"
          >
            {loading ? 'Inscription en cours...' : "S'inscrire"}
          </button>
        </form>

        <p className="text-xs text-center text-gray-500">
          En vous inscrivant, vous acceptez nos{' '}
          <Link href="/mentions-legales" className="underline">
            conditions d&apos;utilisation
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
