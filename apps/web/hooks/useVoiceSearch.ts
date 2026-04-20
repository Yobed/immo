'use client'
import { useState, useCallback, useEffect, useRef } from 'react'

export function useVoiceSearch() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Check for global browser support
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('RECOGNITION_NOT_SUPPORTED')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setError(event.error)
      setIsListening(false)
    }

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript
      setTranscript(text)
    }

    recognitionRef.current = recognition
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    setError(null)
    setTranscript('')
    try {
      recognitionRef.current.start()
    } catch (e) {
      console.error('Failed to start recognition:', e)
    }
  }, [])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    recognitionRef.current.stop()
  }, [])

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    isSupported: !!recognitionRef.current
  }
}
