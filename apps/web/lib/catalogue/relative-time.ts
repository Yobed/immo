/** Formats a catalogue timestamp using the supplied clock for deterministic tests. */
export function formatRelativeTime(iso: string | null, now = Date.now()): string {
  if (!iso) return ''
  const timestamp = new Date(iso).getTime()
  if (Number.isNaN(timestamp)) return ''
  const diff = Math.max(0, now - timestamp)
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export function isRecentTimestamp(iso: string | null, now = Date.now()): boolean {
  if (!iso) return false
  const timestamp = new Date(iso).getTime()
  if (Number.isNaN(timestamp)) return false
  return now - timestamp < 24 * 60 * 60 * 1000
}
