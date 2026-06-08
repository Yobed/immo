'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, Sparkles, X, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STORAGE_KEY = 'onboarding-dismissed-v1'

interface ChecklistState {
  profileComplete: boolean
  hasBien: boolean
  hasPhoto: boolean
  hasFavoris: boolean
}

interface Props {
  userId: string
}

/**
 * Checklist d'onboarding — apparaît tant que l'utilisateur n'a pas validé toutes les étapes
 * (profil rempli, 1er bien créé, 1ère photo uploadée, 1 favori).
 * Dismissible définitivement (localStorage).
 */
export function OnboardingChecklist({ userId }: Props) {
  const [state, setState] = useState<ChecklistState | null>(null)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(STORAGE_KEY)) return
    setDismissed(false)

    const supabase = createClient()
    let cancelled = false

    ;(async () => {
      const [{ data: profile }, biensRes, favorisRes] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('profiles').select('full_name, phone, avatar_url').eq('id', userId).maybeSingle(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('biens').select('id', { count: 'exact', head: false }).eq('proprietaire_id', userId).limit(1),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('favoris').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ])

      if (cancelled) return

      const firstBienId: string | undefined = biensRes?.data?.[0]?.id
      let hasPhoto = false
      if (firstBienId) {
        const { count: photoCount } = await (supabase as any)
          .from('biens_medias')
          .select('id', { count: 'exact', head: true })
          .eq('bien_id', firstBienId)
          .eq('type', 'photo')
        hasPhoto = (photoCount ?? 0) > 0
      }

      setState({
        profileComplete: !!(profile?.full_name && profile?.phone),
        hasBien: !!firstBienId,
        hasPhoto,
        hasFavoris: (favorisRes?.count ?? 0) > 0,
      })
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  if (dismissed || !state) return null

  const items = [
    {
      done: state.profileComplete,
      label: 'Compléter ton profil',
      desc: 'Nom + téléphone WhatsApp pour être joignable',
      href: '/profil',
    },
    {
      done: state.hasBien,
      label: 'Publier ton 1er bien',
      desc: 'Décris-le, on s\'occupe du reste',
      href: '/mes-biens/nouveau',
    },
    {
      done: state.hasPhoto,
      label: 'Ajouter au moins 1 photo',
      desc: 'Les annonces avec photos reçoivent 5× plus de demandes',
      href: '/mes-biens',
    },
    {
      done: state.hasFavoris,
      label: 'Sauvegarder un bien en favori',
      desc: 'Pour comparer plus tard',
      href: '/biens',
    },
  ]

  const completed = items.filter((i) => i.done).length
  if (completed === items.length) return null // tout fait → on n'affiche rien

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* quota */
    }
  }

  const progress = Math.round((completed / items.length) * 100)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        // ⚠️ Fond CLAIR fixe (amber-50/white) — donc tous les textes doivent
        // utiliser des couleurs FONCÉES en dur (slate-900 et amber-700),
        // sans var(--text) qui serait blanc en dark mode et invisible.
        className="relative bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-2xl p-5 md:p-6 mb-6 overflow-hidden"
      >
        <button
          onClick={dismiss}
          aria-label="Masquer la checklist"
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-amber-100/60 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-700">Bienvenue</p>
            <h3 className="font-display font-bold text-lg text-slate-900 leading-tight">
              Active ton compte en {items.length} étapes
            </h3>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">
              {completed} / {items.length} terminées
            </span>
            <span className="text-[10px] font-bold text-amber-700">{progress}%</span>
          </div>
          <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
            />
          </div>
        </div>

        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i}>
              <Link
                href={item.href}
                // Fond clair fixe (banner amber-50) → couleurs fixées en dur,
                // pas de var(--text) qui serait blanc en dark mode.
                className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                  item.done
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                    : 'bg-white/80 border-amber-200/60 hover:border-amber-400 hover:shadow-sm text-slate-900'
                }`}
              >
                {item.done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" strokeWidth={2} />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={2} />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold leading-tight text-slate-900 ${item.done ? 'line-through opacity-60' : ''}`}>
                    {item.label}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
                {!item.done && <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />}
              </Link>
            </li>
          ))}
        </ul>
      </motion.div>
    </AnimatePresence>
  )
}
