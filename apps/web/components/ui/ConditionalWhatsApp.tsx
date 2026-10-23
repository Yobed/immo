'use client'
import { usePathname } from 'next/navigation'
import { WhatsAppConcierge } from '@/components/ui/WhatsAppConcierge'

export function ConditionalWhatsApp() {
  const pathname = usePathname()
  // Sur les pages de détail de bien (/biens/[id]), sur mobile le StickyMobileCTA
  // fournit déjà l'action WhatsApp dédiée. On ne masque donc que sur mobile via CSS (hidden md:block).
  const isBienDetail = pathname?.startsWith('/biens/') && pathname.split('/').length >= 3
  return (
    <div className={isBienDetail ? "hidden md:block" : ""}>
      <WhatsAppConcierge />
    </div>
  )
}
