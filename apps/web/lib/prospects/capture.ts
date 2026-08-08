import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { parseSearchQuery } from '@/lib/searchParser'

/**
 * Capture prospect : à chaque message entrant d'un client (WhatsApp), on
 * enrichit une fiche prospect avec les infos comprises — numéro, nom, type,
 * commune, quartier, budget, date souhaitée. Fiche unique par numéro,
 * complétée au fil de la conversation (dernière valeur connue conservée).
 *
 * Écrit dans la table `prospects` (RLS sans policy → clé service uniquement).
 */

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role non configuré (prospects)')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

// Quartiers fréquents (best-effort) — complète le `commune` du parseur.
const QUARTIERS = [
  'angré', 'angre', 'riviera', 'bonoumin', 'palmeraie', 'deux plateaux', '2 plateaux',
  'vallon', 'cocovico', 'synacass', 'djorobité', 'akouédo', 'danga', 'zone 4', 'biétry',
  'bietry', 'anoumabo', 'niangon', 'selmer', 'toits rouges', 'vridi', 'gonzagueville',
  'abatta', 'bonoua', 'faya', 'bracodi', 'sicogi', 'ficgayo', 'lokoua', 'attoban',
]

function detectQuartier(text: string): string | null {
  const t = text.toLowerCase()
  for (const q of QUARTIERS) if (t.includes(q)) return q.charAt(0).toUpperCase() + q.slice(1)
  return null
}

/** Détecte une échéance d'acquisition/emménagement dans un message. */
export function detectTimeframe(text: string): string | null {
  const t = text.toLowerCase()
  if (/\b(tout de suite|imm[ée]diat|urgent|maintenant|d[eè]s que possible|asap|cette semaine|ce mois(-ci)?)\b/.test(t))
    return 'Immédiat / ce mois'
  const m = t.match(/\bdans\s+(\d{1,2})\s+(semaines?|mois|jours?)\b/)
  if (m) return `Dans ${m[1]} ${m[2]}`
  if (/\b(mois prochain|le mois prochain)\b/.test(t)) return 'Le mois prochain'
  const mois = t.match(/\b(janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[ûu]t|septembre|octobre|novembre|d[ée]cembre)\b/)
  if (mois) return mois[1].charAt(0).toUpperCase() + mois[1].slice(1)
  return null
}

interface CaptureArgs {
  phone: string
  jid?: string | null
  nom?: string | null
  message: string
  history?: { role: string; content: string }[]
}

/**
 * Enregistre/enrichit le prospect. Best-effort : ne jette jamais (le flux
 * WhatsApp ne doit pas échouer si la capture échoue).
 */
export async function captureProspect(args: CaptureArgs): Promise<void> {
  const { phone, jid, nom, message } = args
  if (!phone) return

  const p = parseSearchQuery(message)
  const found = {
    type_bien: p.type_bien || null,
    commune: p.commune || null,
    quartier: detectQuartier(message),
    budget: p.prix_max ? parseInt(p.prix_max, 10) : null,
    date_souhaitee: detectTimeframe(message),
  }

  const sb = getClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (sb as any)
    .from('prospects')
    .select('*')
    .eq('phone', phone)
    .maybeSingle()

  const nowIso = new Date().toISOString()
  const extrait = message.slice(0, 300)

  if (!existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (sb as any).from('prospects').insert({
      phone,
      jid: jid ?? null,
      nom: nom || null,
      ...found,
      dernier_message: extrait,
      first_seen: nowIso,
      last_seen: nowIso,
    })
    return
  }

  // Enrichissement : dernière valeur NON VIDE gagne ; on ne réécrit jamais une
  // info connue par un vide (un message sans budget n'efface pas le budget).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upd: Record<string, any> = {
    last_seen: nowIso,
    message_count: (existing.message_count ?? 1) + 1,
    dernier_message: extrait,
  }
  if (nom && !existing.nom) upd.nom = nom
  if (found.type_bien) upd.type_bien = found.type_bien
  if (found.commune) upd.commune = found.commune
  if (found.quartier) upd.quartier = found.quartier
  if (found.budget != null) upd.budget = found.budget
  if (found.date_souhaitee) upd.date_souhaitee = found.date_souhaitee

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (sb as any).from('prospects').update(upd).eq('phone', phone)
}
