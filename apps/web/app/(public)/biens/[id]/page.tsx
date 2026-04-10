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

// Equipements icons — using checkmark for all; displayed alongside the label
const EQUIPEMENTS_ICONS: Record<string, React.ReactNode> = {
  climatisation: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v12M9 12l3-3 3 3M12 3v2M4.22 10.22l1.42 1.42M1 18h2M21 18h2M19.78 10.22l-1.42 1.42M12 3a7 7 0 0 0 0 14"/></svg>,
  wifi: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  parking: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>,
  gardien: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  groupe_electrogene: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  piscine: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20M2 12c2 0 2 3 4 3s2-3 4-3 2 3 4 3 2-3 4-3"/><path d="M4 7l4-4 4 4 4-4 4 4"/></svg>,
  jardin: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12M12 12C12 12 7 9 7 5a5 5 0 0 1 10 0c0 4-5 7-5 7z"/></svg>,
  meuble: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2m16 0a2 2 0 0 1 2 2v5H2v-5a2 2 0 0 1 2-2m16 0H4"/><path d="M4 16v3m16-3v3"/></svg>,
  eau_chaude: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/><circle cx="12" cy="12" r="5"/></svg>,
  ascenseur: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 9l3-3 3 3M9 15l3 3 3-3"/></svg>,
  balcon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><rect x="8" y="15" width="8" height="6"/></svg>,
  terrasse: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 12l9-9 9 9M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"/></svg>,
  cuisine_equipee: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6h5zm0 0v7"/></svg>,
  lave_linge: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M7 7h.01M12 7h.01"/></svg>,
  digicode: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning flex-shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
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
                    {nbPhotos > 0 && <span className="text-xs text-muted font-sans flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> {nbPhotos} photo{nbPhotos > 1 ? 's' : ''}</span>}
                    {nbVideos > 0 && <span className="text-xs text-muted font-sans flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> {nbVideos} vidéo{nbVideos > 1 ? 's' : ''}</span>}
                    {nb360 > 0   && <span className="text-xs text-muted font-sans flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> {nb360} vue 360°</span>}
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
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    Location à la nuitée
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl md:text-3xl text-[var(--text)] mb-1">{bien.titre}</h1>
              <p className="text-muted font-sans flex items-center gap-1 text-sm">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
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
                      <span className="text-primary/60 flex-shrink-0">
                        {EQUIPEMENTS_ICONS[eq] ?? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </span>
                      <span>{EQUIPEMENTS_LABELS[eq] ?? eq}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Localisation + carte */}
            <div className="bg-white rounded-card border border-[var(--border)] p-5 mb-4">
              <h2 className="font-display text-xl text-[var(--text)] mb-1">Localisation</h2>
              <p className="text-sm text-muted font-sans mb-3 flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                {bien.quartier ? `${bien.quartier}, ` : ''}{bien.commune}
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
                  <p className="font-sans text-sm font-semibold text-primary mb-3">Votre annonce</p>
                  <div className="flex flex-col gap-2">
                    <a href={`/mes-biens/${bien.id}/modifier`}
                      className="text-center py-2.5 px-4 rounded-btn border border-[var(--border)] font-sans text-sm text-[var(--text)] hover:border-primary/40 bg-white transition-colors">
                      Modifier l&apos;annonce
                    </a>
                    <a href={`/mes-biens/${bien.id}/modifier?step=medias`}
                      className="text-center py-2.5 px-4 rounded-btn border border-[var(--border)] font-sans text-sm text-[var(--text)] hover:border-primary/40 bg-white transition-colors">
                      Gérer les médias
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
                  <p className="font-sans text-sm font-semibold text-primary mb-4">Votre annonce</p>
                  <div className="flex flex-col gap-3">
                    <a href={`/mes-biens/${bien.id}/modifier`}
                      className="text-center py-3 px-4 rounded-btn border border-[var(--border)] font-sans text-sm text-[var(--text)] hover:border-primary/40 bg-white transition-colors">
                      Modifier l&apos;annonce
                    </a>
                    <a href={`/mes-biens/${bien.id}/modifier?step=medias`}
                      className="text-center py-3 px-4 rounded-btn border border-[var(--border)] font-sans text-sm text-[var(--text)] hover:border-primary/40 bg-white transition-colors">
                      Gérer les médias
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
                      Réserver maintenant
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
                Réserver
              </a>
            ) : (
              <a
                href={`#contact`}
                className="flex-1 text-center py-3 px-4 rounded-btn bg-primary text-white font-sans font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Demander une visite
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
          Réserver maintenant
        </a>
      ) : (
        <VisiteRequestForm bienId={bien.id} proprietaireId={bien.proprietaire_id} />
      )}
    </>
  )
}
