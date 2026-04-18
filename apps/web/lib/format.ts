const LOCALE = 'fr-CI'

/** Formate un montant en FCFA avec séparateur de milliers */
export function formatFCFA(n: number, withCurrency = true): string {
  const formatted = new Intl.NumberFormat(LOCALE, {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(n)
  return withCurrency ? `${formatted} FCFA` : formatted
}

/** Formate un montant compact : 1 500 000 → "1,5M" */
export function formatFCFACompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}Md`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return String(n)
}

/** Retourne le prix affiché d'un bien + le suffixe approprié */
export function getBienPrix(bien: {
  type_bien?: string
  prix_nuit_fcfa?: number | null
  prix_mois_fcfa?: number | null
  prix_vente_fcfa?: number | null
}): { value: string; suffix: string } | null {
  const isNuitee = bien.type_bien === 'residence_meublee'
  if (isNuitee && bien.prix_nuit_fcfa)
    return { value: formatFCFA(bien.prix_nuit_fcfa), suffix: '/nuit' }
  if (bien.prix_mois_fcfa)
    return { value: formatFCFA(bien.prix_mois_fcfa), suffix: '/mois' }
  if (bien.prix_vente_fcfa)
    return { value: formatFCFA(bien.prix_vente_fcfa), suffix: '' }
  return null
}

/** Parse un entier de searchParam URL, retourne null si NaN */
export function parseIntParam(value: string | undefined): number | null {
  if (!value) return null
  const n = parseInt(value, 10)
  return isNaN(n) ? null : n
}

/** Formate une date ISO en date lisible fr-CI */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-CI', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

/** Formate une date ISO en date courte : "14 jan." */
export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat('fr-CI', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso))
}
