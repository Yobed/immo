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
/** Nom déclaré : quand Sapphire vient de demander le nom et que la réponse
 *  ressemble à un nom (court, sans chiffre). Prioritaire sur le pseudo WhatsApp. */
function detectDeclaredName(message: string, history?: { role: string; content: string }[]): string | null {
  const lastAssistant = [...(history ?? [])].reverse().find((m) => m.role === 'assistant')
  if (!lastAssistant || !/votre nom|puis-je avoir votre nom|comment vous appelez/i.test(lastAssistant.content)) return null
  const cleaned = message
    .trim()
    .replace(/^(bonjour|bonsoir|salut)[\s,!.]*/i, '')
    .replace(/^(je m'?appelle|moi c'?est|c'?est|mon nom (c'?est|est)|je suis)\s+/i, '')
    .trim()
  if (cleaned.length < 2 || cleaned.length > 40) return null
  if (/\d/.test(cleaned) || cleaned.split(/\s+/).length > 4) return null
  // exclut les phrases (contiennent un verbe/critère immo courant)
  if (/cherch|voudrais|appartement|villa|studio|maison|terrain|budget|louer|acheter|commune/i.test(cleaned)) return null
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

export async function captureProspect(args: CaptureArgs): Promise<void> {
  const { phone, jid, nom, message, history } = args
  if (!phone) return
  const canonical = canonicalPhone(phone)
  if (canonical.length < 8) return // numéro inexploitable

  const p = parseSearchQuery(message)
  const found = {
    type_bien: p.type_bien || null,
    commune: p.commune || null,
    quartier: detectQuartier(message),
    budget: p.prix_max ? parseInt(p.prix_max, 10) : null,
    date_souhaitee: detectTimeframe(message),
  }
  const hasSignal = !!(found.type_bien || found.commune || found.budget != null)
  const declaredName = detectDeclaredName(message, history)

  const sb = getClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (sb as any)
    .from('prospects')
    .select('phone')
    .eq('phone', canonical)
    .maybeSingle()

  // Pas de fiche pour un simple « Bonjour » ou un clic de pub : on ne crée la
  // fiche que quand le prospect exprime un VRAI besoin (type/commune/budget).
  // Une fiche déjà existante s'enrichit sur tous les messages (ex. date seule).
  if (!existing && !hasSignal) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (sb as any).rpc('upsert_prospect', {
    p_phone: canonical,
    p_jid: jid ?? null,
    p_nom: nom || null,
    p_type: found.type_bien,
    p_commune: found.commune,
    p_quartier: found.quartier,
    p_budget: found.budget,
    p_date: found.date_souhaitee,
    p_message: message.slice(0, 300),
  })

  // Nom déclaré → écrase le pseudo WhatsApp.
  if (declaredName) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (sb as any).from('prospects').update({ nom: declaredName }).eq('phone', canonical)
  }
}
