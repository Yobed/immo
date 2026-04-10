import { Badge } from '@/components/ui/Badge'

type KYCStatut = 'non_verifie' | 'en_cours' | 'verifie'

interface KYCStatusBadgeProps {
  statut: KYCStatut
  className?: string
}

export function KYCStatusBadge({ statut, className }: KYCStatusBadgeProps) {
  if (statut === 'verifie') {
    return (
      <Badge variant="success" className={className}>
        Vérifié
      </Badge>
    )
  }

  if (statut === 'en_cours') {
    return (
      <Badge variant="warning" className={className}>
        En cours de vérification
      </Badge>
    )
  }

  return (
    <Badge variant="default" className={className}>
      Non vérifié
    </Badge>
  )
}
