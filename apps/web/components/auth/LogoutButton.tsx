'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LogoutButtonProps {
  className?: string
  children?: React.ReactNode
}

export function LogoutButton({ className = '', children }: LogoutButtonProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button type="button" onClick={handleLogout} className={className}>
      {children ?? 'Se déconnecter'}
    </button>
  )
}
