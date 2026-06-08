/**
 * Catalogue consolidé — fusionne les biens BOGBE'S (vérifiés) et les offres flash WhatsApp
 * (scrapées) en une seule liste unifiée pour la recherche, le tri et l'affichage.
 *
 * Architecture : les 2 sources vivent dans 2 projets Supabase séparés. On les
 * interroge en parallèle puis on merge en mémoire avec tri unifié.
 */
// Note : pas d'import 'server-only' (package non installé sur Vercel) — la
// protection est implicite via les appels Supabase server-side dans createClient().
import { createClient } from '@/lib/supabase/server'
import { createLocauxClient } from '@/lib/supabase/locaux'
import { mapLocauxRow, type LocauxRow } from '@/lib/locaux/mapper'
import { formatFCFA } from '@/lib/format'
import { STATUTS_PUBLICS } from './statuts'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bogbes-groupe.vercel.app'

export interface ConsolidatedBien {
  /** ID unique inter-sources, préfixé : "bogbes:UUID" ou "flash:1234" */
  id: string
  /** Source d'origine */
  source: 'bogbes' | 'flash'
  /** ID brut de la source (UUID pour bogbes, number pour flash) */
  sourceId: string
  titre: string
  commune: string
  quartier: string | null
  type_bien: string
  prix_label: string
  prix_value: number | null
  prix_period: 'mois' | 'nuit' | 'vente' | 'unknown'
  surface_m2: number | null
  nb_pieces: number | null
  description: string | null
  photo_url: string | null
  is_verifie: boolean
  /** Bien enregistré mais pas encore validé par l'admin (statut 'en_attente').
   *  Toujours false pour les offres flash. Sert au badge « En validation » + au tri. */
  is_pending: boolean
  /** URL de la fiche détail */
  url: string
  /** ISO date de publication */
  date_publication: string
  /** ISO date à laquelle notre plateforme a ingéré le bien (scraping pour flash, création pour bogbes) */
  date_scraping: string | null
  /** Bien publié dans les dernières 24h */
  is_recent: boolean
  /** Photos additionnelles (jusqu'à 5) — utilisées par Sapphire pour envoyer des médias */
  photos: string[]
  /** Vidéos additionnelles (jusqu'à 2) */
  videos: string[]
  /** Équipements normalisés (uniquement côté biens BOGBE'S, vide pour flash) */
  equipements: string[]
  /** Score qualité IA 0-100 (uniquement biens BOGBE'S, null sinon) */
  score_ia: number | null
  /** CTA conduisant à la réservation/contact (page bien #reserver, ou wa.me conseiller pour flash) */
  cta_url: string
}

export interface ConsolidatedFilters {
  commune?: string
  type_bien?: string
  /** Type d'offre — 'location' (loyer mois/nuit) ou 'vente'. Filtre serveur. */
  type_offre?: 'location' | 'vente'
  prix_min?: number
  prix_max?: number
  /** Mots-clés full-text (recherche dans biens.fts / locaux.message_initial+caracteristiques) */
  q?: string
  /** Équipements normalisés (filtre côté biens BOGBE'S uniquement — locaux n'a pas ce champ structuré) */
  equipements?: string[]
  /** Filtre par source ; null = toutes */
  source?: 'bogbes' | 'flash' | null
  /** ASC/DESC sur prix, recent, etc. */
  sort?: 'recent' | 'price_asc' | 'price_desc' | 'verified_first'
  /** Limite max par source (à fusionner après) */
  limitPerSource?: number
}

const DEFAULT_LIMIT = 30

// ─── BOGBE'S ────────────────────────────────────────────────────────────────

