import { publicDescription } from './public-description.ts'

export type DescriptionPresentation = {
  intro: string | null
  highlights: string[]
  note: string | null
}

const SECTION_MARKER = /(?:composition|caractéristiques|equipements|équipements|détails?)\s*:/i
const LIST_SEPARATOR = /\s*(?:•|·|▪|◦|;|\r?\n+)\s*/
const NOTE_MARKER = /(?:loyer|prix|montant)\s*:?/i

function splitList(value: string): string[] {
  const separated = value
    .split(LIST_SEPARATOR)
    .map((item) => item.replace(/^\s*[-–—:]+\s*/, '').trim())
    .filter((item) => item.length > 1)

  // Scraped property descriptions often use a colon followed by a comma list
  // instead of bullets. Only use commas when the segment clearly behaves like
  // a list, so ordinary prose remains readable.
  if (separated.length === 1 && (separated[0]?.match(/,/g)?.length ?? 0) >= 2) {
    const commaItems = separated[0]
      .split(/\s*,\s*/)
      .map((item) => item.trim())
      .filter((item) => item.length > 1)
    if (commaItems.length >= 3) return commaItems
  }

  return separated
}

function takeNarrativeStart(value: string): string {
  const narrative = value.match(/(?:nous vous|découvrez|situé(?:e)?|ce bien|cette annonce)\b/i)
  return (narrative ? value.slice(narrative.index ?? 0) : value).trim()
}

/**
 * Convert scraped prose into a short introduction, readable key points and a
 * single note for explicit price/loyer/montant markers.
 */
export function presentDescription(value: string | null): DescriptionPresentation {
  const clean = publicDescription(value)
  if (!clean) return { intro: null, highlights: [], note: null }

  const section = clean.match(SECTION_MARKER)
  let introRaw = section ? clean.slice(0, section.index) : clean
  let detailsRaw = section ? clean.slice((section.index ?? 0) + section[0].length) : ''

  // A colon is a useful fallback for source texts such as “située à ...:
  // salon, cuisine, ...” when the source did not label its composition.
  if (!section) {
    const colon = clean.match(/:\s+/)
    if (colon?.index !== undefined && colon.index >= 20 && colon.index <= 180) {
      introRaw = clean.slice(0, colon.index)
      detailsRaw = clean.slice(colon.index + colon[0].length)
    }
  }

  const introCandidate = takeNarrativeStart(introRaw)
  let intro: string | null = introCandidate || null
  let highlights = splitList(detailsRaw)

  // With no explicit section, the first list item reads best as the intro and
  // the remaining items become the key points.
  if (!section && !detailsRaw) {
    const items = splitList(clean)
    if (items.length > 1) {
      intro = takeNarrativeStart(items.shift() ?? '') || null
      highlights = items
    }
  }

  let note: string | null = null
  const remaining: string[] = []
  for (const item of highlights) {
    if (NOTE_MARKER.test(item)) {
      note = note ? `${note} ${item}`.trim() : item
      continue
    }
    remaining.push(item)
  }

  // If a price marker occurs in the intro, remove it from the prose and keep
  // the complete marked segment in the dedicated note area.
  if (intro && NOTE_MARKER.test(intro)) {
    const match = intro.match(NOTE_MARKER)
    if (match?.index !== undefined) {
      const before = intro.slice(0, match.index).trim()
      const marked = intro.slice(match.index).trim()
      note = note ? `${note} ${marked}`.trim() : marked
      intro = before || null
    }
  }

  return {
    intro,
    highlights: remaining,
    note,
  }
}
