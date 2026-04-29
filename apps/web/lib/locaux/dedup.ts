import { createLocauxClient, createLocauxAdminClient } from '@/lib/supabase/locaux'

export interface DedupResult {
  loaded: number
  marked: number
  byPubId: number
  byMessage: number
  byCombo: number
  remaining: number
}

interface MinimalRow {
  id: number
  publication_id: string | null
  message_initial: string | null
  telephone_bien: string | null
  prix: string | null
  commune: string | null
  type_de_bien: string | null
  type_offre: string | null
  date_publication: string | null
  created_at: string | null
}

const dateOf = (r: MinimalRow): number =>
  new Date(r.date_publication || r.created_at || 0).getTime()

export async function runLocauxDedup(): Promise<DedupResult> {
  const c = createLocauxClient()
  const admin = createLocauxAdminClient()

  // 1. Charger toutes les lignes actives non-marquées
  const all: MinimalRow[] = []
  let from = 0
  while (true) {
    const { data } = await c
      .from('locaux')
      .select('id,publication_id,message_initial,telephone_bien,prix,commune,type_de_bien,type_offre,date_publication,created_at')
      .eq('status', 'active')
      .eq('is_duplicate', false)
      .range(from, from + 999)
      .order('id')
    if (!data || data.length === 0) break
    all.push(...(data as unknown as MinimalRow[]))
    if (data.length < 1000) break
    from += 1000
  }

  const toMark = new Map<number, { duplicate_of: number }>()
  let byPubId = 0
  let byMessage = 0
  let byCombo = 0

  // Critère 1: publication_id
  const byPub: Record<string, MinimalRow[]> = {}
  for (const r of all) {
    if (r.publication_id) {
      if (!byPub[r.publication_id]) byPub[r.publication_id] = []
      byPub[r.publication_id].push(r)
    }
  }
  for (const arr of Object.values(byPub)) {
    if (arr.length < 2) continue
    arr.sort((a, b) => dateOf(b) - dateOf(a))
    for (const r of arr.slice(1)) {
      if (!toMark.has(r.id)) {
        toMark.set(r.id, { duplicate_of: arr[0].id })
        byPubId++
      }
    }
  }

  // Critère 2: message_initial verbatim
  const byMsg: Record<string, MinimalRow[]> = {}
  for (const r of all) {
    if (toMark.has(r.id)) continue
    if (!r.message_initial || r.message_initial.length < 30) continue
    const k = r.message_initial.trim().slice(0, 400)
    if (!byMsg[k]) byMsg[k] = []
    byMsg[k].push(r)
  }
  for (const arr of Object.values(byMsg)) {
    if (arr.length < 2) continue
    arr.sort((a, b) => dateOf(b) - dateOf(a))
    for (const r of arr.slice(1)) {
      if (!toMark.has(r.id)) {
        toMark.set(r.id, { duplicate_of: arr[0].id })
        byMessage++
      }
    }
  }

  // Critère 3: combo phone+commune+type+offre+prix
  const byCmb: Record<string, MinimalRow[]> = {}
  for (const r of all) {
    if (toMark.has(r.id)) continue
    if (!r.telephone_bien || !r.commune) continue
    const k = `${r.telephone_bien}|${(r.commune || '').toLowerCase()}|${(r.type_de_bien || '').toLowerCase()}|${(r.type_offre || '').toLowerCase()}|${r.prix || ''}`
    if (!byCmb[k]) byCmb[k] = []
    byCmb[k].push(r)
  }
  for (const arr of Object.values(byCmb)) {
    if (arr.length < 2) continue
    arr.sort((a, b) => dateOf(b) - dateOf(a))
    for (const r of arr.slice(1)) {
      if (!toMark.has(r.id)) {
        toMark.set(r.id, { duplicate_of: arr[0].id })
        byCombo++
      }
    }
  }

  // Marquage en batch (service-role pour bypass RLS)
  const ids = [...toMark.keys()]
  const BATCH = 50
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH)
    await Promise.all(batch.map(id => {
      const { duplicate_of } = toMark.get(id)!
      return admin.from('locaux').update({ is_duplicate: true, duplicate_of }).eq('id', id)
    }))
  }

  // Vérif post
  const { count: remaining } = await c
    .from('locaux')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('is_duplicate', false)

  return {
    loaded: all.length,
    marked: toMark.size,
    byPubId,
    byMessage,
    byCombo,
    remaining: remaining ?? 0,
  }
}
