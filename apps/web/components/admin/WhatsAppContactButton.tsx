'use client'

import { useState } from 'react'
import { MessageCircle, Check } from 'lucide-react'
import { whatsappLink } from '@/lib/whatsapp'
import { markProspectContactedAction } from '@/app/admin/prospects/actions'

interface WhatsAppContactButtonProps {
  phone: string
  prospectId?: string
  prospectVersion?: number
  currentStatus?: string
  label?: string
  variant?: 'primary' | 'secondary' | 'compact'
  className?: string
  onStatusChanged?: (newStatus: string) => void
}

export function WhatsAppContactButton({
  phone,
  prospectId,
  prospectVersion = 1,
  currentStatus,
  label = 'Contacter',
  variant = 'primary',
  className = '',
  onStatusChanged,
}: WhatsAppContactButtonProps) {
  const [justContacted, setJustContacted] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // 1. Ouvrir le lien WhatsApp dans un nouvel onglet
    const url = whatsappLink(phone)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }

    // 2. Si le prospect était "nouveau", bascule automatique en "contacte"
    if (prospectId && currentStatus === 'nouveau' && !justContacted) {
      setJustContacted(true)
      try {
        await markProspectContactedAction(prospectId, prospectVersion)
        onStatusChanged?.('contacte')
      } catch (err) {
        console.error('Erreur bascule automatique statut contacté:', err)
      }
    }
  }

  const baseCls =
    variant === 'compact'
      ? 'min-h-[36px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95'
      : 'min-h-[40px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95'

  const toneCls = justContacted
    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'
    : 'bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-[#25D366]/20'

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseCls} ${toneCls} ${className}`}
      title={justContacted ? 'Marqué comme contacté' : 'Ouvrir WhatsApp et marquer automatiquement le lead comme contacté'}
    >
      {justContacted ? <Check className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />}
      <span>{justContacted ? 'Contacté ✓' : label}</span>
    </button>
  )
}
