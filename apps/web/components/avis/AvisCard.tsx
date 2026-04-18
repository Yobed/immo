import { StarRating } from './StarRating'
import { Card } from '@/components/ui/Card'

interface AvisCardProps {
  auteurNom: string
  note: number
  commentaire?: string
  reponseCible?: string
  dateCreation: string
  showReponse?: boolean
}

export function AvisCard({
  auteurNom,
  note,
  commentaire,
  reponseCible,
  dateCreation,
  showReponse = true,
}: AvisCardProps) {
  const dateLabel = new Date(dateCreation).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Card className="p-4">
      {/* En-tête */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-white">{auteurNom}</p>
          <p className="text-xs text-gray-400">{dateLabel}</p>
        </div>
        <StarRating value={note} size="sm" />
      </div>

      {/* Commentaire */}
      {commentaire && (
        <p className="text-sm text-white/80 mb-3 leading-relaxed">{commentaire}</p>
      )}

      {/* Réponse propriétaire */}
      {showReponse && reponseCible && (
        <div className="mt-3 pl-4 border-l-2 border-primary/30 bg-blue-50 rounded-r-md p-3">
          <p className="text-xs font-semibold text-primary mb-1">Réponse du propriétaire :</p>
          <p className="text-sm text-white/80">{reponseCible}</p>
        </div>
      )}
    </Card>
  )
}
