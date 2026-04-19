'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface BienAvailabilityToggleProps {
  bienId: string
  initialValue: boolean
}

export function BienAvailabilityToggle({ bienId, initialValue }: BienAvailabilityToggleProps) {
  const [isAvailable, setIsAvailable] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleToggle = async () => {
    if (loading) return
    
    setLoading(true)
    const newValue = !isAvailable
    
    try {
      const { error } = await (supabase as any)
        .from('biens')
        .update({ est_disponible: newValue })
        .eq('id', bienId)

      if (error) {
        console.error('Error updating availability:', error)
        return
      }

      setIsAvailable(newValue)
      router.refresh()
    } catch (err) {
      console.error('Failed to toggle availability:', err)
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
          {isAvailable ? 'En ligne' : 'Occupé'}
        </span>
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
