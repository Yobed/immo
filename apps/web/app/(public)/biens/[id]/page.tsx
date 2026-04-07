import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui'
import { TYPES_BIEN_LABELS, EQUIPEMENTS_LABELS } from '@immo-ci/shared/constants/biens'
import { BienCarousel } from '@/components/bien/BienCarousel'

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-CI', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' FCFA'
}

export default async function FicheBienPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bien } = await (supabase as any)
    .from('biens')
    .select(`
      *,
      biens_medias(id, url, type, titre, ordre, est_couverture, hotspots, embed_url, duree_sec),
      profiles!biens_proprietaire_id_fkey(full_name, avatar_url)
    `)
    .eq('id', id)
    .eq('statut', 'publie')
    .single()

  if (!bien) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const medias = ((bien.biens_medias as any[]) ?? []).sort((a: any, b: any) => a.ordre - b.ordre)

  return (
    <main className="bg-surface min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Carousel médias */}
        {medias.length > 0 && (
          <div className="mb-6">
            <BienCarousel medias={medias.map((m: any) => ({
              id: m.id,
              type: m.type,
              url: m.url,
              embed_url: m.embed_url,
              titre: m.titre,
              hotspots: m.hotspots,
              duree_sec: m.duree_sec,
            }))} />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <Badge variant="default" className="mb-2">{TYPES_BIEN_LABELS[bien.type_bien] ?? bien.type_bien}</Badge>
            <h1 className="font-display text-3xl text-[var(--text)] mb-1">{bien.titre}</h1>
            <p className="text-muted font-sans">{bien.quartier ? `${bien.quartier}, ` : ''}{bien.commune}</p>
          </div>
          <div className="text-right flex-shrink-0">
            {bien.prix_mois_fcfa && (
              <p className="font-mono text-2xl text-primary font-medium">{formatFCFA(bien.prix_mois_fcfa)}<span className="text-sm text-muted">/mois</span></p>
            )}
            {bien.prix_vente_fcfa && (
              <p className="font-mono text-xl text-secondary font-medium">{formatFCFA(bien.prix_vente_fcfa)}</p>
            )}
          </div>
        </div>

        {/* Caractéristiques */}
        {(bien.surface_m2 || bien.nb_pieces || bien.nb_chambres) && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-card border border-[var(--border)] mb-6">
            {bien.surface_m2 && <div className="text-center"><p className="font-mono font-medium">{bien.surface_m2} m²</p><p className="text-xs text-muted">Superficie</p></div>}
            {bien.nb_pieces && <div className="text-center"><p className="font-mono font-medium">{bien.nb_pieces}</p><p className="text-xs text-muted">Pièces</p></div>}
            {bien.nb_chambres && <div className="text-center"><p className="font-mono font-medium">{bien.nb_chambres}</p><p className="text-xs text-muted">Chambres</p></div>}
          </div>
        )}

        {/* Description */}
        <div className="bg-white rounded-card border border-[var(--border)] p-6 mb-6">
          <h2 className="font-display text-xl mb-3">Description</h2>
          <p className="font-sans text-[var(--text)] whitespace-pre-line leading-relaxed">{bien.description}</p>
        </div>

        {/* Équipements */}
        {bien.equipements && bien.equipements.length > 0 && (
          <div className="bg-white rounded-card border border-[var(--border)] p-6">
            <h2 className="font-display text-xl mb-3">Équipements</h2>
            <div className="flex flex-wrap gap-2">
              {(bien.equipements as string[]).map((eq: string) => (
                <Badge key={eq} variant="default">{EQUIPEMENTS_LABELS[eq] ?? eq}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
