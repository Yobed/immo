'use client'

interface VIPConciergeButtonProps {
  bienTitre: string
  bienLieu: string
  bienPrix: string
  className?: string
}

export function VIPConciergeButton({ bienTitre, bienLieu, bienPrix, className }: VIPConciergeButtonProps) {
  const WHATSAPP_NUMBER = '2250574243752'

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Bonjour, je suis intéressé(e) par ce bien :\n\n🏠 *${bienTitre}*\n📍 ${bienLieu}\n💰 ${bienPrix}\n\nPouvez-vous me donner plus d'informations ?`
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank')
  }

  return (
    <button
      onClick={handleWhatsApp}
      className={`w-full flex items-center justify-center gap-3 py-5 px-6 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-900/40 ${className ?? ''}`}
    >
      <img src="/whatsapp-icon.svg" alt="" className="w-6 h-6 object-contain" />
      <span className="font-bold text-white text-sm tracking-wide">Contacter sur WhatsApp</span>
      <span className="ml-auto flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="text-[10px] text-white/70 font-medium">En ligne</span>
      </span>
    </button>
  )
}
