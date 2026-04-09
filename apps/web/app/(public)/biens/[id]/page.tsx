import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Badge } from '@/components/ui'
import { TYPES_BIEN_LABELS, EQUIPEMENTS_LABELS } from '@immo-ci/shared/constants/biens'
import { BienCarousel } from '@/components/bien/BienCarousel'
import { FavorisButton } from '@/components/bien/FavorisButton'
import { VisiteRequestForm } from '@/components/bien/VisiteRequestForm'
import { ContactProprietaireButton } from '@/components/bien/ContactProprietaireButton'
import { BienMap } from '@/components/bien/BienMap'

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-CI', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' FCFA'
}

const EQUIPEMENTS_ICONS: Record<string, string> = {
  climatisation: '❄️', wifi: '📶', parking: '🅿️', gardien: '💂',
  groupe_electrogene: '⚡', piscine: '🏊', jardin: '🌿', meuble: '🛋️',
  eau_chaude: '🚿', ascenseur: '🛗', balcon: '🏡', terrasse: '☀️',
  cuisine_equipee: '👨‍🍳', lave_linge: '🫧', digicode: '🔐',
}

export default async function FicheBienPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bien } = await (supabase as any)
    .from('biens')
    .select(`
      *,
      biens_medias(id, url, type, titre, ordre, est_couverture, hotspots, embed_url, duree_sec),
      profiles!biens_proprietaire_id_fkey(full_name, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (!bien) notFound()

  const isOwner = !!(user?.id && user.id === bien.proprietaire_id)
  if (bien.statut !== 'publie' && !isOwner) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const medias = ((bien.biens_medias as any[]) ?? []).sort((a: any, b: any) => a.ordre - b.ordre)
  const proprio = bien['profiles!biens_proprietaire_id_fkey'] as { full_name: string; avatar_url: string | null } | null

  // Résidence meublée = location à la nuitée
  const isNuitee = bien.type_bien === 'residence_meublee'

  const prix = isNuitee && bien.prix_nuit_fcfa
    ? { label: formatFCFA(bien.prix_nuit_fcfa), suffix: '/nuit' }
    : bien.prix_mois_fcfa
    ? { label: formatFCFA(bien.prix_mois_fcfa), suffix: '/mois' }
    : bien.prix_vente_fcfa
    ? { label: formatFCFA(bien.prix_vente_fcfa), suffix: '' }
    : null

  const nbPhotos = medias.filter((m: any) => m.type === 'photo').length
  const nbVideos = medias.filter((m: any) => m.type === 'video').length
  const nb360    = medias.filter((m: any) => m.type === 'vue_360').length

  // Stats disponibles pour la grille
  const hasStats = !!(bien.surface_m2 || bien.nb_pieces || bien.nb_chambres || bien.nb_salles_bain || (bien.etage != null && bien.etage >= 0))

  return (
    <main className="bg-surface min-h-screen">

      {/* Bannière brouillon */}
      {isOwner && bien.statut !== 'publie' && (
        <div className="px-4 py-3 bg-warning/10 border-b border-warning/30 flex items-center gap-3">
          <span className="text-warning">⚠️</span>
          <p className="font-sans text-sm text-warning font-medium">
            Annonce en brouillon — seul vous pouvez la voir.{' '}
            <a href="/mes-biens" className="underline">Gérer mes annonces</a>
          </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <nav className="text-xs text-muted font-sans mb-4 flex items-center gap-1.5">
          <a href="/" className="hover:text-primary">Accueil</a>
          <span>/</span>
          <a href="/biens" className="hover:text-primary">Annonces</a>
          <span>/</span>
          <span className="text-[var(--text)] line-clamp-1">{bien.titre}</span>
        </nav>

        {/* Layout deux colonnes */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── Colonne gauche : médias + détails ── */}
          <div className="flex-1 min-w-0 pb-24 lg:pb-0">

            {/* Carousel médias */}
            {medias.length > 0 ? (
              <div className="mb-6">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <BienCarousel medias={medias.map((m: any) => ({
                  id: m.id, type: m.type, url: m.url,
                  embed_url: m.embed_url, titre: m.titre,
                  hotspots: m.hotspots, duree_sec: m.duree_sec,
                }))} />
                {/* Compteurs médias */}
                {(nbPhotos > 0 || nbVideos > 0 || nb360 > 0) && (
                  <div className="flex gap-3 mt-2">
                    {nbPhotos > 0 && <span className="text-xs text-muted font-sans">📷 {nbPhotos} photo{nbPhotos > 1 ? 's' : ''}</span>}
                    {nbVideos > 0 && <span className="text-xs text-muted font-sans">🎥 {nbVideos} vidéo{nbVideos > 1 ? 's' : ''}</span>}
                    {nb360 > 0   && <span className="text-xs text-muted font-sans">🌐 {nb360} vue 360°</span>}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[16/9] bg-[var(--border)] rounded-card flex items-center justify-center mb-6">
                <p className="text-muted font-sans text-sm">Aucune photo disponible</p>
              </div>
            )}

            {/* Titre + badge + localisation */}
            <div className="mb-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="default">{TYPES_BIEN_LABELS[bien.type_bien] ?? bien.type_bien}</Badge>
                {bien.statut === 'brouillon' && <Badge variant="warning">Brouillon</Badge>}
                {isNuitee && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-sans font-medium bg-amber-100 text-amber-700">
                    🌙 Location à la nuitée
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl md:text-3xl text-[var(--text)] mb-1">{bien.titre}</h1>
              <p className="text-muted font-sans flex items-center gap-1 text-sm">
                <span>📍</span>
                {bien.quartier ? `${bien.quartier}, ` : ''}{bien.commune}
                {bien.adresse_complete ? ` — ${bien.adresse_complete}` : ''}
              </p>
              {/* Prix sur mobile (caché sur desktop) */}
              {prix && (
                <p className="mt-2 font-mono text-xl text-primary font-bold lg:hidden">
                  {prix.label}<span className="text-sm font-normal text-muted">{prix.suffix}</span>
                </p>
              )}
            </div>

            {/* Stats rapides — seulement si au moins une valeur existe */}
            {hasStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {bien.surface_m2 ? (
                  <div className="bg-white rounded-card border border-[var(--border)] p-3 text-center">
                    <p className="font-mono text-lg font-semibold text-[var(--text)]">{bien.surface_m2} m²</p>
                    <p className="text-xs text-muted font-sans">Superficie</p>
                  </div>
                ) : null}
                {bien.nb_pieces ? (
                  <div className="bg-white rounded-card border border-[var(--border)] p-3 text-center">
                    <p className="font-mono text-lg font-semibold text-[var(--text)]">{bien.nb_pieces}</p>
                    <p className="text-xs text-muted font-sans">Pièces</p>
                  </div>
                ) : null}
                {bien.nb_chambres ? (
                  <div className="bg-white rounded-card border border-[var(--border)] p-3 text-center">
                    <p className="font-mono text-lg font-semibold text-[var(--text)]">{bien.nb_chambres}</p>
                    <p className="text-xs text-muted font-sans">Chambres</p>
                  </div>
                ) : null}
                {bien.nb_salles_bain ? (
                  <div className="bg-white rounded-card border border-[var(--border)] p-3 text-center">
                    <p className="font-mono text-lg font-semibold text-[var(--text)]">{bien.nb_salles_bain}</p>
                    <p className="text-xs text-muted font-sans">Salles de bain</p>
                  </div>
                ) : null}
                {bien.etage != null && bien.etage >= 0 ? (
                  <div className="bg-white rounded-card border border-[var(--border)] p-3 text-center">
                    <p className="font-mono text-lg font-semibold text-[var(--text)]">
                      {bien.etage === 0 ? 'RDC' : `Étage ${bien.etage}`}
                    </p>
                    <p className="text-xs text-muted font-sans">Niveau</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Description */}
            {bien.description && (
              <div className="bg-white rounded-card border border-[var(--border)] p-5 mb-4">
                <h2 className="font-display text-xl text-[var(--text)] mb-3">Description</h2>
                <p className="font-sans text-[var(--text)] whitespace-pre-line leading-relaxed text-sm">{bien.description}</p>
              </div>
            )}

            {/* Équipements */}
            {bien.equipements && (bien.equipements as string[]).length > 0 && (
              <div className="bg-white rounded-card border border-[var(--border)] p-5 mb-4">
                <h2 className="font-display text-xl text-[var(--text)] mb-3">Équipements & services</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(bien.equipements as string[]).map((eq: string) => (
                    <div key={eq} className="flex items-center gap-2 text-sm font-sans text-[var(--text)]">
                      <span>{EQUIPEMENTS_ICONS[eq] ?? '✓'}</span>
                      <span>{EQUIPEMENTS_LABELS[eq] ?? eq}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Localisation + carte */}
            <div className="bg-white rounded-card border border-[var(--border)] p-5 mb-4">
              <h2 className="font-display text-xl text-[var(--text)] mb-1">Localisation</h2>
              <p className="text-sm text-muted font-sans mb-3">
                📍 {bien.quartier ? `${bien.quartier}, ` : ''}{bien.commune}
                {bien.adresse_complete ? ` — ${bien.adresse_complete}` : ''}
              </p>
              <BienMap
                latitude={bien.latitude as number | null}
                longitude={bien.longitude as number | null}
                titre={bien.titre}
                commune={bien.commune}
              />
            </div>

            {/* Propriétaire */}
            {proprio && (
              <div className="bg-white rounded-card border border-[var(--border)] p-4 mb-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-lg flex-shrink-0">
                  {proprio.avatar_url ? (
                    <Image
                      src={proprio.avatar_url}
                      alt={proprio.full_name ?? 'Propriétaire'}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    proprio.full_name?.charAt(0) ?? 'P'
                  )}
                </div>
                <div>
                  <p className="font-sans text-sm font-semibold text-[var(--text)]">{proprio.full_name}</p>
                  <p className="font-sans text-xs text-muted">Propriétaire · Membre Immo CI</p>
                </div>
              </div>
            )}


            {/* Actions mobile — propriétaire */}
            {isOwner && (
              <div className="lg:hidden space-y-3 pb-6">
                <div className="bg-primary/5 rounded-card border border-primary/20 p-4">
                  <p className="font-sans text-sm font-semibold text-primary mb-3">🏠 Votre annonce</p>
                  <div className="flex flex-col gap-2">
                    <a href={`/mes-biens/${bien.id}/modifier`}
                      className="text-center py-2.5 px-4 rounded-btn border border-[var(--border)] font-sans text-sm text-[var(--text)] hover:border-primary/40 bg-white transition-colors">
                      ✏️ Modifier l&apos;annonce
                    </a>
                    <a href={`/mes-biens/${bien.id}/modifier?step=medias`}
                      className="text-center py-2.5 px-4 rounded-btn border border-[var(--border)] font-sans text-sm text-[var(--text)] hover:border-primary/40 bg-white transition-colors">
                      📷 Gérer les médias
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Colonne droite : panneau sticky (desktop) ── */}
          <div className="hidden lg:block w-96 flex-shrink-0">
            <div className="sticky top-6 space-y-4">

              {/* Prix */}
              {prix && (
                <div className="bg-white rounded-card border border-[var(--border)] p-5">
                  <p className="font-mono text-3xl text-primary font-bold">
                    {prix.label}
                    <span className="text-base font-normal text-muted">{prix.suffix}</span>
                  </p>
                  {bien.charges_mois_fcfa ? (
                    <p className="text-xs text-muted font-sans mt-1">
                      + {formatFCFA(bien.charges_mois_fcfa)} de charges{isNuitee ? '/nuit' : '/mois'}
                    </p>
                  ) : null}
                  {!isNuitee && bien.depot_garantie_fcfa ? (
                    <p className="text-xs text-muted font-sans">
                      Dépôt de garantie : {formatFCFA(bien.depot_garantie_fcfa)}
                    </p>
                  ) : null}
                </div>
              )}

              {isOwner ? (
                /* Panneau propriétaire */
                <div className="bg-primary/5 rounded-card border border-primary/20 p-5">
                  <p className="font-sans text-sm font-semibold text-primary mb-4">🏠 Votre annonce</p>
                  <div className="flex flex-col gap-3">
                    <a href={`/mes-biens/${bien.id}/modifier`}
                      className="text-center py-3 px-4 rounded-btn border border-[var(--border)] font-sans text-sm text-[var(--text)] hover:border-primary/40 bg-white transition-colors">
                      ✏️ Modifier l&apos;annonce
                    </a>
                    <a href={`/mes-biens/${bien.id}/modifier?step=medias`}
                      className="text-center py-3 px-4 rounded-btn border border-[var(--border)] font-sans text-sm text-[var(--text)] hover:border-primary/40 bg-white transition-colors">
                      📷 Gérer les médias
                    </a>
                    <a href="/mes-biens"
                      className="text-center py-3 px-4 rounded-btn bg-primary text-white font-sans text-sm font-medium hover:bg-primary/90 transition-colors">
                      ← Mes annonces
                    </a>
                  </div>
                </div>
              ) : (
                /* Panneau visiteur / locataire */
                <>
                  {/* Favoris */}
                  <div className="bg-white rounded-card border border-[var(--border)] p-4 flex items-center justify-between">
                    <span className="font-sans text-sm text-[var(--text)]">Sauvegarder ce bien</span>
                    <FavorisButton bienId={bien.id} userId={user?.id ?? null} />
                  </div>

                  {/* Contact propriétaire */}
                  <ContactProprietaireButton
                    bienId={bien.id}
                    proprietaireId={bien.proprietaire_id as string}
                    userId={user?.id ?? null}
                  />

                  {/* CTA principal */}
                  {isNuitee ? (
                    <a
                      href={`/reservations/nouvelle?bienId=${bien.id}`}
                      className="block w-full text-center py-4 px-6 rounded-btn bg-primary text-white font-sans font-semibold text-base hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      📅 Réserver maintenant
                    </a>
                  ) : (
                    <VisiteRequestForm bienId={bien.id} proprietaireId={bien.proprietaire_id as string} />
                  )}

                  {/* Aide */}
                  <p className="text-xs text-center text-muted font-sans px-2">
                    Aucun frais avant confirmation · Annulation gratuite
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barre CTA fixe — mobile uniquement — visiteurs */}
      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-[var(--border)] px-4 py-3 flex items-center gap-3 shadow-lg">
          {prix && (
            <div className="flex-shrink-0">
              <p className="font-mono text-lg text-primary font-bold leading-tight">
                {prix.label}
                <span className="text-xs font-normal text-muted">{prix.suffix}</span>
              </p>
            </div>
          )}
          <div className="flex-1 flex gap-2">
            {isNuitee ? (
              <a
                href={`/reservations/nouvelle?bienId=${bien.id}`}
                className="flex-1 text-center py-3 px-4 rounded-btn bg-primary text-white font-sans font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                📅 Réserver
              </a>
            ) : (
              <a
                href={`#contact`}
                className="flex-1 text-center py-3 px-4 rounded-btn bg-primary text-white font-sans font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                📩 Demander une visite
              </a>
            )}
            <FavorisButton bienId={bien.id} userId={user?.id ?? null} />
          </div>
        </div>
      )}
    </main>
  )
}

