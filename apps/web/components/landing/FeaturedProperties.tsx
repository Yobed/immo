import { Card } from '@/components/ui'
import { Badge } from '@/components/ui'
import Link from 'next/link'

const properties = [
  {
    id: 1,
    title: 'Appartement moderne F3',
    commune: 'Cocody',
    quartier: 'Riviera 2',
    price: 180_000,
    type: 'location',
    rooms: 3,
    surface: 85,
  },
  {
    id: 2,
    title: 'Villa avec piscine',
    commune: 'Bingerville',
    quartier: 'Résidence Palmiers',
    price: 95_000_000,
    type: 'vente',
    rooms: 5,
    surface: 300,
  },
  {
    id: 3,
    title: 'Studio meublé tout équipé',
    commune: 'Plateau',
    quartier: 'Centre-ville',
    price: 75_000,
    type: 'location',
    rooms: 1,
    surface: 35,
  },
]

function formatFCFA(amount: number): string {
  return amount.toLocaleString('fr-CI') + ' FCFA'
}

export function FeaturedProperties() {
  return (
    <section className="py-20 bg-surface">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Biens vedette
          </h2>
          <p className="font-sans text-muted text-lg max-w-xl mx-auto">
            Découvrez une sélection de biens immobiliers premium à Abidjan et en Côte d&apos;Ivoire.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
          {properties.map((prop) => (
            <Card key={prop.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image placeholder */}
              <div className="relative h-48 bg-primary/10 flex items-center justify-center">
                <span className="text-4xl text-primary/30">&#127968;</span>
                <div className="absolute top-3 left-3">
                  <Badge variant={prop.type === 'vente' ? 'success' : 'video'}>
                    {prop.type === 'vente' ? 'Vente' : 'Location'}
                  </Badge>
                </div>
              </div>

              <div className="p-4">
                <p className="font-mono text-lg font-semibold text-primary mb-1">
                  {prop.type === 'location'
                    ? `${formatFCFA(prop.price)} / mois`
                    : formatFCFA(prop.price)}
                </p>
                <h3 className="font-display text-base font-semibold text-gray-800 mb-1">
                  {prop.title}
                </h3>
                <p className="font-sans text-sm text-muted mb-3">
                  {prop.quartier}, {prop.commune}
                </p>
                <div className="flex gap-4 text-xs text-muted font-sans">
                  <span>{prop.rooms} pièces</span>
                  <span>{prop.surface} m²</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/biens"
            className="inline-flex items-center justify-center gap-2 font-sans font-medium transition-colors rounded-btn bg-primary text-white hover:bg-primary/90 px-6 py-3 text-base"
          >
            Voir tous les biens
          </Link>
        </div>
      </div>
    </section>
  )
}