async function fetchBogbes(filters: ConsolidatedFilters): Promise<ConsolidatedBien[]> {
  if (filters.source === 'flash') return []
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // biens_medias capped at 6 rows/bien — we only need cover + a few extras for cards.
  // Left join (no !inner) so biens without medias still appear with a placeholder.
  let q = (supabase as any)
    .from('biens')
    .select(
      `id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa,
       surface_m2, nb_pieces, description, is_verifie, statut, score_ia, equipements, created_at,
       biens_medias(url, est_couverture, ordre, type)`,
    )
    .in('statut', [...STATUTS_PUBLICS])
    .order('est_couverture', { ascending: false, foreignTable: 'biens_medias' })
    .order('ordre', { ascending: true, foreignTable: 'biens_medias' })
    .limit(6, { foreignTable: 'biens_medias' })
    .limit(filters.limitPerSource ?? DEFAULT_LIMIT)

  if (filters.commune) q = q.ilike('commune', `%${filters.commune}%`)
  if (filters.type_bien) q = q.eq('type_bien', filters.type_bien)
  if (filters.type_offre === 'vente') {
    // Exige un prix_vente_fcfa renseigné
    q = q.not('prix_vente_fcfa', 'is', null)
  } else if (filters.type_offre === 'location') {
    // Exige soit prix_mois_fcfa soit prix_nuit_fcfa
    q = q.or('prix_mois_fcfa.not.is.null,prix_nuit_fcfa.not.is.null')
  }
  if (filters.q?.trim()) {
    q = q.textSearch('fts', filters.q.trim(), { type: 'plain', config: 'french' })
  }
  if (filters.equipements && filters.equipements.length > 0) {
    q = q.contains('equipements', filters.equipements)
  }
  // Encadre le prix dans [min, max] sur les 3 colonnes prix
  if (filters.prix_min != null && filters.prix_max != null) {
    q = q.or(
      `and(prix_mois_fcfa.gte.${filters.prix_min},prix_mois_fcfa.lte.${filters.prix_max}),` +
        `and(prix_nuit_fcfa.gte.${filters.prix_min},prix_nuit_fcfa.lte.${filters.prix_max}),` +
        `and(prix_vente_fcfa.gte.${filters.prix_min},prix_vente_fcfa.lte.${filters.prix_max})`,
    )
  } else if (filters.prix_min != null) {
    q = q.or(
      `prix_mois_fcfa.gte.${filters.prix_min},prix_nuit_fcfa.gte.${filters.prix_min},prix_vente_fcfa.gte.${filters.prix_min}`,
    )
  } else if (filters.prix_max != null) {
    q = q.or(
      `prix_mois_fcfa.lte.${filters.prix_max},prix_nuit_fcfa.lte.${filters.prix_max},prix_vente_fcfa.lte.${filters.prix_max}`,
    )
  }

  q = q.order('is_verifie', { ascending: false }).order('score_ia', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await q
  if (error || !data) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const medias = (b.biens_medias || []).slice().sort((a: any, c: any) => {
      if (a.est_couverture) return -1
      if (c.est_couverture) return 1
      return (a.ordre ?? 0) - (c.ordre ?? 0)
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cover = medias.find((m: any) => m.type === 'photo')?.url ?? null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const photos: string[] = medias.filter((m: any) => m.type === 'photo').map((m: any) => m.url).slice(0, 5)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videos: string[] = medias.filter((m: any) => m.type === 'video').map((m: any) => m.url).slice(0, 2)

    // ⚠️ Règle métier : une résidence meublée se loue à la NUITÉE, pas au mois.
    // Si on a un prix_mois_fcfa renseigné par erreur sur un meublé sans prix_nuit_fcfa,
    // on affiche « Prix sur demande » plutôt qu'un prix /mois incohérent qui détruit
    // la confiance (ex: « 15 000 FCFA/mois » pour un meublé tout équipé).
    const isMeuble = b.type_bien === 'residence_meublee'
    const { value, period, label } = (() => {
      if (b.prix_nuit_fcfa) return { value: b.prix_nuit_fcfa as number, period: 'nuit' as const, label: `${formatFCFA(b.prix_nuit_fcfa)} / nuit` }
      if (b.prix_vente_fcfa) return { value: b.prix_vente_fcfa as number, period: 'vente' as const, label: `${formatFCFA(b.prix_vente_fcfa)}` }
      if (b.prix_mois_fcfa && !isMeuble) return { value: b.prix_mois_fcfa as number, period: 'mois' as const, label: `${formatFCFA(b.prix_mois_fcfa)} / mois` }
      // Meublé sans prix_nuit → erreur de saisie probable → on masque le prix
      return { value: null, period: 'unknown' as const, label: 'Prix sur demande' }
    })()

    const dateIso = b.created_at ?? new Date().toISOString()
    return {
      id: `bogbes:${b.id}`,
      source: 'bogbes' as const,
      sourceId: b.id,
      titre: b.titre,
      commune: b.commune,
      quartier: b.quartier ?? null,
      type_bien: b.type_bien,
      prix_label: label,
      prix_value: value,
      prix_period: period,
      surface_m2: b.surface_m2 ?? null,
      nb_pieces: b.nb_pieces ?? null,
      description: b.description ?? null,
      photo_url: cover,
      is_verifie: !!b.is_verifie,
      is_pending: b.statut === 'en_attente',
      url: `${SITE_URL}/biens/${b.id}`,
      date_publication: dateIso,
      date_scraping: b.created_at ?? null,
      is_recent: Date.now() - new Date(dateIso).getTime() < 24 * 60 * 60 * 1000,
      photos,
      videos,
      equipements: Array.isArray(b.equipements) ? b.equipements : [],
      score_ia: typeof b.score_ia === 'number' ? b.score_ia : null,
      cta_url: `${SITE_URL}/biens/${b.id}#reserver`,
    }
  })
}

// ─── Locaux (WhatsApp scraping) ─────────────────────────────────────────────

async function fetchLocaux(filters: ConsolidatedFilters): Promise<ConsolidatedBien[]> {
  if (filters.source === 'bogbes') return []
  try {
    const sb = createLocauxClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (sb as any)
      .from('locaux')
      .select(
        // SECURITY: telephone, telephone_bien, publie_par, groupe_whatsapp_origine
        // omis — données identifiantes propriétaire/source.
        'id,ref_bien,type_de_bien,type_offre,zone_geographique,commune,quartier,prix,prix_normalise,caracteristiques,meubles,chambre,disponible,surface,date_publication,lien_image,message_initial,status,is_duplicate,date_expiration,created_at',
      )
      // ⚠️ Politique permissive : on récupère TOUS les biens scrapés sauf cas
      // explicitement disqualifiants (status='inactive' ou is_duplicate=true).
      // Le tri/filtrage fin est fait en JS via isStillActive (voir mapper.ts).
      .not('status', 'eq', 'inactive')
      .not('is_duplicate', 'is', true)
      .order('date_publication', { ascending: false })
      // Marge 10x pour compenser les filtres JS post-mapping (prix, disponible)
      .limit(Math.max(500, (filters.limitPerSource ?? DEFAULT_LIMIT) * 10))

    if (filters.commune) q = q.ilike('commune', `%${filters.commune}%`)
    if (filters.type_bien) q = q.ilike('type_de_bien', `%${filters.type_bien}%`)
    if (filters.type_offre) q = q.eq('type_offre', filters.type_offre)
    if (filters.q?.trim()) {
      const term = filters.q.trim()
      q = q.or(`caracteristiques.ilike.%${term}%,message_initial.ilike.%${term}%,quartier.ilike.%${term}%`)
    }
    // Équipements : les locaux n'ont pas de colonne structurée, on cherche le
    // mot-clé dans caracteristiques + message_initial. Chaque équipement ajoute
    // un .or() (Supabase chaîne les .or en AND entre eux → tous demandés).
    if (filters.equipements && filters.equipements.length > 0) {
      // Mapping code interne → mots-clés FR à chercher dans le texte brut
      const EQ_PATTERNS: Record<string, string[]> = {
        piscine: ['piscine'],
        parking: ['parking', 'garage'],
        climatisation: ['clim'],
        gardien: ['gardien', 'vigile'],
        groupe_electrogene: ['groupe', 'electrogene', 'generateur'],
        eau_chaude: ['eau chaude'],
        internet_fibre: ['internet', 'fibre', 'wifi'],
        cuisine_equipee: ['cuisine equipee', 'cuisine équipée'],
        terrasse: ['terrasse'],
        balcon: ['balcon'],
      }
      for (const eq of filters.equipements) {
        const patterns = EQ_PATTERNS[eq] ?? [eq]
        const orParts: string[] = []
        for (const p of patterns) {
          orParts.push(`caracteristiques.ilike.%${p}%`)
          orParts.push(`message_initial.ilike.%${p}%`)
        }
        q = q.or(orParts.join(','))
      }
    }
    // ⚠️ Filtre prix appliqué APRÈS mapping (prix_value est dérivé de prix_normalise
    // OU du parsing du champ texte `prix`) — sinon on exclut tous les biens dont
    // le scraper n'a pas pu remplir prix_normalise.

    const { data, error } = await q
    if (error || !data) return []

    return (data as LocauxRow[])
      .map(mapLocauxRow)
      .filter((b) => b.is_actif)
      .filter((b) => {
        if (filters.prix_min == null && filters.prix_max == null) return true
        // Si prix inconnu, on garde le bien (le LLM signale "Prix sur demande")
        if (b.prix_value == null) return true
        if (filters.prix_min != null && b.prix_value < filters.prix_min) return false
        if (filters.prix_max != null && b.prix_value > filters.prix_max) return false
        return true
      })
      .slice(0, filters.limitPerSource ?? DEFAULT_LIMIT)
      .map((b) => {
        const period =
          b.prix_unit === 'fcfa_par_mois'
            ? ('mois' as const)
            : b.type_offre === 'vente'
              ? ('vente' as const)
              : b.type_offre === 'location'
                ? ('mois' as const)
                : ('unknown' as const)
        return {
          id: `flash:${b.id}`,
          source: 'flash' as const,
          sourceId: String(b.id),
          titre: b.titre,
          commune: b.commune,
          quartier: b.quartier ?? null,
          type_bien: b.type_bien,
          prix_label: b.prix_label ?? (b.prix_value ? formatFCFA(b.prix_value) : 'Sur demande'),
          prix_value: b.prix_value,
          prix_period: period,
          surface_m2: b.surface_m2,
          nb_pieces: b.nb_chambres,
          description: b.description || b.caracteristiques,
          photo_url: b.image_url,
          is_verifie: false,
          is_pending: false,
          url: `${SITE_URL}/offre-flash/${b.id}`,
          date_publication: b.date_publication,
          date_scraping: b.date_scraping,
          is_recent: b.is_recent,
          photos: b.image_url ? [b.image_url] : [],
          videos: [],
          equipements: [],
          score_ia: null,
          cta_url: `https://wa.me/2250574243752?text=${encodeURIComponent(
            `Bonjour, je suis intéressé(e) par l'offre flash ${b.ref} (${b.titre} à ${b.commune})`,
          )}`,
        }
      })
  } catch {
    return []
  }
}

// ─── Dédup ──────────────────────────────────────────────────────────────────

/**
 * Construit une empreinte (fingerprint) approximative pour détecter les doublons :
 * même commune + type + prix (bucket 5%) + surface (bucket 5m²) + chambres.
 * Note : on ne peut pas faire un match exact car le scraper saisit des prix
 * légèrement différents (ex: 350 000 vs 350000) → on bucket.
 */
function fingerprint(b: ConsolidatedBien): string {
  const commune = (b.commune || '').toLowerCase().trim()
  const type = (b.type_bien || '').toLowerCase().trim()
  // Bucket prix : paliers logarithmiques ~5%. Deux prix à moins de 5% l'un de
  // l'autre tombent dans le même bucket ; des prix nettement différents non.
  // (l'ancienne formule prix/(prix*0.05) valait toujours 20 → fusionnait à tort
  // des biens distincts de même commune/type/surface.)
  const prixBucket =
    b.prix_value && b.prix_value > 0
      ? Math.round(Math.log(b.prix_value) / Math.log(1.05))
      : 0
  // Bucket surface : palier 5m²
  const surfaceBucket = b.surface_m2 ? Math.round(b.surface_m2 / 5) : 0
  const pieces = b.nb_pieces ?? 0
  return `${commune}|${type}|${prixBucket}|${surfaceBucket}|${pieces}`
}

/**
 * Déduplique les biens consolidés. Stratégie :
 * - Empreinte identique (commune+type+prix±5%+surface±5m²+pieces) → on garde 1 seul.
 * - Priorité : vérifié BOGBE'S > flash récent > flash ancien.
 * - On garde aussi tous les biens sans assez d'infos pour fingerprint (prix_value null + surface null).
 */
function dedupConsolidated(items: ConsolidatedBien[]): ConsolidatedBien[] {
  const map = new Map<string, ConsolidatedBien>()
  const passthrough: ConsolidatedBien[] = []
  for (const item of items) {
    // Si on n'a ni prix ni surface, on ne peut pas dédupliquer fiablement → on garde tel quel
    if (item.prix_value == null && item.surface_m2 == null) {
      passthrough.push(item)
      continue
    }
    const key = fingerprint(item)
    const existing = map.get(key)
    if (!existing) {
      map.set(key, item)
      continue
    }
    // Conflit : on garde le meilleur
    const score = (b: ConsolidatedBien): number => {
      let s = 0
      if (b.is_verifie) s += 100
      if (b.source === 'bogbes') s += 50
      // Un bien validé prime sur un doublon encore en attente de validation
      if (b.is_pending) s -= 25
      if (b.photo_url) s += 10
      if (b.score_ia) s += b.score_ia / 10
      if (b.is_recent) s += 5
      return s
    }
    if (score(item) > score(existing)) {
      map.set(key, item)
    }
  }
  return [...map.values(), ...passthrough]
}

// ─── Merge + tri unifié ─────────────────────────────────────────────────────

function sortConsolidated(items: ConsolidatedBien[], sort: ConsolidatedFilters['sort']): ConsolidatedBien[] {
  const arr = items.slice()
  switch (sort) {
    case 'recent':
      arr.sort((a, b) => new Date(b.date_publication).getTime() - new Date(a.date_publication).getTime())
      break
    case 'price_asc':
      arr.sort((a, b) => (a.prix_value ?? Number.POSITIVE_INFINITY) - (b.prix_value ?? Number.POSITIVE_INFINITY))
      break
    case 'price_desc':
      arr.sort((a, b) => (b.prix_value ?? 0) - (a.prix_value ?? 0))
      break
    case 'verified_first':
    default:
      arr.sort((a, b) => {
        if (a.is_verifie && !b.is_verifie) return -1
        if (!a.is_verifie && b.is_verifie) return 1
        return new Date(b.date_publication).getTime() - new Date(a.date_publication).getTime()
      })
  }
  return arr
}

/**
 * Fetch consolidated catalogue from both sources in parallel and merge.
 * Returns sorted list with badges (is_verifie, is_recent) ready for UI.
 */
export async function getConsolidatedCatalogue(
  filters: ConsolidatedFilters = {},
): Promise<{ items: ConsolidatedBien[]; counts: { bogbes: number; flash: number; total: number } }> {
  const [bogbes, flash] = await Promise.all([fetchBogbes(filters), fetchLocaux(filters)])
  const deduped = dedupConsolidated([...bogbes, ...flash])
  const merged = sortConsolidated(deduped, filters.sort ?? 'verified_first')
  // Compteurs APRÈS déduplication, par source → garantit total = bogbes + flash
  // (sinon "Tout" pouvait afficher moins que "Offres flash", ce qui n'a pas de sens).
  const bogbesCount = merged.filter((b) => b.source === 'bogbes').length
  const flashCount = merged.filter((b) => b.source === 'flash').length
  return {
    items: merged,
    counts: {
      bogbes: bogbesCount,
      flash: flashCount,
      total: merged.length,
    },
  }
}

// ─── Communes dynamiques ─────────────────────────────────────────────────────

/** Met une chaîne en Title Case (gère espaces et traits d'union) : "grand-bassam" → "Grand-Bassam". */
function titleCaseCommune(s: string): string {
  return s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase())
}

/**
 * Liste des communes RÉELLEMENT présentes dans le catalogue, agrégées depuis
 * les deux sources (biens vérifiés BOGBE'S + offres flash). Triées par nombre
 * de biens décroissant (les communes les plus actives en premier).
 *
 * Utilisé pour alimenter dynamiquement les puces de filtre commune, au lieu
 * d'une liste figée qui ne reflète pas l'offre réelle (Assinie, Grand-Bassam…).
 *
 * @param source  null = les deux sources ; 'bogbes' / 'flash' pour restreindre.
 * @param limit   nombre max de communes renvoyées (par fréquence décroissante).
 */
export async function getCatalogueCommunes(
  source: 'bogbes' | 'flash' | null = null,
  limit = 16,
): Promise<string[]> {
  const counts = new Map<string, { label: string; n: number }>()
  const add = (raw: unknown) => {
    if (typeof raw !== 'string') return
    const trimmed = raw.trim()
    if (!trimmed) return
    const key = trimmed.toLowerCase()
    const cur = counts.get(key)
    if (cur) cur.n += 1
    else counts.set(key, { label: titleCaseCommune(trimmed), n: 1 })
  }

  const tasks: Promise<void>[] = []

  if (source !== 'flash') {
    tasks.push(
      (async () => {
        try {
          const supabase = await createClient()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data } = await (supabase as any)
            .from('biens')
            .select('commune')
            .in('statut', [...STATUTS_PUBLICS])
            .limit(5000)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const r of (data ?? []) as any[]) add(r.commune)
        } catch {
          /* source indisponible — on ignore */
        }
      })(),
    )
  }

  if (source !== 'bogbes') {
    tasks.push(
      (async () => {
        try {
          const sb = createLocauxClient()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data } = await (sb as any)
            .from('locaux')
            .select('commune')
            .not('status', 'eq', 'inactive')
            .not('is_duplicate', 'is', true)
            .limit(5000)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const r of (data ?? []) as any[]) add(r.commune)
        } catch {
          /* source indisponible — on ignore */
        }
      })(),
    )
  }

  await Promise.all(tasks)

  return [...counts.values()]
    .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label))
    .slice(0, limit)
    .map((c) => c.label)
}

// ─── Fetch by ID ────────────────────────────────────────────────────────────

/** Détecte une URL de bien dans un message texte et retourne {source, id}. */
export function extractBienIdFromText(text: string): { source: 'bogbes' | 'flash'; id: string } | null {
  if (!text) return null
  // /biens/<UUID v4>
  const bogbesMatch = text.match(/\/biens\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
  if (bogbesMatch) return { source: 'bogbes', id: bogbesMatch[1] }
  // /offre-flash/<numeric>
  const flashMatch = text.match(/\/offre-flash\/(\d+)/i)
  if (flashMatch) return { source: 'flash', id: flashMatch[1] }
  return null
}

/** Récupère UN bien précis par son ID + sa source. */
export async function getConsolidatedBienById(
  source: 'bogbes' | 'flash',
  id: string,
): Promise<ConsolidatedBien | null> {
  if (source === 'bogbes') {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: b } = await (supabase as any)
      .from('biens')
      .select(
        'id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces, description, is_verifie, statut, score_ia, equipements, created_at, biens_medias(url, est_couverture, ordre, type)',
      )
      .eq('id', id)
      .in('statut', [...STATUTS_PUBLICS])
      .maybeSingle()
    if (!b) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const medias = (b.biens_medias || []).slice().sort((a: any, c: any) => {
      if (a.est_couverture) return -1
      if (c.est_couverture) return 1
      return (a.ordre ?? 0) - (c.ordre ?? 0)
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cover = medias.find((m: any) => m.type === 'photo')?.url ?? null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const photos: string[] = medias.filter((m: any) => m.type === 'photo').map((m: any) => m.url).slice(0, 5)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videos: string[] = medias.filter((m: any) => m.type === 'video').map((m: any) => m.url).slice(0, 2)

    // ⚠️ Règle métier : une résidence meublée se loue à la NUITÉE, pas au mois.
    // Si on a un prix_mois_fcfa renseigné par erreur sur un meublé sans prix_nuit_fcfa,
    // on affiche « Prix sur demande » plutôt qu'un prix /mois incohérent qui détruit
    // la confiance (ex: « 15 000 FCFA/mois » pour un meublé tout équipé).
    const isMeuble = b.type_bien === 'residence_meublee'
    const { value, period, label } = (() => {
      if (b.prix_nuit_fcfa) return { value: b.prix_nuit_fcfa as number, period: 'nuit' as const, label: `${formatFCFA(b.prix_nuit_fcfa)} / nuit` }
      if (b.prix_vente_fcfa) return { value: b.prix_vente_fcfa as number, period: 'vente' as const, label: `${formatFCFA(b.prix_vente_fcfa)}` }
      if (b.prix_mois_fcfa && !isMeuble) return { value: b.prix_mois_fcfa as number, period: 'mois' as const, label: `${formatFCFA(b.prix_mois_fcfa)} / mois` }
      // Meublé sans prix_nuit → erreur de saisie probable → on masque le prix
      return { value: null, period: 'unknown' as const, label: 'Prix sur demande' }
    })()

    const dateIso = b.created_at ?? new Date().toISOString()
    return {
      id: `bogbes:${b.id}`,
      source: 'bogbes',
      sourceId: b.id,
      titre: b.titre,
      commune: b.commune,
      quartier: b.quartier ?? null,
      type_bien: b.type_bien,
      prix_label: label,
      prix_value: value,
      prix_period: period,
      surface_m2: b.surface_m2 ?? null,
      nb_pieces: b.nb_pieces ?? null,
      description: b.description ?? null,
      photo_url: cover,
      is_verifie: !!b.is_verifie,
      is_pending: b.statut === 'en_attente',
      url: `${SITE_URL}/biens/${b.id}`,
      date_publication: dateIso,
      date_scraping: b.created_at ?? null,
      is_recent: Date.now() - new Date(dateIso).getTime() < 24 * 60 * 60 * 1000,
      photos,
      videos,
      equipements: Array.isArray(b.equipements) ? b.equipements : [],
      score_ia: typeof b.score_ia === 'number' ? b.score_ia : null,
      cta_url: `${SITE_URL}/biens/${b.id}#reserver`,
    }
  }

  // source === 'flash'
  try {
    const sb = createLocauxClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row } = await (sb as any)
      .from('locaux')
      .select(
        'id,ref_bien,type_de_bien,type_offre,zone_geographique,commune,quartier,prix,prix_normalise,caracteristiques,meubles,chambre,disponible,surface,date_publication,lien_image,message_initial,status,is_duplicate,date_expiration,created_at',
      )
      .eq('id', Number(id))
      .maybeSingle()
    if (!row) return null
    const b = mapLocauxRow(row as LocauxRow)
    if (!b.is_actif) return null
    const period =
      b.prix_unit === 'fcfa_par_mois'
        ? ('mois' as const)
        : b.type_offre === 'vente'
          ? ('vente' as const)
          : b.type_offre === 'location'
            ? ('mois' as const)
            : ('unknown' as const)
    return {
      id: `flash:${b.id}`,
      source: 'flash',
      sourceId: String(b.id),
      titre: b.titre,
      commune: b.commune,
      quartier: b.quartier ?? null,
      type_bien: b.type_bien,
      prix_label: b.prix_label ?? (b.prix_value ? formatFCFA(b.prix_value) : 'Sur demande'),
      prix_value: b.prix_value,
      prix_period: period,
      surface_m2: b.surface_m2,
      nb_pieces: b.nb_chambres,
      description: b.description || b.caracteristiques,
      photo_url: b.image_url,
      is_verifie: false,
      is_pending: false,
      url: `${SITE_URL}/offre-flash/${b.id}`,
      date_publication: b.date_publication,
      date_scraping: b.date_scraping,
      is_recent: b.is_recent,
      photos: b.image_url ? [b.image_url] : [],
      videos: [],
      equipements: [],
      score_ia: null,
      cta_url: `https://wa.me/2250574243752?text=${encodeURIComponent(
        `Bonjour, je suis intéressé(e) par l'offre flash ${b.ref} (${b.titre} à ${b.commune})`,
      )}`,
    }
  } catch {
    return null
  }
}
