/**
 * Mapper: row brute de la table `locaux` (scraping WhatsApp) → format normalisé BOGBE'S GROUPE.
 */

export interface LocauxRow {
  id: number
  ref_bien: string | null
  type_de_bien: string | null
  type_offre: string | null
  zone_geographique: string | null
  commune: string | null
  quartier: string | null
  prix: string | null
  prix_normalise: number | null
  telephone: string | null
  telephone_bien: string | null
  caracteristiques: string | null
  publie_par: string | null
  meubles: string | null
  chambre: string | null
  disponible: string | null
  surface: string | null
  groupe_whatsapp_origine: string | null
  date_publication: string | null
  lien_image: string | null
  message_initial: string | null
  status: string | null
  is_duplicate: boolean | null
  date_expiration: string | null
  created_at: string | null
}

export interface BienExterne {
  id: number
  ref: string
  type_bien: string
  type_offre: 'vente' | 'location' | 'inconnu'
  commune: string
  quartier: string | null
  zone: string | null
  titre: string
  description: string
  caracteristiques: string | null
  prix_value: number | null
  prix_unit: 'fcfa' | 'fcfa_par_m2' | 'fcfa_par_mois' | null
  prix_label: string | null
  surface_m2: number | null
  nb_chambres: number | null
  meuble: boolean
  publie_par: string | null
  telephone: string | null
  image_url: string | null
  groupe_whatsapp: string | null
  date_publication: string
  /** Date à laquelle notre système a récupéré (scrapé) cette annonce. */
  date_scraping: string | null
  is_recent: boolean
  is_actif: boolean
}

const TYPE_MAP: Record<string, string> = {
  terrain: 'terrain',
  parcelle: 'terrain',
  appartement: 'appartement',
  studio: 'studio',
  villa: 'villa',
  maison: 'maison',
  duplex: 'villa',
  bureau: 'bureau',
  commerce: 'commerce',
  magasin: 'commerce',
  boutique: 'commerce',
  immeuble: 'commerce',
  site: 'terrain',
  residence_meublee: 'residence_meublee',
  meuble: 'residence_meublee',
}

function normalizeType(raw: string | null): string {
  if (!raw) return 'autre'
  const k = raw.toLowerCase().trim()
  return TYPE_MAP[k] ?? k
}

function normalizeOffre(raw: string | null): 'vente' | 'location' | 'inconnu' {
  if (!raw) return 'inconnu'
  const k = raw.toLowerCase().trim()
  if (k.startsWith('vent')) return 'vente'
  if (k.startsWith('loc')) return 'location'
  return 'inconnu'
}

/**
 * Parse "180 millions FCFA", "1.500.000.000 fr cfa", "10 500 000 000 FCFA",
 * "60.000 FCFA/m²", "1.5M", "950000 FCFA" → { value, unit }.
 */
export function parsePrix(raw: string | null): { value: number | null; unit: BienExterne['prix_unit']; label: string | null } {
  if (!raw) return { value: null, unit: null, label: null }
  const s = raw.trim()
  if (!s) return { value: null, unit: null, label: null }

  const lower = s.toLowerCase()
  const isPerM2 = /\/m[²2]|\bpar m[²2]\b/.test(lower)
  const isPerMois = /\/mois|par mois/.test(lower)

  // "X millions"
  const millionsMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*million/)
  if (millionsMatch) {
    const num = parseFloat(millionsMatch[1].replace(',', '.'))
    return { value: Math.round(num * 1_000_000), unit: isPerM2 ? 'fcfa_par_m2' : isPerMois ? 'fcfa_par_mois' : 'fcfa', label: s }
  }

  // "X milliards"
  const milliardsMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*milliard/)
  if (milliardsMatch) {
    const num = parseFloat(milliardsMatch[1].replace(',', '.'))
    return { value: Math.round(num * 1_000_000_000), unit: isPerM2 ? 'fcfa_par_m2' : isPerMois ? 'fcfa_par_mois' : 'fcfa', label: s }
  }

  // Format "1.5M" ou "1,5M"
  const shortM = lower.match(/(\d+(?:[.,]\d+)?)\s*m\b/)
  if (shortM && !lower.includes('million')) {
    const num = parseFloat(shortM[1].replace(',', '.'))
    if (num < 100) {
      return { value: Math.round(num * 1_000_000), unit: isPerM2 ? 'fcfa_par_m2' : isPerMois ? 'fcfa_par_mois' : 'fcfa', label: s }
    }
  }

  // Format "150K"
  const shortK = lower.match(/(\d+(?:[.,]\d+)?)\s*k\b/)
  if (shortK) {
    const num = parseFloat(shortK[1].replace(',', '.'))
    return { value: Math.round(num * 1_000), unit: isPerM2 ? 'fcfa_par_m2' : isPerMois ? 'fcfa_par_mois' : 'fcfa', label: s }
  }

  // Plus gros nombre (avec dots ou spaces comme séparateurs)
  // ex: "1.500.000.000", "10 500 000 000", "11.800.000", "550000"
  const numMatch = s.match(/[\d][\d\s.]*\d|\d+/g)
  if (numMatch) {
    const candidates = numMatch
      .map(n => Number(n.replace(/[\s.]/g, '')))
      .filter(n => !isNaN(n) && n > 0)
    if (candidates.length > 0) {
      const value = Math.max(...candidates)
      return { value, unit: isPerM2 ? 'fcfa_par_m2' : isPerMois ? 'fcfa_par_mois' : 'fcfa', label: s }
    }
  }

  return { value: null, unit: null, label: s }
}