// Composant mobile actions pour visiteurs
function MobileActions({
  bien, userId, isNuitee, prix,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bien: any
  userId: string | null
  isNuitee: boolean
  prix: { label: string; suffix: string } | null
}) {
  return (
    <>
      {prix && (
        <div className="bg-white rounded-card border border-[var(--border)] p-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-xl text-primary font-bold">
              {prix.label}<span className="text-sm font-normal text-muted">{prix.suffix}</span>
            </p>
            {bien.charges_mois_fcfa && (
              <p className="text-xs text-muted font-sans">+ {new Intl.NumberFormat('fr-CI').format(bien.charges_mois_fcfa)} FCFA charges</p>
            )}
          </div>
          <FavorisButton bienId={bien.id} userId={userId} />
        </div>
      )}

      <ContactProprietaireButton
        bienId={bien.id}
        proprietaireId={bien.proprietaire_id}
        userId={userId}
      />

      {isNuitee ? (
        <a
          href={`/reservations/nouvelle?bienId=${bien.id}`}
          className="block w-full text-center py-4 px-6 rounded-btn bg-primary text-white font-sans font-semibold text-base hover:bg-primary/90 transition-colors"
        >
          📅 Réserver maintenant
        </a>
      ) : (
        <VisiteRequestForm bienId={bien.id} proprietaireId={bien.proprietaire_id} />
      )}
    </>
  )
}
