'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/**
 * Les admins gardent l'onglet ouvert des jours sur mobile : le navigateur
 * ressert la page en mémoire (bfcache) → listes KYC/validation périmées qui
 * font croire que « ça revient en attente ». Au retour sur l'onglet, on
 * re-demande les données serveur (throttle 15 s pour ne pas marteler).
 */
export function AutoRefreshOnFocus() {
  const router = useRouter()
  const pathname = usePathname()
  const lastRefresh = useRef(0)
  const mounted = useRef(false)

  useEffect(() => {
    const refresh = () => {
      const now = Date.now()
      if (now - lastRefresh.current < 15_000) return
      lastRefresh.current = now
      router.refresh()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisible)
    // pageshow persisted = restauration bfcache (mobile) — le cas exact du bug
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) refresh()
    }
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [router])

  // Navigation entre onglets admin : App Router NE re-rend PAS le layout (donc
  // le badge « Validation », calculé côté layout), seul le segment de page se
  // recharge. Sans ça le badge reste figé (« 1 ») pendant que la file affiche
  // « 0 » → les admins croient la validation cassée. On resynchronise le layout
  // à chaque changement d'onglet (on saute le montage initial, déjà frais).
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    lastRefresh.current = Date.now()
    router.refresh()
  }, [pathname, router])

  return null
}
