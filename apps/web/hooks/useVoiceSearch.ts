'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { parseSearchQuery } from '@/lib/searchParser'

// ─── Multi-criteria parser ─────────────────────────────────────────────────

export interface VoiceFilters {
  type?: string
  commune?: string
  budgetMax?: string
  /** Équipements détectés (piscine, parking, climatisation, etc.) — array car
   *  l'utilisateur peut en demander plusieurs ("maison avec piscine et parking"). */
  equipements?: string[]
  offre?: string
}

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim()
}

/**
 * Parse une commande vocale en filtres de recherche.
 *
 * Délègue la détection commune/type/équipements/budget au parser texte
 * `parseSearchQuery` (qui est plus robuste : il connaît tous les équipements
 * et tous les alias). On ajoute uniquement la détection "offre" (vente/location)
 * spécifique au parler oral.
 */
export function parseVoiceCommand(text: string): VoiceFilters {
  const n = norm(text)
  const parsed = parseSearchQuery(text)

  const result: VoiceFilters = {}
  if (parsed.type_bien) result.type = parsed.type_bien
  if (parsed.commune) result.commune = parsed.commune
  if (parsed.prix_max) result.budgetMax = parsed.prix_max
  if (parsed.equipements && parsed.equipements.length > 0) {
    result.equipements = parsed.equipements
  }

  // Offre (spécifique voix — pas dans parseSearchQuery)
  if (/vent|achet|achat/.test(n)) result.offre = 'vente'
  else if (/locat|louer|loyer/.test(n)) result.offre = 'location'

  return result
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useVoiceSearch() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setIsSupported(false); return }

    setIsSupported(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR()
    rec.lang = 'fr-FR'
    rec.interimResults = false
    rec.continuous = false

    rec.onstart = () => setIsListening(true)
    rec.onend   = () => setIsListening(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => { setError(e.error); setIsListening(false) }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => setTranscript(e.results[0][0].transcript)

    recognitionRef.current = rec
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    setError(null)
    setTranscript('')
    try { recognitionRef.current.start() } catch { /* already started */ }
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return {
    isListening, transcript, error,
    startListening, stopListening,
    isSupported: isMounted && isSupported,
  }
}
