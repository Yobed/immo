'use client'
import { usePathname } from 'next/navigation'
import { WhatsAppConcierge } from '@/components/ui/WhatsAppConcierge'

export function ConditionalWhatsApp() {
  const pathname = usePathname()
  // Sur les pages de détail de bien, le StickyMobileCTA a déjà un bouton WhatsApp mobile
  // On masque le bouton global uniquement sur mobile pour éviter le doublon
  const isBienDetail = pathname?.startsWith('/biens/') && pathname.split('/').length >= 3
  if (isBienDetail) return null
  return <WhatsAppConcierge />
}
