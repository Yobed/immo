import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, useSegments } from 'expo-router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface SessionContextValue {
  session: Session | null
  isLoading: boolean
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  isLoading: true,
})

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Charger la session existante (depuis expo-sqlite localStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    // Écouter les changements d'état auth (login, logout, refresh token)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <SessionContext.Provider value={{ session, isLoading }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession doit être utilisé dans un SessionProvider')
  }
  return context
}

// AuthGuard — à utiliser dans app/_layout.tsx
// Redirige vers login si pas de session, vers tabs si déjà connecté
export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, isLoading } = useSession()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!session && !inAuthGroup) {
      // Pas authentifié et pas sur un écran auth → rediriger vers login
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      // Authentifié mais sur un écran auth → rediriger vers les onglets
      router.replace('/(tabs)')
    }
  }, [session, isLoading, segments])

  // Pendant le chargement, ne rien afficher (splash screen reste visible)
  if (isLoading) return null

  return <>{children}</>
}
