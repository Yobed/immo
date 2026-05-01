import Link from 'next/link'
import Image from 'next/image'
import { Flame, MapPin, BedDouble, Maximize, Phone, ChevronLeft, ChevronRight, Search, Sparkles } from 'lucide-react'
import { createLocauxClient } from '@/lib/supabase/locaux'
import { mapLocauxRow, type LocauxRow, type BienExterne } from '@/lib/locaux/mapper'
import { formatFCFA } from '@/lib/format'

export const revalidate = 60
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 24

interface SearchParams {
  type?: string
  offre?: string
  commune?: string
  q?: string
  page?: string
  meuble?: string
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

function priceDisplay(b: BienExterne): string {
  if (b.prix_value == null) return b.prix_label || 'Prix sur demande'
  const formatted = formatFCFA(b.prix_value)
  if (b.prix_unit === 'fcfa_par_m2') return `${formatted} /m²`
  if (b.prix_unit === 'fcfa_par_mois') return `${formatted} /mois`
  return formatted
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (isNaN(diff)) return ''
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

const TYPE_OPTIONS = [
  { value: '', label: 'Tous types' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'studio', label: 'Studio' },
  { value: 'villa', label: 'Villa' },
  { value: 'maison', label: 'Maison' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'commerce', label: 'Commerce' },
]

const OFFRE_OPTIONS = [
  { value: '', label: 'Vente + Location' },
  { value: 'vente', label: 'À vendre' },
  { value: 'location', label: 'À louer' },
]

export default async function OffreFlashPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const type = sp.type ?? ''
  const offre = sp.offre ?? ''
  const commune = sp.commune ?? ''
  const q = sp.q?.trim() ?? ''
  const meubleOnly = sp.meuble === '1'
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)

  const locaux = createLocauxClient()

  let query = locaux
    .from('locaux')
    .select(
      'id,ref_bien,type_de_bien,type_offre,zone_geographique,commune,quartier,prix,prix_normalise,telephone,telephone_bien,caracteristiques,publie_par,meubles,chambre,disponible,surface,groupe_whatsapp_origine,date_publication,lien_image,message_initial,status,is_duplicate,date_expiration,created_at',
      { count: 'exact' }
    )
    .eq('status', 'active')
    .eq('is_duplicate', false)
    .order('date_publication', { ascending: false, nullsFirst: false })

  if (type) query = query.ilike('type_de_bien', `%${type}%`)
  if (offre) query = query.ilike('type_offre', `${offre}%`)
  if (commune) query = query.ilike('commune', `%${commune}%`)
  if (meubleOnly) query = query.eq('meubles', 'Oui')
  if (q) query = query.or(`message_initial.ilike.%${q}%,caracteristiques.ilike.%${q}%,quartier.ilike.%${q}%,commune.ilike.%${q}%`)

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  query = query.range(from, to)

  const { data: rows, count } = await query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const biens = ((rows ?? []) as any as LocauxRow[]).map(mapLocauxRow)
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const buildLink = (overrides: Partial<SearchParams>) => {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (offre) params.set('offre', offre)
    if (commune) params.set('commune', commune)
    if (q) params.set('q', q)
    if (meubleOnly) params.set('meuble', '1')
    Object.entries(overrides).forEach(([k, v]) => {
      if (v == null || v === '') params.delete(k)
      else params.set(k, String(v))
    })
    const s = params.toString()
    return `/offre-flash${s ? `?${s}` : ''}`
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="flex items-center gap-3 mb-3">
            <Flame className="w-7 h-7" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-90">Offres Flash</span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-3 leading-tight">
            Annonces fraîches du terrain
          </h1>
          <p className="text-white/85 text-sm md:text-base max-w-2xl">
            Annonces fraîches de notre réseau d&apos;agents et propriétaires de Côte d&apos;Ivoire.{' '}
            {total.toLocaleString('fr-FR')} offres actives.
          </p>
        </div>
      </section>

      {/* Filtres */}
      <form className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3 flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Rechercher (commune, mot-clé...)"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
            />
          </div>
          <select name="type" defaultValue={type} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium">
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select name="offre" defaultValue={offre} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium">
            {OFFRE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="text"
            name="commune"
            defaultValue={commune}
            placeholder="Commune"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-[140px]"
          />
          <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-100">
            <input type="checkbox" name="meuble" value="1" defaultChecked={meubleOnly} className="w-3.5 h-3.5" />
            Meublé
          </label>
          <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700">
            Filtrer
          </button>
          {(type || offre || commune || q || meubleOnly) && (
            <Link href="/offre-flash" className="px-3 py-2 text-slate-500 hover:text-slate-900 text-sm font-medium">
              Reset
            </Link>
          )}
        </div>
      </form>

      {/* Liste */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <p className="text-slate-400 text-xs mb-4">
          {total.toLocaleString('fr-FR')} résultat{total > 1 ? 's' : ''} · Page {page} / {totalPages}
        </p>

        {biens.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Aucune annonce ne correspond à ces critères.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {biens.map(bien => (
              <Link
                key={bien.id}
                href={`/offre-flash/${bien.id}`}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
              >
                {/* Image / placeholder */}
                <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                  {bien.image_url ? (
                    <Image
                      src={bien.image_url}
                      alt={bien.titre}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Flame className="w-12 h-12" />
                    </div>
                  )}
                  {bien.is_recent && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md">
                      <Flame className="w-3 h-3" />
                      Nouveau
                    </span>
                  )}
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 backdrop-blur text-slate-700 text-[10px] font-bold uppercase tracking-wide rounded-full border border-slate-200">
                    {bien.type_offre === 'location' ? 'Location' : bien.type_offre === 'vente' ? 'Vente' : 'Offre'}
                  </span>
                </div>

                <div className="p-3 flex flex-col flex-1">
                  <p className="text-orange-600 font-display font-bold text-base leading-tight mb-1.5 line-clamp-1">
                    {priceDisplay(bien)}
                  </p>
                  <h3 className="font-bold text-slate-900 text-[13px] leading-snug mb-1.5 line-clamp-2 capitalize">
                    {bien.type_bien} · {bien.commune}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{[bien.quartier, bien.commune].filter(Boolean).join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-2">
                    {bien.nb_chambres != null && bien.nb_chambres > 0 && (
                      <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{bien.nb_chambres} ch.</span>
                    )}
                    {bien.surface_m2 && (
                      <span className="flex items-center gap-1"><Maximize className="w-3 h-3" />{bien.surface_m2.toLocaleString('fr-FR')} m²</span>
                    )}
                    {bien.meuble && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-bold text-[9px]">MEUBLÉ</span>
                    )}
                  </div>
                  <p className="mt-auto text-[10px] text-slate-400 font-medium">
                    {relativeTime(bien.date_publication)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {page > 1 && (
              <Link href={buildLink({ page: String(page - 1) })} className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
                <ChevronLeft className="w-4 h-4" /> Précédent
              </Link>
            )}
            <span className="px-4 py-2 text-sm text-slate-600 font-medium">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link href={buildLink({ page: String(page + 1) })} className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
                Suivant <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-10 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
          <Phone className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            Les annonces affichées proviennent de notre réseau de groupes WhatsApp d&apos;agents et propriétaires. Vérifiez toujours l&apos;authenticité de l&apos;offre avant tout paiement. Immo CI ne valide pas individuellement chaque annonce flash.
          </p>
        </div>
      </div>
    </main>
  )
}
