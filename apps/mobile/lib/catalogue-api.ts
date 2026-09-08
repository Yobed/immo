export type ListingSource = 'web' | 'bogbes' | 'flash-old' | 'flash-mid' | 'flash-fresh'

export interface PublicListing {
  source: ListingSource
  id: string
  reference: string
  url: string
  titre: string
  commune: string
  quartier?: string | null
  type_bien: string
  description?: string | null
  prix_fcfa: number | null
  prix_period: 'vente' | 'mois' | 'nuit' | 'unknown'
  prix_label: string
  surface_m2?: number | null
  nb_pieces?: number | null
  photo_principale?: string | null
  photos?: string[]
}

export interface CataloguePage {
  items: PublicListing[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  generatedAt: string
}

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://bogbesgroup.com').replace(/\/$/, '')

async function responseJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as T & { error?: string }
  if (!response.ok) throw new Error(body.error || 'Le catalogue est indisponible.')
  return body
}

export async function fetchCataloguePage({ query = '', page = 0, limit = 24, signal }: {
  query?: string; page?: number; limit?: number; signal?: AbortSignal
} = {}): Promise<CataloguePage> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (query.trim()) params.set('q', query.trim())
  return responseJson(await fetch(`${API_URL}/api/mobile/annonces?${params}`, { signal }))
}

export async function fetchListing(source: ListingSource, id: string, signal?: AbortSignal): Promise<PublicListing> {
  return responseJson(await fetch(`${API_URL}/api/mobile/annonces/${encodeURIComponent(id)}?source=${encodeURIComponent(source)}`, { signal }))
}
