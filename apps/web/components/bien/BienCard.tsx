import Link from 'next/link'
import Image from 'next/image'
import { Badge, Card } from '@/components/ui'
import { TYPES_BIEN_LABELS } from '@immo-ci/shared/constants/biens'

interface BienCardProps {
  id: string
  titre: string
  commune: string
  type_bien: string
  prix_mois_fcfa: number | null
  prix_vente_fcfa: number | null
  surface_m2: number | null
  nb_pieces: number | null
  photo_url?: string | null
  statut?: string
}

function formatFCFA(n: number): string {
  return new Intl.NumberFormat('fr-CI', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' FCFA'
}

export function BienCard({
  id, titre, commune, type_bien, prix_mois_fcfa, prix_vente_fcfa,
  surface_m2, nb_pieces, photo_url, statut,
}: BienCardProps) {
  return (
    <Link href={`/biens/${id}`} className="block group">
      <Card padding="none" className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-[4/3] bg-[var(--surface)]">
          {photo_url ? (
            <Image
              src={photo_url}
              alt={titre}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted text-sm font-sans">
              Aucune photo
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge variant="default" className="text-xs">
              {TYPES_BIEN_LABELS[type_bien] ?? type_bien}
            </Badge>
          </div>
          {statut === 'brouillon' && (
            <div className="absolute top-2 right-2">
              <Badge variant="warning" className="text-xs">Brouillon</Badge>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-sans font-medium text-[var(--text)] line-clamp-1 mb-1">{titre}</h3>
          <p className="text-sm text-muted font-sans mb-2">{commune}</p>
          <div className="flex items-center justify-between">
            <span className="font-mono text-primary font-medium">
              {prix_mois_fcfa
                ? `${formatFCFA(prix_mois_fcfa)}/mois`
                : prix_vente_fcfa
                ? formatFCFA(prix_vente_fcfa)
                : 'Prix non renseigné'}
            </span>
            {(surface_m2 || nb_pieces) && (
              <span className="text-xs text-muted font-sans">
                {surface_m2 ? `${surface_m2} m²` : ''}{surface_m2 && nb_pieces ? ' · ' : ''}{nb_pieces ? `${nb_pieces} p.` : ''}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
