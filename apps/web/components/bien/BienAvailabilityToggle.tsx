'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface BienAvailabilityToggleProps {
  bienId: string
  initialValue: boolean
}

/**
 * Toggle "Disponibilité" sur la fiche d'un bien (espace proprio).
 *
 * Modifie 2 champs solidairement :
 *   - `est_disponible` (boolean) — drapeau métier
 *   - `statut` ('publie' ↔ 'loue') — visibilité dans le catalogue public
 *
 * Effet immédiat :
 *   - "Occupé" → statut='loue' → le bien DISPARAÎT du catalogue + de Sapphire
 *   - "Disponible" → statut='publie' → le bien REVIENT dans le catalogue
 *
 * On utilise les états 'publie' et 'loue' déjà autorisés par la contrainte
 * `biens_statut_check` (cf migration 021). Pas besoin de revalidation admin
 * pour le passage occupé → disponible : c'est un retour d'état, pas un
 * changement de publication.
 */
export function BienAvailabilityToggle({ bienId, initialValue }: BienAvailabilityToggleProps) {
  const [isAvailable, setIsAvailable] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleToggle = async () => {
    if (loading) return

    setLoading(true)
    setError(null)
    const newValue = !isAvailable

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase as any)
        .from('biens')
        .update({
          est_disponible: newValue,
          // ⚠ Synchronise le statut : 'publie' quand disponible, 'loue' quand occupé.
          // Le RLS exige l'auteur ou admin → géré côté policy. Le check constraint
          // (migration 021) autorise les 2 valeurs.
          statut: newValue ? 'publie' : 'loue',
        })
        .eq('id', bienId)

      if (err) {
        setError(err.message)
        return
      }

      setIsAvailable(newValue)
      // Force le re-fetch des données serveur (dashboard, mes-biens, etc.)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3 bg-surface-variant/30 p-2 rounded-lg border border-border/50">
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
          Disponibilité
        </span>
        <span className={`text-[10px] font-medium ${isAvailable ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isAvailable ? 'En ligne' : 'Occupé · masqué du catalogue'}
        </span>
        {error && (
          <span className="text-[10px] text-rose-500 mt-0.5">{error}</span>
        )}
      </div>
      
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          isAvailable ? 'bg-emerald-500/20' : 'bg-muted/50'
        } ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
      >
        <motion.div
          animate={{ x: isAvailable ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`absolute top-1 w-4 h-4 rounded-full shadow-sm ${
            isAvailable ? 'bg-emerald-500' : 'bg-muted-foreground'
          }`}
        >
          {isAvailable && (
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 rounded-full bg-emerald-400 blur-[2px]"
            />
          )}
        </motion.div>
      </button>
    </div>
  )
}
