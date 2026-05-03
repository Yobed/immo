'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const STORAGE_KEY = 'bgp_onboarded'

interface Choice {
  emoji: string
  title: string
  description: string
  href: string
}

const CHOICES: Choice[] = [
  {
    emoji: '🏠',
    title: 'Je cherche à louer',
    description: 'Appartements, studios, maisons à louer',
    href: '/biens?type_bien=appartement',
  },
  {
    emoji: '🌟',
    title: 'Je cherche une résidence meublée',
    description: 'Court et moyen séjour, tout équipé',
    href: '/biens?type_bien=residence_meublee',
  },
  {
    emoji: '📋',
    title: 'Je suis propriétaire',
    description: 'Publier et gérer mes annonces',
    href: '/register',
  },
]

export function OnboardingModal() {
  const [visible, setVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY)
      if (!done) setVisible(true)
    } catch {
      // localStorage non disponible (SSR ou mode privé strict)
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignorer
    }
    setVisible(false)
  }

  function handleChoice(href: string) {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignorer
    }
    setVisible(false)
    router.push(href)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="onboarding-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', backgroundColor: 'rgba(2,6,23,0.7)' }}
          aria-modal="true"
          role="dialog"
          aria-labelledby="onboarding-title"
        >
          <motion.div
            key="onboarding-panel"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
            style={{
              background: 'var(--background)',
              borderColor: 'var(--border)',
            }}
          >
            {/* Close */}
            <button
              onClick={dismiss}
              aria-label="Fermer"
              className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="mb-5">
              <p
                className="font-display italic text-[13px] tracking-wide mb-0.5"
                style={{ color: 'var(--accent-luxury)' }}
              >
                Bienvenue
              </p>
              <h2
                id="onboarding-title"
                className="font-display font-bold text-[22px] leading-tight tracking-tight"
                style={{ color: 'var(--text)' }}
              >
                Que recherchez-vous ?
              </h2>
              <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Aidez-nous à vous montrer ce qui vous correspond.
              </p>
            </div>

            {/* Choices */}
            <div className="flex flex-col gap-2.5 mb-5">
              {CHOICES.map((choice) => (
                <button
                  key={choice.href}
                  onClick={() => handleChoice(choice.href)}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.98] group"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-luxury)'
                    e.currentTarget.style.background = 'var(--surface)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                >
                  <span className="text-2xl shrink-0" aria-hidden="true">{choice.emoji}</span>
                  <div>
                    <p className="text-[13px] font-bold leading-tight" style={{ color: 'var(--text)' }}>
                      {choice.title}
                    </p>
                    <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                      {choice.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Skip */}
            <button
              onClick={dismiss}
              className="w-full text-center text-[11px] py-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Continuer sans choisir
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
