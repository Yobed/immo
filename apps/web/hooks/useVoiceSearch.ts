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

/**
 * Traduit les codes d'erreur Speech Recognition en messages humains FR.
 * Codes officiels Web Speech API : no-speech, audio-capture, not-allowed,
 * network, aborted, service-not-allowed, bad-grammar, language-not-supported.
 */
function translateError(code: string | null | undefined): string | null {
  if (!code) return null
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone bloqué. Autorisez l\'accès au micro dans les réglages du navigateur.'
    case 'no-speech':
      return 'Aucune parole détectée. Parlez plus fort et réessayez.'
    case 'audio-capture':
      return 'Impossible de capter le micro. Vérifiez votre matériel.'
    case 'network':
      return 'Pas de connexion internet. La reconnaissance vocale nécessite internet.'
    case 'aborted':
      return null // user-initiated, pas une vraie erreur à afficher
    case 'language-not-supported':
      return 'Français non disponible sur ce navigateur. Tapez votre recherche.'
    default:
      return `Erreur micro : ${code}. Réessayez ou tapez votre recherche.`
  }
}

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
    // Speech Recognition exige HTTPS (sauf localhost). Sur HTTP en prod
    // l'API existe mais throw silencieusement → on vérifie aussi le protocole.
    const isSecure = window.isSecureContext || window.location.hostname === 'localhost'
    if (!isSecure) {
      setIsSupported(false)
      setError('La recherche vocale nécessite une connexion sécurisée (HTTPS).')
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setIsSupported(false)
      return
    }

    setIsSupported(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR()
    rec.lang = 'fr-FR'
    rec.interimResults = false
    rec.continuous = false
    rec.maxAlternatives = 1

    rec.onstart = () => setIsListening(true)
    rec.onend = () => setIsListening(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      setError(translateError(e?.error))
      setIsListening(false)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const result = e?.results?.[0]?.[0]?.transcript
      if (result) setTranscript(result)
    }

    recognitionRef.current = rec

    // Cleanup : stoppe la recognition au démontage
    return () => {
      try { rec.stop() } catch { /* déjà stoppé */ }
    }
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Recherche vocale non disponible sur ce navigateur.')
      return
    }
    setError(null)
    setTranscript('')
    try {
      recognitionRef.current.start()
    } catch (e) {
      // Erreur "already started" : on stoppe puis on redémarre proprement
      try {
        recognitionRef.current.stop()
        setTimeout(() => {
          try { recognitionRef.current?.start() } catch { /* idem */ }
        }, 100)
      } catch {
        setError(e instanceof Error ? e.message : 'Impossible de démarrer le micro')
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      /* déjà stoppé */
    }
  }, [])

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    isSupported: isMounted && isSupported,
  }
}
