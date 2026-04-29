import Link from 'next/link'
import Image from 'next/image'
import { Flame, ArrowRight, AlertTriangle, MapPin, Tag } from 'lucide-react'
import { createLocauxClient } from '@/lib/supabase/locaux'
import { mapLocauxRow, type LocauxRow, type BienExterne } from '@/lib/locaux/mapper'
import { formatFCFA } from '@/lib/format'

function priceLine(b: BienExterne): string {
  if (b.prix_value == null) return b.prix_label || 'Sur demande'
  const f = formatFCFA(b.prix_value)
  if (b.prix_unit === 'fcfa_par_m2') return `${f} /m²`
  if (b.prix_unit === 'fcfa_par_mois') return `${f} /mois`
  return f
}

function timeBadge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "à l'instant"
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  return `il y a ${d}j`
}

export async function FlashOffersSection() {
  const c = createLocauxClient()
  const { data: rows } = await c
    .from('locaux')
    .select('id,ref_bien,type_de_bien,type_offre,zone_geographique,commune,quartier,prix,prix_normalise,telephone,telephone_bien,caracteristiques,publie_par,meubles,chambre,disponible,surface,groupe_whatsapp_origine,date_publication,lien_image,message_initial,status,is_duplicate,date_expiration,created_at')
    .eq('status', 'active')
    .eq('is_duplicate', false)
    .neq('lien_image', '')
    .not('lien_image', 'is', null)
    .order('date_publication', { ascending: false, nullsFirst: false })
    .limit(8)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const biens = ((rows ?? []) as any as LocauxRow[]).map(mapLocauxRow)

  if (biens.length === 0) return null

  return (
    <section className="relative py-10 md:py-16 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 overflow-hidden">
      {/* Background flames pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-red-500 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-orange-500 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto px-4 md:px-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full mb-2">
              <Flame className="w-3 h-3" />
              En direct
            </div>
            <h2 className="font-display text-2xl md:text-4xl font-bold text-slate-900 leading-tight tracking-tight">
              Offres flash WhatsApp
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-xl">
              Annonces fraîches scrappées en temps réel des groupes WhatsApp d&apos;agents et propriétaires.
            </p>
          </div>
          <Link
            href="/offre-flash"
            className="shrink-0 flex items-center gap-1 text-[11px] font-bold tracking-[0.2em] uppercase text-red-600 border-b border-red-600/40 pb-0.5 hover:border-red-600 transition-colors"
          >
            Toutes les offres flash <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Disclaimer */}
        <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <p>
            Ces annonces ne sont <strong>pas vérifiées</strong> par Immo CI. Vérifiez l&apos;identité du vendeur avant toute transaction.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {biens.map((b) => (
            <Link
              key={b.id}
              href={`/offre-flash/${b.id}`}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="aspect-[4/3] relative bg-slate-100 overflow-hidden">
                {b.image_url && (
                  <Image
                    src={b.image_url}
                    alt={b.titre}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                )}
                {b.is_recent && (
                  <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-full shadow-md">
                    <Flame className="w-2.5 h-2.5" />
                    Nouveau
                  </span>
                )}
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 backdrop-blur text-slate-700 text-[9px] font-bold uppercase rounded-full">
                  {b.type_offre === 'location' ? 'Location' : b.type_offre === 'vente' ? 'Vente' : 'Offre'}
                </span>
              </div>
              <div className="p-3">
                <p className="text-orange-600 font-display font-bold text-sm leading-tight mb-1 line-clamp-1">
                  {priceLine(b)}
                </p>
                <p className="text-[11px] font-semibold text-slate-900 capitalize line-clamp-1 mb-1">
                  {b.type_bien} · {b.commune}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {b.quartier || b.commune}
                  </span>
                  <span className="shrink-0 ml-2">{timeBadge(b.date_publication)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
