import { publicDescription } from './public-description.ts'

export type DescriptionPresentation = {
  /** The complete public description, with wording and punctuation preserved. */
  text: string | null
  /** Display-only blocks; only whitespace/separators are changed for readability. */
  blocks: string[]
}

/**
 * Keep the complete source description while adding visual breathing room.
 * No summary, ranking or editorial rewrite is performed here.
 */
export function presentDescription(value: string | null): DescriptionPresentation {
  const text = publicDescription(value)
  if (!text) return { text: null, blocks: [] }

  const formatted = text
    // Keep the source separators, but put each item on its own visual line.
    .replace(/\s*([•·▪◦])\s*/g, '\n$1 ')
    .replace(/;\s+/g, ';\n')
    .replace(/\n{3,}/g, '\n\n')

  const blocks = formatted
    .split(/\n+/)
    .map((block) => block.trim())
    .filter(Boolean)

  return { text, blocks: blocks.length ? blocks : [text] }
}
