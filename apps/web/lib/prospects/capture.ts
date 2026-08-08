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

/**
 * Numéro canonique : évite les doublons dus au format (0748…, 2250748…,
 * +225 07 48…). On retire le 00 international et le 225 CI (uniquement si le
 * reste est un numéro local plausible) — un numéro étranger (+44…) reste intact.
 */
export function canonicalPhone(raw: string): string {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('225') && d.length - 3 >= 8 && d.length - 3 <= 10) d = d.slice(3)
  return d
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
  const canonical = canonicalPhone(phone)
  if (canonical.length < 8) return // numéro inexploitable

  const p = parseSearchQuery(message)
  const sb = getClient()

  // Upsert atomique côté DB (fonction upsert_prospect) : une seule ligne par
  // numéro normalisé, fusion « dernière valeur non vide gagne », pas de course.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (sb as any).rpc('upsert_prospect', {
    p_phone: canonical,
    p_jid: jid ?? null,
    p_nom: nom || null,
    p_type: p.type_bien || null,
    p_commune: p.commune || null,
    p_quartier: detectQuartier(message),
    p_budget: p.prix_max ? parseInt(p.prix_max, 10) : null,
    p_date: detectTimeframe(message),
    p_message: message.slice(0, 300),
  })
}
