import Link from 'next/link'
import Image from 'next/image'
import { Radio, ArrowUpRight, MapPin } from 'lucide-react'
import { createLocauxClient } from '@/lib/supabase/locaux'
import { mapLocauxRow, type LocauxRow, type BienExterne } from '@/lib/locaux/mapper'
import { formatFCFA } from '@/lib/format'
import { getDictionary, getLocale } from '@/lib/i18n/server'

function priceLine(b: BienExterne, onRequest: string): string {
  if (b.prix_value == null) return b.prix_label || onRequest
  const f = formatFCFA(b.prix_value)
  if (b.prix_unit === 'fcfa_par_m2') return `${f} /m²`
  if (b.prix_unit === 'fcfa_par_mois') return `${f} /mois`
  return f
}

function timeBadge(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const fr = locale === 'fr'
  if (h < 1) return fr ? "à l'instant" : 'just now'
  if (h < 24) return fr ? `il y a ${h}h` : `${h}h ago`
  const d = Math.floor(h / 24)
  return fr ? `il y a ${d}j` : `${d}d ago`
}

export async function FlashOffersSection() {
  const t = await getDictionary()
  const locale = await getLocale()
  const c = createLocauxClient()
  const { data: rows } = await c
    .from('locaux')
    // SECURITY: telephone, telephone_bien, publie_par, groupe_whatsapp_origine
    // omis — données identifiantes propriétaire/source.
    .select('id,ref_bien,type_de_bien,type_offre,zone_geographique,commune,quartier,prix,prix_normalise,caracteristiques,meubles,chambre,disponible,surface,date_publication,lien_image,message_initial,status,is_duplicate,date_expiration,created_at')
    // ⚠️ Politique permissive alignée sur le catalogue (consolidated.ts) : NULL = accepté.
    // .eq('status','active') / .eq('is_duplicate',false) excluait à tort tous les NULL.
    // (lien_image requis car cette vitrine landing affiche des cartes avec photo.)
    .not('status', 'eq', 'inactive')
    .not('is_duplicate', 'is', true)
    .neq('lien_image', '')
    .not('lien_image', 'is', null)
    .order('date_publication', { ascending: false, nullsFirst: false })
    .limit(12)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const biens = ((rows ?? []) as any as LocauxRow[]).map(mapLocauxRow).filter((b) => b.is_actif).slice(0, 6)
  if (biens.length === 0) return null

  return (
    <section className="relative py-16 md:py-24 bg-[var(--background)] overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex items-end justify-between gap-6 mb-10 md:mb-12 flex-wrap">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-[var(--accent-luxury)] opacity-75" />
                <span className="relative rounded-full w-2 h-2 bg-[var(--accent-luxury)]" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[var(--accent-luxury)]">
                {t.flash.kicker}
              </p>
            </div>
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-[var(--text)] leading-[1.05] tracking-tight">
              {t.flash.headline}<br />
              <span className="italic font-light text-[var(--accent-luxury)]">{t.flash.headlineAccent}</span>
            </h2>
            <p className="text-[var(--text-muted)] text-sm md:text-base mt-5 max-w-xl leading-relaxed">
              {t.flash.subtitle}
            </p>
          </div>
          <Link
            href="/offre-flash"
            className="hidden md:inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.25em] uppercase text-[var(--accent-luxury)] border-b border-accent-luxury/40 pb-1 hover:border-[var(--accent-luxury)] transition-colors"
          >
            {t.flash.viewAll} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-5">
          {biens.map((b, i) => (
            <Link
              key={b.id}
              href={`/offre-flash/${b.id}`}
              className={`group relative rounded-2xl md:rounded-3xl overflow-hidden border border-[var(--border)] hover:border-accent-luxury/40 transition-all duration-500 bg-[var(--surface-card)] ${
                i === 0 ? 'col-span-2 md:col-span-2 row-span-2 aspect-[16/13] md:aspect-auto' : 'aspect-[4/5]'
              }`}
            >
              <div className="relative h-full">
                {b.image_url && (
                  <Image
                    src={b.image_url}
                    alt={b.titre}
                    fill
                    sizes={i === 0 ? '(max-width: 768px) 100vw, 60vw' : '(max-width: 768px) 50vw, 30vw'}
                    className="object-cover group-hover:scale-105 transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    unoptimized
                  />
                )}

                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Live badge */}
                {b.is_recent && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--accent-luxury)] text-white text-[9px] font-bold uppercase tracking-[0.2em] rounded-full">
                    <Radio className="w-2.5 h-2.5" />
                    {t.common.new}
                  </span>
                )}
                <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/95 backdrop-blur text-[var(--text)] text-[9px] font-bold uppercase tracking-wide rounded-full">
                  {b.type_offre === 'location' ? t.footer.rentals : b.type_offre === 'vente' ? t.footer.sales : '—'}
                </span>

                {/* Body */}
                <div className={`absolute inset-x-0 bottom-0 p-4 md:p-${i === 0 ? '6' : '5'}`}>
                  <p className="text-[10px] font-medium text-white/60 uppercase tracking-wider mb-1">
                    {timeBadge(b.date_publication, locale)}
                  </p>
                  <p className={`font-display font-bold text-[var(--accent-luxury)] mb-1 ${i === 0 ? 'text-2xl md:text-3xl' : 'text-base md:text-lg'}`}>
                    {priceLine(b, t.common.onRequest)}
                  </p>
                  <h3 className={`font-bold text-white capitalize line-clamp-1 mb-1.5 ${i === 0 ? 'text-lg md:text-xl' : 'text-sm'}`}>
                    {b.type_bien} · {b.commune}
                  </h3>
                  <p className="flex items-center gap-1 text-xs text-white/50 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {b.quartier || b.commune}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="md:hidden mt-6 text-center">
          <Link
            href="/offre-flash"
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.25em] uppercase text-[var(--accent-luxury)] border-b border-accent-luxury/40 pb-1"
          >
            {t.flash.viewAll} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
