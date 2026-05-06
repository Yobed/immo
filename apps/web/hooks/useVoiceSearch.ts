'use client'
import { useState, useCallback, useEffect, useRef } from 'react'

// ─── Multi-criteria parser ─────────────────────────────────────────────────

export interface VoiceFilters {
  type?: string
  commune?: string
  budgetMax?: string
  offre?: string
}

const COMMUNES: Record<string, string> = {
  'cocody': 'Cocody', 'riviera': 'Cocody', 'angre': 'Cocody', 'angré': 'Cocody',
  'deux plateaux': 'Cocody', '2 plateaux': 'Cocody',
  'plateau': 'Plateau',
  'yopougon': 'Yopougon',
  'marcory': 'Marcory', 'zone 4': 'Marcory', 'zone4': 'Marcory',
  'treichville': 'Treichville',
  'adjame': 'Adjamé', 'adjamé': 'Adjamé',
  'abobo': 'Abobo',
  'koumassi': 'Koumassi',
  'port bouet': 'Port-Bouët', 'port-bouet': 'Port-Bouët', 'port bouët': 'Port-Bouët',
  'bingerville': 'Bingerville',
}

const TYPES_VOICE: Record<string, string> = {
  'villa': 'villa', 'duplex': 'villa',
  'appartement': 'appartement', 'appart': 'appartement',
  'studio': 'studio',
  'maison': 'maison',
  'bureau': 'bureau',
  'terrain': 'terrain', 'parcelle': 'terrain',
  'commerce': 'commerce', 'boutique': 'commerce', 'magasin': 'commerce',
  'residence': 'residence_meublee', 'résidence': 'residence_meublee', 'meublé': 'residence_meublee',
}

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim()
}

export function parseVoiceCommand(text: string): VoiceFilters {
  const n = norm(text)
  const result: VoiceFilters = {}

  // Type
  for (const [kw, val] of Object.entries(TYPES_VOICE)) {
    if (n.includes(norm(kw))) { result.type = val; break }
  }

  // Commune — longest match first to avoid partial collisions
  const sorted = Object.entries(COMMUNES).sort((a, b) => b[0].length - a[0].length)
  for (const [kw, val] of sorted) {
    if (n.includes(norm(kw))) { result.commune = val; break }
  }

  // Budget
  const millMatch = n.match(/(\d+(?:[.,]\d+)?)\s*million/)
  if (millMatch) {
    result.budgetMax = String(Math.round(parseFloat(millMatch[1].replace(',', '.')) * 1_000_000))
  } else {
    const kMatch = n.match(/(\d+(?:[.,]\d+)?)\s*k\b/)
    if (kMatch) {
      result.budgetMax = String(Math.round(parseFloat(kMatch[1].replace(',', '.')) * 1_000))
    } else {
      // "500 000 francs" or "500000"
      const numMatch = n.match(/\b(\d[\d ]{4,})\b/)
      if (numMatch) {
        const v = parseInt(numMatch[1].replace(/\s/g, ''))
        if (v >= 50_000) result.budgetMax = String(v)
      }
    }
  }

  // Offre
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
