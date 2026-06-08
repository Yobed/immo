import { MapPin, Home, Building2, Palmtree, Briefcase, Store, Shovel, Warehouse, BedDouble, Info } from 'lucide-react'

/**
 * Placeholder visuel honnête pour les offres flash sans photo.
 *
 * Principe : ne JAMAIS afficher une image stock générique qui créerait
 * une fausse attente. À la place, une carte d'identité minimaliste qui
 * montre exactement ce qu'on sait. L'absence de photo devient un signal
 * de transparence, pas un défaut.
 *
 * Variant :
 *   - 'card'  : affichage compact (utilisé dans la grille)
 *   - 'hero'  : affichage pleine page (utilisé sur la fiche détail)
 */

type IconType = React.ComponentType<{ className?: string }>

const TYPE_ICONS: Record<string, IconType> = {
  appartement: Building2,
  villa: Palmtree,
  maison: Home,
  studio: Warehouse,
  bureau: Briefcase,
  commerce: Store,
  terrain: Shovel,
  residence_meublee: BedDouble,
}

function getTypeIcon(typeBien: string): IconType {
  return TYPE_ICONS[typeBien] ?? Home
}

interface FlashPlaceholderProps {
  typeBien: string
  commune: string
  quartier?: string | null
  variant?: 'card' | 'hero'
}

export function FlashPlaceholder({
  typeBien,
  commune,
  quartier,
  variant = 'card',
}: FlashPlaceholderProps) {
  const Icon = getTypeIcon(typeBien)
  const typeLabel = typeBien.replace(/_/g, ' ')
  const lieu = [quartier, commune].filter(Boolean).join(' · ')

  if (variant === 'hero') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-4 sm:p-6 md:p-10 text-center overflow-auto">
        {/* Hairline grid background — texture sobre */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #0F172A 1px, transparent 1px), linear-gradient(to bottom, #0F172A 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative z-10 flex flex-col items-center max-w-md w-full">
          {/* Icône — tailles réduites sur mobile pour laisser place au texte */}
          <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-3 sm:mb-6 shadow-sm shrink-0">
            <Icon className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12" />
          </div>
          <p className="font-display text-lg sm:text-2xl md:text-3xl font-bold text-slate-900 capitalize tracking-tight mb-1 sm:mb-2">
            {typeLabel}
          </p>
          {lieu && (
            <p className="inline-flex items-center gap-1 text-xs sm:text-sm text-slate-600 mb-3 sm:mb-6">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">{lieu}</span>
            </p>
          )}
          <div className="w-full flex items-start gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-amber-50 border border-amber-200 text-left">
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px] sm:text-xs text-amber-900 leading-relaxed min-w-0 break-words">
              <strong className="block mb-0.5">Photos non disponibles</strong>
              Annonce provenant d&apos;un groupe WhatsApp public sans média. Notre conseiller peut les solliciter auprès du propriétaire.
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Variant 'card' (compact pour la grille)
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-3">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #0F172A 1px, transparent 1px), linear-gradient(to bottom, #0F172A 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-2">
          <Icon className="w-6 h-6" />
        </div>
        <p className="font-display text-xs font-bold text-slate-900 capitalize mb-0.5">
          {typeLabel}
        </p>
        <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
          Sans photo
        </p>
      </div>
    </div>
  )
}
