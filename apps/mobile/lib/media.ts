export interface MediaRow {
  url: string
  est_couverture?: boolean | null
  ordre?: number | null
  type?: string | null
}

/**
 * Choisit l'URL de couverture d'un bien à partir de sa liste biens_medias :
 * la photo marquée couverture, sinon la première par ordre. Null si aucune photo.
 */
export function pickCover(medias: MediaRow[] | null | undefined): string | null {
  if (!medias || medias.length === 0) return null
  const photos = medias.filter((m) => !m.type || m.type === 'photo')
  if (photos.length === 0) return null
  const cover =
    photos.find((m) => m.est_couverture) ??
    [...photos].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))[0]
  return cover?.url ?? null
}

/** Toutes les URLs photos d'un bien, triées (couverture en premier). */
export function photoUrls(medias: MediaRow[] | null | undefined): string[] {
  if (!medias) return []
  return medias
    .filter((m) => (!m.type || m.type === 'photo') && m.url)
    .sort((a, b) => {
      if (a.est_couverture && !b.est_couverture) return -1
      if (!a.est_couverture && b.est_couverture) return 1
      return (a.ordre ?? 0) - (b.ordre ?? 0)
    })
    .map((m) => m.url)
}
