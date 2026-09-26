import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { parseSearchQuery } from '@/lib/searchParser'
import { isListingOrPartnerOffer, isBrokerBroadcastSearch, QUALIF_REMINDER_MARKER } from '@/lib/ai/qualification'

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
  'angrée', 'angré', 'angre', 'belle ville', 'belleville', 'aboboté', 'abobote',
  'riviera golf', 'riviera 2', 'riviera 3', 'riviera 4', 'riviera palmeraie', 'riviera bonoumin',
  'riviera faya', 'riviera', 'bonoumin', 'palmeraie', 'deux plateaux', 'deux plateau', '2 plateaux', '2 plateau',
  'vallon', 'cocovico', 'synacass', 'djorobité', 'djorobite', 'akouédo', 'akouedo',
  'danga', 'aghien', 'anono', 'golf', 'golfe', 'm\'badon', 'mbadon', 'mpouto', 'm\'pouto',
  'zone 4', 'biétry', 'bietry', 'anoumabo', 'remblais', 'sogephia',
  'niangon', 'selmer', 'toits rouges', 'toit rouge', 'maroc', 'anador', 'sopim',
  'ananeraie', 'sideci', 'banco', 'gesco', 'azito', 'wassakara', 'andokoi',
  'kouté', 'koute', 'millionnaire', 'koweit', 'koweït', 'nouveau bureau', 'cite ado', 'cité ado',
  'vridi', 'gonzagueville', 'abatta', 'jules verne', 'bonoua', 'faya',
  'bracodi', 'williamsville', 'paillet', 'sicogi', 'ficgayo', 'lokoua', 'attoban', 'château', 'chateau',
  'dokui', 'gestoci', 'mahou', '7e tranche', '8e tranche', '9e tranche',
  'pk18', 'pk 18', 'avocatier', 'ndotre', 'n\'dotré', 'ndotré', 'akeikoi', 'akéikoi',
]

const QUARTIER_TO_COMMUNE: Record<string, string> = {
  angrée: 'Cocody', angré: 'Cocody', angre: 'Cocody',
  'belle ville': 'Cocody', belleville: 'Cocody',
  aboboté: 'Cocody', abobote: 'Cocody',
  'riviera golf': 'Cocody', 'riviera 2': 'Cocody', 'riviera 3': 'Cocody', 'riviera 4': 'Cocody',
  'riviera palmeraie': 'Cocody', 'riviera bonoumin': 'Cocody', 'riviera faya': 'Cocody',
  riviera: 'Cocody', bonoumin: 'Cocody', palmeraie: 'Cocody',
  'deux plateaux': 'Cocody', 'deux plateau': 'Cocody', '2 plateaux': 'Cocody', '2 plateau': 'Cocody',
  vallon: 'Cocody', cocovico: 'Cocody', synacass: 'Cocody',
  djorobité: 'Cocody', djorobite: 'Cocody', akouédo: 'Cocody', akouedo: 'Cocody',
  danga: 'Cocody', aghien: 'Cocody', anono: 'Cocody', golf: 'Cocody', golfe: 'Cocody',
  'm\'badon': 'Cocody', mbadon: 'Cocody', mpouto: 'Cocody', 'm\'pouto': 'Cocody',
  faya: 'Cocody', attoban: 'Cocody',
  château: 'Cocody', chateau: 'Cocody',
  dokui: 'Cocody', gestoci: 'Cocody', mahou: 'Cocody',
  '7e tranche': 'Cocody', '8e tranche': 'Cocody', '9e tranche': 'Cocody',
  'zone 4': 'Marcory', biétry: 'Marcory', bietry: 'Marcory', anoumabo: 'Marcory',
  remblais: 'Koumassi', sogephia: 'Koumassi',
  niangon: 'Yopougon', selmer: 'Yopougon', 'toits rouges': 'Yopougon', 'toit rouge': 'Yopougon',
  maroc: 'Yopougon', anador: 'Yopougon', sopim: 'Yopougon', ananeraie: 'Yopougon',
  sideci: 'Yopougon', banco: 'Yopougon', gesco: 'Yopougon', azito: 'Yopougon',
  wassakara: 'Yopougon', andokoi: 'Yopougon', kouté: 'Yopougon', koute: 'Yopougon',
  millionnaire: 'Yopougon', koweit: 'Yopougon', koweït: 'Yopougon', 'nouveau bureau': 'Yopougon',
  'cite ado': 'Yopougon', 'cité ado': 'Yopougon',
  sicogi: 'Yopougon', ficgayo: 'Yopougon', lokoua: 'Yopougon',
  vridi: 'Port-Bouët', gonzagueville: 'Port-Bouët',
  abatta: 'Bingerville', 'jules verne': 'Bingerville',
  bracodi: 'Adjamé', williamsville: 'Adjamé', paillet: 'Adjamé',
  pk18: 'Abobo', 'pk 18': 'Abobo', avocatier: 'Abobo',
  ndotre: 'Abobo', 'n\'dotré': 'Abobo', ndotré: 'Abobo', akeikoi: 'Abobo', akéikoi: 'Abobo',
}

