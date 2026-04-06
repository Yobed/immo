/**
 * Formate une date au format ivoirien (dd MMMM yyyy).
 * Exemple : formatDateCI(new Date('2024-03-15')) → "15 mars 2024"
 * Utilise Intl.DateTimeFormat (pas de dépendance externe).
 */
export function formatDateCI(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-CI', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/**
 * Formate une date de manière relative (ex: "il y a 3 jours").
 * Exemple : formatDateRelative(new Date(Date.now() - 3*86400*1000)) → "il y a 3 jours"
 * Utilise Intl.RelativeTimeFormat (pas de dépendance externe).
 */
export function formatDateRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = Date.now()
  const diffMs = d.getTime() - now
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHour = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHour / 24)
  const diffMonth = Math.round(diffDay / 30)
  const diffYear = Math.round(diffDay / 365)

  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second')
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour')
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day')
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month')
  return rtf.format(diffYear, 'year')
}
