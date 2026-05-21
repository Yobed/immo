import Link from 'next/link'
import Image from 'next/image'
import { Flame, MapPin, BedDouble, Maximize, ArrowUpRight, AlertCircle, Radio, Clock } from 'lucide-react'
import { createLocauxClient } from '@/lib/supabase/locaux'
import { mapLocauxRow, type LocauxRow, type BienExterne } from '@/lib/locaux/mapper'
import { formatFCFA } from '@/lib/format'

function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso).getTime()
  if (isNaN(d)) return ''
  const diff = Date.now() - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

interface FlashOffersInlineProps {
  filters: {
    q?: string
    commune?: string
    type_bien?: string
    prix_min?: string
    prix_max?: string
  }
  /** Nombre max de cartes affichées */
  limit?: number
}

function priceLine(b: BienExterne): string {
  if (b.prix_value == null) return b.prix_label || 'Prix sur demande'
  const f = formatFCFA(b.prix_value)
  if (b.prix_unit === 'fcfa_par_m2') return `${f} /m²`
  if (b.prix_unit === 'fcfa_par_mois') return `${f} /mois`
  return f
}

/**
 * Section "Offres flash WhatsApp correspondantes" — injectée dans /recherche
 * sous la grille principale, pour vraiment unifier les sources.
 *
 * Filtre sur les mêmes critères que la recherche principale.
 * Server component — fait son propre fetch.
 */
export async function FlashOffersInline({ filters, limit = 6 }: FlashOffersInlineProps) {
  const sb = createLocauxClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (sb as any)
    .from('locaux')
    // SECURITY: telephone, telephone_bien, publie_par, groupe_whatsapp_origine omis
    .select('id,ref_bien,type_de_bien,type_offre,zone_geographique,commune,quartier,prix,prix_normalise,caracteristiques,meubles,chambre,disponible,surface,date_publication,lien_image,message_initial,status,is_duplicate,date_expiration,created_at')
    .eq('status', 'active')
    .eq('is_duplicate', false)
    .order('date_publication', { ascending: false, nullsFirst: false })
    .limit(limit * 2) // marge pour filtrer is_actif après mapping

  if (filters.commune) q = q.ilike('commune', `%${filters.commune}%`)
  if (filters.type_bien) q = q.ilike('type_de_bien', `%${filters.type_bien}%`)
  if (filters.q?.trim()) {
    const term = filters.q.trim()
    q = q.or(`caracteristiques.ilike.%${term}%,message_initial.ilike.%${term}%,quartier.ilike.%${term}%`)
  }
  const prixMin = filters.prix_min ? parseInt(filters.prix_min, 10) : NaN
  const prixMax = filters.prix_max ? parseInt(filters.prix_max, 10) : NaN
  if (!isNaN(prixMin)) q = q.gte('prix_normalise', prixMin)
  if (!isNaN(prixMax)) q = q.lte('prix_normalise', prixMax)

  const { data: rows } = await q
  if (!rows || rows.length === 0) return null

  const biens = (rows as LocauxRow[])
    .map(mapLocauxRow)
    .filter((b) => b.is_actif)
    .slice(0, limit)

  if (biens.length === 0) return null

  return (
    <section className="mt-16 pt-12 border-t border-[var(--border)]">
      <header className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-orange-400" />
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-orange-400">
              Aussi disponible
            </p>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)] tracking-tight">
            Offres flash correspondantes
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-2 max-w-xl">
            Opportunités captées sur le marché ivoirien, à valider avec notre conseiller —
            elles partent vite.
          </p>
        </div>
        <Link
          href="/offre-flash"
          className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--accent-luxury)] border-b border-[var(--accent-luxury)]/40 pb-0.5 hover:border-[var(--accent-luxury)] transition-colors"
        >
          Voir tout <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.03] p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Ces offres ne sont <strong className="text-[var(--text)]">pas encore vérifiées</strong> par notre équipe.
          Notre conseiller les valide avec toi avant tout engagement (visite, paiement, signature).
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-5">
        {biens.map((b) => (
          <Link
            key={b.id}
            href={`/offre-flash/${b.id}`}
            className="group relative rounded-2xl overflow-hidden border border-[var(--border)] hover:border-orange-400/60 transition-all duration-300 bg-[var(--surface-card)]"
          >
            <div className="relative aspect-[4/5]">
              {b.image_url ? (
                <Image
                  src={b.image_url}
                  alt={b.titre}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--midnight-muted)]">
                  <Flame className="w-8 h-8 text-orange-400/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/90 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider">
                <Flame className="w-2.5 h-2.5" />
                Offre flash
              </span>
              {b.date_scraping && (
                <span
                  className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-[9px] font-medium tracking-wide"
                  title="Mise à jour récente"
                >
                  <Radio className="w-2.5 h-2.5 text-emerald-400" />
                  {relativeTime(b.date_scraping)}
                </span>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <p className="text-[10px] uppercase tracking-widest text-white/70 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {b.commune}
                  {b.quartier && ` · ${b.quartier}`}
                </p>
                <h3 className="font-bold text-sm leading-tight line-clamp-2 mb-2">
                  {b.titre}
                </h3>
                <p className="text-[var(--accent-luxury)] font-bold text-sm">
                  {priceLine(b)}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-white/70 mt-2">
                  {b.nb_chambres && (
                    <span className="inline-flex items-center gap-1">
                      <BedDouble className="w-3 h-3" />
                      {b.nb_chambres}
                    </span>
                  )}
                  {b.surface_m2 && (
                    <span className="inline-flex items-center gap-1">
                      <Maximize className="w-3 h-3" />
                      {b.surface_m2} m²
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 ml-auto text-white/50">
                    <Clock className="w-3 h-3" />
                    Publié {relativeTime(b.date_publication)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/offre-flash"
        className="md:hidden mt-6 flex items-center justify-center gap-2 py-3 rounded-xl border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider"
      >
        Voir toutes les offres flash <ArrowUpRight className="w-3.5 h-3.5" />
      </Link>
    </section>
  )
}