function detectQuartier(text: string): { quartier: string | null; commune: string | null } {
  const t = text.toLowerCase()
  for (const q of QUARTIERS) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(?:^|[^a-z0-9éèêëàâîïôùûç])(${escaped})(?:$|[^a-z0-9éèêëàâîïôùûç])`, 'i')
    if (re.test(t)) {
      const normalizedLabel =
        q === 'angrée' || q === 'angre' ? 'Angré'
        : q === 'belleville' ? 'Belle ville'
        : q === 'abobote' ? 'Aboboté'
        : q === 'toit rouge' ? 'Toits rouges'
        : q === 'koweit' ? 'Koweït'
        : q === '2 plateau' ? '2 plateaux'
        : q === 'deux plateau' ? 'Deux plateaux'
        : q.charAt(0).toUpperCase() + q.slice(1)
      return { quartier: normalizedLabel, commune: QUARTIER_TO_COMMUNE[q] ?? null }
    }
  }
  return { quartier: null, commune: null }
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

export async function captureProspect(args: CaptureArgs): Promise<string | null> {
  const { phone, jid, nom, message, history } = args
  if (!phone) return null
  if (jid && jid.endsWith('@g.us')) return null // ne jamais enregistrer un groupe WhatsApp comme prospect
  const canonical = canonicalPhone(phone)
  if (canonical.length < 8 || canonical.length > 15 || canonical.startsWith('120363')) return null // numéro inexploitable ou ID de groupe

  const isReplyingToQualif = (history ?? []).slice(-2).some(
    (m) =>
      m.role === 'assistant' &&
      (m.content.includes('Bienvenue chez Bogbe') || QUALIF_REMINDER_MARKER.test(m.content)),
  )

  // Règle stricte : un agent immobilier / propriétaire qui publie ou propose un bien
  // ne doit JAMAIS apparaître dans la liste des prospects s'il ne cherche pas de bien.
  if (isListingOrPartnerOffer(message, isReplyingToQualif)) {
    return null
  }

  const p = parseSearchQuery(message)
  const qInfo = detectQuartier(message)
  const found = {
    type_bien: p.type_bien || null,
    commune: p.commune || qInfo.commune || null,
    quartier: qInfo.quartier,
    budget: p.prix_max ? parseInt(p.prix_max, 10) : null,
    date_souhaitee: detectTimeframe(message),
  }
  const hasSignal = !!(found.type_bien || found.commune || found.quartier || found.budget != null)
  const declaredName = detectDeclaredName(message, history)

  const sb = getClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (sb as any)
    .from('prospects')
    .select('id, phone, source_detail')
    .eq('phone', canonical)
    .is('merged_into', null)
    .maybeSingle()

  // Pas de fiche pour un simple « Bonjour » ou un clic de pub : on ne crée la
  // fiche que quand le prospect exprime un VRAI besoin (type/commune/budget).
  // Une fiche déjà existante s'enrichit sur tous les messages (ex. date seule).
  if (!existing && !hasSignal) return null

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

  // Détection automatique d'un agent immobilier en recherche pour son client (Demandeur B2B)
  const isAgentSearchingForClient =
    isBrokerBroadcastSearch(message) ||
    /\b(mon client|mes clients|notre client|mandant|confr[èe]re|cabinet|d[ée]marcheur|demarcheur|interm[ée]diaire|apporteur|pour un client|pour mon client|cherche pour client)\b/i.test(
      message,
    )
  if (isAgentSearchingForClient && existing?.source_detail !== 'prospect') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (sb as any).from('prospects').update({ source_detail: 'agent' }).eq('phone', canonical)
  }

  const { data: linked } = await (sb as any)
    .from('prospects')
    .select('id')
    .eq('phone', canonical)
    .is('merged_into', null)
    .order('last_seen', { ascending: false })
    .limit(1)
    .maybeSingle()
  return linked?.id ?? existing?.id ?? null
}
