import { createLocauxClient, createLocauxAdminClient } from '@/lib/supabase/locaux'
import { checkN8nHealth } from '@/lib/n8n/client'

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

export interface CleanZombieN8nResult {
  unblockedRunning: number
  unblockedNew: number
  purged: number
  n8nHealthy: boolean
  latencyMs: number
  message: string
}

export async function cleanZombieN8nExecutions(): Promise<CleanZombieN8nResult> {
  // 1. Réveil et contrôle de santé actif de l'instance n8n (Hugging Face)
  const health = await checkN8nHealth()

  let unblockedRunning = 0
  let unblockedNew = 0
  let purged = 0

  // 2. Nettoyage Postgres défensif (uniquement si la table execution_entity existe)
  try {
    const admin = createLocauxAdminClient()
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString()
    const now = new Date().toISOString()

    // Test rapide sans exception bloquante
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: testErr } = await (admin as any).from('execution_entity').select('id', { head: true, count: 'exact' }).limit(1)
    if (!testErr) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: rCount } = await (admin as any)
        .from('execution_entity')
        .update({ status: 'error', finished: true, stoppedAt: now }, { count: 'exact' })
        .eq('status', 'running')
        .lt('startedAt', fiveMinutesAgo)
      unblockedRunning = rCount ?? 0

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: nCount } = await (admin as any)
        .from('execution_entity')
        .update({ status: 'error', finished: true, stoppedAt: now }, { count: 'exact' })
        .eq('finished', false)
        .lt('createdAt', fiveMinutesAgo)
      unblockedNew = nCount ?? 0

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: deleted } = await (admin as any)
        .from('execution_entity')
        .delete()
        .lt('createdAt', threeDaysAgo)
        .select('id')
      purged = deleted?.length ?? 0
    }
  } catch {
    // Best-effort : n8n v2.44.5 gère nativement son stockage via EXECUTIONS_DATA_PRUNE=true
  }

  const message = health.ok
    ? `n8n actif (${health.latencyMs}ms)${health.wokenUp ? ' — réveillé avec succès' : ''}`
    : `Attention : ${health.message}`

  if (unblockedRunning > 0 || unblockedNew > 0 || purged > 0) {
    // eslint-disable-next-line no-console
    console.log(`[n8n-watchdog] Unblocked: ${unblockedRunning} running, ${unblockedNew} new. Purged: ${purged} old records.`)
  }

  return {
    unblockedRunning,
    unblockedNew,
    purged,
    n8nHealthy: health.ok,
    latencyMs: health.latencyMs,
    message,
  }
}

export async function runLocauxDedup(): Promise<DedupResult> {
  // Purge préventive des exécutions n8n zombies (> 10 min) pour ne jamais bloquer le scraping
  await cleanZombieN8nExecutions()

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