/**
 * Parse "16 hectares" → 160000, "120m²" → 120, "120 m2" → 120, "1500" → 1500.
 */
export function parseSurface(raw: string | null): number | null {
  if (!raw) return null
  const s = raw.trim().toLowerCase()
  if (!s) return null

  const hectMatch = s.match(/(\d+(?:[.,]\d+)?)\s*ha?ctares?/) ?? s.match(/(\d+(?:[.,]\d+)?)\s*ha\b/)
  if (hectMatch) {
    const num = parseFloat(hectMatch[1].replace(',', '.'))
    return Math.round(num * 10_000)
  }

  const m2Match = s.match(/(\d+(?:[.,]\d+)?)\s*m\s*[²2]?/)
  if (m2Match) {
    const num = parseFloat(m2Match[1].replace(',', '.'))
    return Math.round(num)
  }

  const numOnly = s.match(/^\d+$/)
  if (numOnly) return Number(s)

  return null
}

function parseChambres(raw: string | null): number | null {
  if (!raw) return null
  const m = raw.match(/\d+/)
  return m ? parseInt(m[0], 10) : null
}

function buildTitre(b: { type_de_bien: string | null; chambre: string | null; commune: string | null; quartier: string | null; type_offre: string | null }): string {
  const t = b.type_de_bien?.trim() || 'Bien'
  const ch = parseChambres(b.chambre)
  const lieu = [b.quartier?.trim(), b.commune?.trim()].filter(Boolean).join(', ')
  const offre = normalizeOffre(b.type_offre)
  const action = offre === 'vente' ? 'à vendre' : offre === 'location' ? 'à louer' : ''
  const chPart = ch && ch > 0 ? `${ch} chambre${ch > 1 ? 's' : ''}` : ''
  return [t, chPart, lieu, action].filter(Boolean).join(' · ').replace(/\s+/g, ' ').trim()
}

function buildDescription(b: { caracteristiques: string | null; message_initial: string | null }): string {
  const caracs = b.caracteristiques?.trim() || ''
  const msg = b.message_initial?.trim() || ''
  if (caracs && msg && caracs.length < msg.length) return msg
  return caracs || msg
}

function isRecent(date: string | null): boolean {
  if (!date) return false
  const d = new Date(date).getTime()
  if (isNaN(d)) return false
  return Date.now() - d < 24 * 60 * 60 * 1000
}

function isStillActive(row: LocauxRow): boolean {
  // ⚠️ Politique permissive : on remonte TOUS les biens scrapés sauf cas explicitement disqualifiants.
  // - status === 'inactive' explicite → exclu (mais NULL/manquant → accepté)
  // - is_duplicate === true → exclu (mais NULL → accepté)
  // - disponible === 'non' explicite → exclu (mais NULL ou 'oui' ou tout autre → accepté)
  // - date_expiration dépassée → exclu (NULL = pas d'expiration → accepté)
  if (row.status && row.status.toLowerCase() === 'inactive') return false
  if (row.is_duplicate === true) return false
  if (row.disponible && row.disponible.toLowerCase().trim() === 'non') return false
  if (row.date_expiration) {
    const exp = new Date(row.date_expiration).getTime()
    if (!isNaN(exp) && exp < Date.now()) return false
  }
  return true
}

export function mapLocauxRow(row: LocauxRow): BienExterne {
  const offre = normalizeOffre(row.type_offre)
  const prixParsed = parsePrix(row.prix)
  const fallbackUnit: BienExterne['prix_unit'] = offre === 'location' ? 'fcfa_par_mois' : 'fcfa'
  return {
    id: row.id,
    ref: row.ref_bien || `LOC-${row.id}`,
    type_bien: normalizeType(row.type_de_bien),
    type_offre: offre,
    commune: row.commune?.trim() || 'Non précisé',
    quartier: row.quartier?.trim() || null,
    zone: row.zone_geographique?.trim() || null,
    titre: buildTitre(row),
    description: buildDescription(row),
    caracteristiques: row.caracteristiques?.trim() || null,
    prix_value: prixParsed.value ?? (row.prix_normalise && row.prix_normalise > 0 ? row.prix_normalise : null),
    prix_unit: prixParsed.unit ?? (prixParsed.value ? fallbackUnit : null),
    prix_label: prixParsed.label,
    surface_m2: parseSurface(row.surface),
    nb_chambres: parseChambres(row.chambre),
    meuble: row.meubles?.toLowerCase() === 'oui',
    publie_par: row.publie_par?.trim() || null,
    telephone: row.telephone_bien?.trim() || row.telephone?.trim() || null,
    image_url: row.lien_image?.trim() || null,
    groupe_whatsapp: row.groupe_whatsapp_origine?.trim() || null,
    date_publication: row.date_publication || row.created_at || new Date().toISOString(),
    date_scraping: row.created_at,
    is_recent: isRecent(row.date_publication || row.created_at),
    is_actif: isStillActive(row),
  }
}
