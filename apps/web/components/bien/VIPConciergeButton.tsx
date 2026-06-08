'use client'
import Image from 'next/image'
import { useT } from '@/lib/i18n/client'
interface VIPConciergeButtonProps {
  bienTitre: string
  bienLieu: string
  bienPrix: string
  bienId?: string
  className?: string
}

export function VIPConciergeButton({ bienTitre, bienLieu, bienPrix, bienId, className }: VIPConciergeButtonProps) {
  const t = useT()
  const WHATSAPP_NUMBER = '2250574243752'

  const handleWhatsApp = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bogbes-groupe.vercel.app'
    const linkLine = bienId ? `\n\n${origin}/biens/${bienId}` : ''
    // Format ASCII-safe : utilise « • » (bullet U+2022) au lieu d'emojis qui
    // peuvent ne pas s'afficher sur certains clients WhatsApp (Web/Desktop sans
    // support emoji complet → affiche « � » à la place).
    // Apostrophe typographique « ’ » (U+2019) ne nécessite pas d'encoding HTML.
    const text = encodeURIComponent(
      `Bonjour, je suis intéressé(e) par ce bien :\n\n• *${bienTitre}*\n• ${bienLieu}\n• ${bienPrix}${linkLine}\n\nPouvez-vous me donner plus d’informations ?`
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank')
  }

  return (
    <button
      onClick={handleWhatsApp}
      className={`w-full flex items-center justify-center gap-3 py-5 px-6 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-900/40 ${className ?? ''}`}
    >
      <Image src="/whatsapp-icon.svg" alt="" width={24} height={24} className="w-6 h-6 object-contain" />
      <span className="font-bold text-white text-sm tracking-wide">{t.bien.contactWhatsapp}</span>
      <span className="ml-auto flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[var(--surface-card)] animate-pulse" />
        <span className="text-[10px] text-white/70 font-medium">{t.chat.online}</span>
      </span>
    </button>
  )
}
