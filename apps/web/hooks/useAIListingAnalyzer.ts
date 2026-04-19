import { useState, useEffect } from 'react'

export interface AnalysisResult {
  score: number;
  feedback: string[];
  tips: string[];
  level: 'premium' | 'standard' | 'low';
}

export function useAIListingAnalyzer(data: any) {
  const [analysis, setAnalysis] = useState<AnalysisResult>({
    score: 0,
    feedback: [],
    tips: [],
    level: 'low'
  })

  useEffect(() => {
    analyze()
  }, [data])

  function analyze() {
    let score = 20
    const feedback: string[] = []
    const tips: string[] = []

    // Basic heuristics for "AI-like" feedback without calling API on every keystroke
    // We can call a real API debounced if we want more depth later

    if (data.titre?.length > 10) score += 10
    else tips.push("Un titre plus descriptif attire 3x plus de clics.")

    if (data.description?.length > 100) {
      score += 20
      feedback.push("Description détaillée excellente.")
    } else {
      tips.push("Ajoutez des détails sur le voisinage et les commodités.")
    }

    if (data.prix_mois_fcfa || data.prix_nuit_fcfa) score += 15
    else tips.push("Le prix est le critère n°1 des locataires.")

    if (data.photo_urls?.length >= 5) {
      score += 20
      feedback.push("Nombre de photos optimal.")
    } else {
      tips.push("Les annonces avec +5 photos se louent 40% plus vite.")
    }

    if (data.is_verifie) score += 15

    const level = score > 80 ? 'premium' : score > 50 ? 'standard' : 'low'

    setAnalysis({
      score: Math.min(score, 100),
      feedback,
      tips,
      level
    })
  }

  return analysis
}
