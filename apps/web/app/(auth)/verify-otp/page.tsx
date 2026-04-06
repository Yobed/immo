'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Step = 'phone' | 'otp'

export default function VerifyOtpPage() {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Normaliser le numéro : si commence par 0, remplacer par +225
    const normalizedPhone = phone.startsWith('0')
      ? `+225${phone.slice(1)}`
      : phone.startsWith('+')
      ? phone
      : `+225${phone}`

    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
    })

    if (error) {
      if (error.message.includes('Invalid phone')) {
        setError('Numéro de téléphone invalide. Exemple : 07 XX XX XX XX')
      } else {
        setError('Impossible d\'envoyer le code. Vérifiez votre numéro et réessayez.')
      }
    } else {
      setPhone(normalizedPhone)
      setStep('otp')
    }

    setLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    })

    if (error) {
      if (error.message.includes('expired')) {
        setError('Le code a expiré. Veuillez demander un nouveau code.')
      } else if (error.message.includes('invalid')) {
        setError('Code incorrect. Vérifiez le SMS et réessayez.')
      } else {
        setError('Vérification échouée. Veuillez réessayer.')
      }
    } else {
      window.location.href = '/dashboard'
    }

    setLoading(false)
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
            Connexion par Téléphone
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'phone'
              ? 'Entrez votre numéro de téléphone ivoirien'
              : `Code envoyé au ${phone}`}
          </p>
        </div>

        {/* Indicateur d'étape */}
        <div className="flex items-center justify-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              step === 'phone' ? 'bg-[#1A5276]' : 'bg-gray-300'
            }`}
          />
          <div className="w-8 h-0.5 bg-gray-300" />
          <div
            className={`w-3 h-3 rounded-full ${
              step === 'otp' ? 'bg-[#1A5276]' : 'bg-gray-300'
            }`}
          />
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Étape 1 : Saisie du numéro */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de téléphone
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 text-sm">
                  +225
                </span>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#1A5276] focus:border-transparent"
                  placeholder="07 XX XX XX XX"
                  autoComplete="tel"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Numéro Wave, Orange Money, MTN ou Moov accepté
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !phone}
              className="w-full py-3 px-4 bg-[#1A5276] text-white font-semibold rounded-lg hover:bg-[#154360] transition-colors disabled:opacity-50"
            >
              {loading ? 'Envoi du code...' : 'Recevoir le code SMS'}
            </button>
          </form>
        )}

        {/* Étape 2 : Saisie du code OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                Code de vérification
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5276] focus:border-transparent text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
                autoComplete="one-time-code"
              />
              <p className="mt-1 text-xs text-gray-500">
                Entrez le code à 6 chiffres reçu par SMS
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 px-4 bg-[#1A5276] text-white font-semibold rounded-lg hover:bg-[#154360] transition-colors disabled:opacity-50"
            >
              {loading ? 'Vérification...' : 'Confirmer le code'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('phone')
                setOtp('')
                setError(null)
              }}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Changer de numéro
            </button>
          </form>
        )}

        {/* Lien retour connexion */}
        <div className="text-center">
          <Link href="/login" className="text-sm text-[#1A5276] hover:underline">
            Retour à la connexion par e-mail
          </Link>
        </div>
      </div>
    </div>
  )
}
