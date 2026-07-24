import { unstable_cache } from 'next/cache'
import { locauxReadClients } from '@/lib/supabase/locaux'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Classement des démarcheurs/agents les plus actifs sur les offres flash
 * scrapées, pour les contacter et les convertir en comptes plateforme.
 * Agrège les DEUX projets locaux (ancien + nouveau) par numéro de contact.
 */

export interface DemarcheurStat {
  phone: string // chiffres normalisés (225 retiré)
  count: number
  communes: string[] // top 3 communes
  name: string | null // publie_par le plus fréquent
  lastDate: string | null
}

/** Normalise un numéro CI en chiffres (225 retiré). Null si non exploitable. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  let s = String(raw).replace(/[^0-9]/g, '')
  if (s.startsWith('225')) s = s.slice(3)
  return s.length >= 8 && s.length <= 10 ? s : null
}

interface Row {
  telephone_bien: string | null
  publie_par: string | null
  commune: string | null
  date_publication: string | null
}

async function fetchAllActive(sb: SupabaseClient): Promise<Row[]> {
  const rows: Row[] = []
  for (let from = 0; from < 40_000; from += 1000) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb as any)
      .from('locaux')
      .select('telephone_bien,publie_par,commune,date_publication')
      .not('status', 'eq', 'inactive')
      .not('is_duplicate', 'is', true)
      .order('id', { ascending: true })
      .range(from, from + 999)
    if (error || !data || data.length === 0) break
    rows.push(...(data as Row[]))
    if (data.length < 1000) break
  }
  return rows
}

const topKeys = (m: Map<string, number>, n: number): string[] =>
  [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k)

async function computeTopDemarcheurs(limit: number): Promise<DemarcheurStat[]> {
  const parts = await Promise.all(
    locauxReadClients().map((sb) => fetchAllActive(sb).catch(() => [] as Row[])),
  )
  const rows = parts.flat()

  const map = new Map<
    string,
    { count: number; last: string; names: Map<string, number>; comm: Map<string, number> }
  >()
  for (const r of rows) {
    const p = normalizePhone(r.telephone_bien)
    if (!p) continue
    const e = map.get(p) ?? { count: 0, last: '', names: new Map(), comm: new Map() }
    e.count++
    if ((r.date_publication ?? '') > e.last) e.last = r.date_publication ?? ''
    if (r.publie_par) e.names.set(r.publie_par, (e.names.get(r.publie_par) ?? 0) + 1)
    if (r.commune) e.comm.set(r.commune, (e.comm.get(r.commune) ?? 0) + 1)
    map.set(p, e)
  }

  return [...map.entries()]
    .map(([phone, e]) => ({
      phone,
      count: e.count,
      communes: topKeys(e.comm, 3),
      name: topKeys(e.names, 1)[0] ?? null,
      lastDate: e.last || null,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/**
 * Version cachée (30 min) : l'agrégation lit ~12 000 lignes sur 2 projets,
 * trop lourd à refaire à chaque affichage de la page admin.
 */
export const getTopDemarcheurs = unstable_cache(
  async (limit: number) => computeTopDemarcheurs(limit),
  ['top-demarcheurs-v1'],
  { revalidate: 1800 },
)
