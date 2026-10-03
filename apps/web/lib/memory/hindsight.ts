import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { canonicalPhone } from '@/lib/prospects/capture'
import { fastLLMComplete } from '@/lib/ai'

export interface ProspectPreferences {
  budget_min: number | null
  budget_max: number | null
  transaction_type: 'location' | 'achat' | null
  property_types: string[]
  preferred_communes: string[]
  preferred_quartiers: string[]
  min_bedrooms: number | null
  required_amenities: string[]
  forbidden_criteria: string[]
}

export type DecisionStage =
  | 'discovery'
  | 'qualifying'
  | 'evaluating'
  | 'ready_to_visit'
  | 'negotiating'
  | 'closed_won'
  | 'closed_lost'

export interface ProspectMentalModel {
  id?: string
  entity_id: string
  prospect_id?: string | null
  summary: string
  preferences: ProspectPreferences
  objections: string[]
  decision_stage: DecisionStage
  confidence_score: number
  interaction_count: number
  last_interaction_at: string
  last_reflected_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface RetainEvent {
  entityId: string
  prospectId?: string | null
  channel: 'whatsapp' | 'web' | 'crm' | 'system'
  type: 'message' | 'property_view' | 'visit_request' | 'objection' | 'preference_stated' | 'feedback'
  content: string
  sentiment?: 'positive' | 'neutral' | 'negative' | 'objection'
  metadata?: Record<string, unknown>
}

export interface RecallResult {
  mentalModel: ProspectMentalModel | null
  promptContext: string
}

let _memoryClient: SupabaseClient | null = null
let _mainClient: SupabaseClient | null = null
let _freshClient: SupabaseClient | null = null
let _targetMode: 'main' | 'fresh' | 'custom' | null = null

function getMainClient(): SupabaseClient | null {
  if (_mainClient) return _mainClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  _mainClient = createClient(url, key.trim(), { auth: { persistSession: false, autoRefreshToken: false } })
  return _mainClient
}

function getFreshClient(): SupabaseClient | null {
  if (_freshClient) return _freshClient
  const freshKey = process.env.FRESH_LOCAUX_SERVICE_ROLE_KEY
  if (!freshKey) return null
  _freshClient = createClient(
    'https://fzccugmyoglemjwidqrl.supabase.co',
    freshKey.trim(),
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  return _freshClient
}

/**
 * Fournit le client Supabase pour la mémoire cognitive Hindsight avec détection et bascule automatique :
 * 1. Priorité absolue : Base Principale Core (Base 1 - tjvozbcnkimfgwonslzm).
 * 2. Si la migration n'y a pas encore été exécutée, bascule fluide sur Base FRESH (Base 2 - fzccugmyoglemjwidqrl).
 * 3. Dès que la migration est appliquée sur la Base 1, la bascule s'effectue sans aucune coupure.
 */
export async function getMemoryClient(): Promise<SupabaseClient> {
  // 1. Configuration explicite dédiée
  if (process.env.HINDSIGHT_SUPABASE_URL && process.env.HINDSIGHT_SERVICE_ROLE_KEY) {
    if (!_memoryClient) {
      _memoryClient = createClient(
        process.env.HINDSIGHT_SUPABASE_URL,
        process.env.HINDSIGHT_SERVICE_ROLE_KEY.trim(),
        { auth: { persistSession: false, autoRefreshToken: false } }
      )
    }
    return _memoryClient
  }

  const main = getMainClient()
  const fresh = getFreshClient()

  // 2. Si le mode a déjà été résolu avec succès
  if (_targetMode === 'main' && main) return main
  if (_targetMode === 'fresh' && fresh) return fresh

  // 3. Détection dynamique : Tester si la base principale (Base 1) possède les tables Hindsight
  if (main) {
    try {
      const { error } = await main.from('prospect_mental_models').select('id').limit(1)
      if (!error || error.code !== 'PGRST205') {
        _targetMode = 'main'
        return main
      }
    } catch {
      // Ignorer
    }
  }

  // 4. Repli sur Base 2 (FRESH) où les tables sont déjà actives
  if (fresh) {
    _targetMode = 'fresh'
    return fresh
  }

  if (main) return main
  throw new Error('Supabase service role non configuré (hindsight)')
}


/**
 * Normalise l'identifiant d'entité :
 * Si c'est un numéro de téléphone (WhatsApp), on applique la forme canonique (ex: 0748123456).
 * Si c'est un UUID ou email (Web), on normalise en minuscules sans espaces.
 */
export function normalizeEntityId(rawId: string): string {
  if (!rawId) return ''
  const trimmed = rawId.trim()
  // Détection numéro de téléphone
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length >= 8 && digits.length <= 15) {
    return canonicalPhone(trimmed)
  }
  return trimmed.toLowerCase()
}

/**
 * RECALL (Se remémorer) :
 * Récupère le modèle mental consolidé du prospect pour l'injecter dans le prompt de l'IA.
 * Si la table Hindsight n'existe pas encore ou est vide, se replie gracieusement sur
 * la table `prospects` existante.
 */
export async function recall(entityId: string): Promise<RecallResult> {
  const cleanId = normalizeEntityId(entityId)
  if (!cleanId) return { mentalModel: null, promptContext: '' }

  const memoryClient = await getMemoryClient()
  const mainClient = getMainClient()

  try {
    // 1. Recherche dans la mémoire biomimétique Hindsight
    const { data: mentalModel, error } = await memoryClient
      .from('prospect_mental_models')
      .select('*')
      .eq('entity_id', cleanId)
      .maybeSingle()

    if (!error && mentalModel && mentalModel.summary) {
      const prefs = mentalModel.preferences as ProspectPreferences
      const communes = prefs.preferred_communes?.length ? prefs.preferred_communes.join(', ') : 'Non restreinte'
      const quartiers = prefs.preferred_quartiers?.length ? ` (${prefs.preferred_quartiers.join(', ')})` : ''
      const types = prefs.property_types?.length ? prefs.property_types.join(', ') : 'Tout type'
      const budgetMax = prefs.budget_max ? `${Number(prefs.budget_max).toLocaleString('fr-FR')} FCFA` : 'Non précisé'
      const budgetMin = prefs.budget_min ? `${Number(prefs.budget_min).toLocaleString('fr-FR')} FCFA à ` : ''
      const objectionsStr = mentalModel.objections?.length ? mentalModel.objections.join(' ; ') : 'Aucune objection connue'

      const promptContext = [
        '== MÉMOIRE HINDSIGHT DU PROSPECT ==',
        `• Synthèse du profil : ${mentalModel.summary}`,
        `• Stade décisionnel : ${mentalModel.decision_stage}`,
        `• Recherche active : ${types} en ${prefs.transaction_type || 'recherche'}`,
        `• Localisation ciblée : ${communes}${quartiers}`,
        `• Budget : ${budgetMin}${budgetMax}`,
        `• Objections / Contraintes passées : ${objectionsStr}`,
        '• Consigne IA : Prends en compte ces critères passés. Ne redemande PAS les informations déjà connues.',
      ].join('\n')

      return {
        mentalModel: mentalModel as ProspectMentalModel,
        promptContext,
      }
    }
  } catch (err) {
    // Tolérance : si la table n'existe pas encore en DB, on continue silencieusement
    console.warn('[Hindsight] recall prospect_mental_models skipped (table not ready or error)', err)
  }

  // 2. Repli gracieux sur la table prospects classique si disponible
  try {
    const crmClient = mainClient || memoryClient
    const { data: prospect } = await crmClient
      .from('prospects')
      .select('id, nom, type_bien, commune, quartier, budget_max, date_souhaitee, derniere_intention')
      .eq('phone', cleanId)
      .maybeSingle()

    if (prospect) {
      const budget = prospect.budget_max ? `${Number(prospect.budget_max).toLocaleString('fr-FR')} FCFA` : 'Non précisé'
      const promptContext = [
        '== MÉMOIRE PROSPECT (HISTORIQUE BOGBE\'S) ==',
        prospect.nom ? `• Nom : ${prospect.nom}` : null,
        `• Type recherché : ${prospect.type_bien || 'Non précisé'}`,
        `• Localisation : ${prospect.commune || 'Abidjan'}${prospect.quartier ? ` (${prospect.quartier})` : ''}`,
        `• Budget max : ${budget}`,
        prospect.date_souhaitee ? `• Échéance : ${prospect.date_souhaitee}` : null,
      ].filter(Boolean).join('\n')

      return {
        mentalModel: null,
        promptContext,
      }
    }
  } catch {
    // Ignore fallback errors
  }

  return { mentalModel: null, promptContext: '' }
}

/**
 * RETAIN (Retenir) :
 * Enregistre une interaction, une vue de bien, une objection ou un message dans le journal d'expériences.
 */
export async function retain(event: RetainEvent): Promise<void> {
  const cleanId = normalizeEntityId(event.entityId)
  if (!cleanId) return

  const supabase = await getMemoryClient()

  try {
    // 1. Enregistrement dans prospect_experiences
    await supabase.from('prospect_experiences').insert({
      entity_id: cleanId,
      prospect_id: event.prospectId ?? null,
      channel: event.channel,
      type: event.type,
      content: event.content.slice(0, 2000),
      sentiment: event.sentiment ?? null,
      metadata: event.metadata ?? {},
    })

    // 2. Incrémenter l'interaction dans prospect_mental_models
    await supabase
      .from('prospect_mental_models')
      .upsert(
        {
          entity_id: cleanId,
          prospect_id: event.prospectId ?? null,
          interaction_count: 1,
          last_interaction_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'entity_id', ignoreDuplicates: false }
      )
  } catch (err) {
    // Ne bloque jamais la requête principale en cas d'erreur de journalisation
    console.warn('[Hindsight] retain event failed:', err)
  }
}

/**
 * REFLECT (Réfléchir & Consolider) :
 * Analyse en tâche d'arrière-plan les interactions récentes de l'entité,
 * synthétise ses préférences réelles et résout les contradictions pour forger
 * son Modèle Mental persistant.
 */
export async function reflect(entityId: string): Promise<ProspectMentalModel | null> {
  const cleanId = normalizeEntityId(entityId)
  if (!cleanId) return null

  const memoryClient = await getMemoryClient()
  const mainClient = getMainClient()

  try {
    // 1. Récupérer les expériences récentes
    const { data: experiences } = await memoryClient
      .from('prospect_experiences')
      .select('type, channel, content, sentiment, metadata, created_at')
      .eq('entity_id', cleanId)
      .order('created_at', { ascending: false })
      .limit(12)

    // Si aucune expérience enregistrée dans prospect_experiences, tenter de lire les messages whatsapp récents
    let interactionLog = ''
    if (experiences && experiences.length > 0) {
      interactionLog = experiences
        .reverse()
        .map((e) => `[${e.channel.toUpperCase()} - ${e.type}] ${e.content}`)
        .join('\n')
    } else {
      const waClient = mainClient || memoryClient
      const { data: waMessages } = await waClient
        .from('whatsapp_messages')
        .select('direction, body, created_at')
        .eq('jid', cleanId.includes('@') ? cleanId : `${cleanId}@s.whatsapp.net`)
        .order('created_at', { ascending: false })
        .limit(10)

      if (waMessages && waMessages.length > 0) {
        interactionLog = waMessages
          .reverse()
          .map((m) => `[${m.direction === 'inbound' ? 'CLIENT' : 'BOT'}] ${m.body}`)
          .join('\n')
      }
    }

    if (!interactionLog || interactionLog.length < 20) {
      return null
    }

    // 2. Récupérer l'état actuel du modèle mental
    const { data: currentModel } = await memoryClient
      .from('prospect_mental_models')
      .select('*')
      .eq('entity_id', cleanId)
      .maybeSingle()

    // 3. Appel de réflexion cognitive via LLM
    const reflectionPrompt = `Tu es le moteur cognitif d'analyse de prospects pour BOGBE'S GROUPE (immobilier de prestige à Abidjan).
Analyse l'historique d'interactions ci-dessous et produis la synthèse à jour du modèle mental du prospect.

Historique récent :
${interactionLog}

Modèle mental actuel (si existant) :
${currentModel?.summary ? currentModel.summary : 'Aucun modèle antérieur.'}

RÉPONDS UNIQUEMENT PAR UN OBJET JSON STRICT respectant cette structure exacte, sans markdown ni texte autour :
{
  "summary": "1 à 2 phrases percutantes résumant qui est le client, son profil, ce qu'il cherche et son urgence.",
  "preferences": {
    "budget_min": number_or_null,
    "budget_max": number_or_null,
    "transaction_type": "location" ou "achat" ou null,
    "property_types": ["appartement", "villa", "studio", etc.],
    "preferred_communes": ["Cocody", "Marcory", etc.],
    "preferred_quartiers": ["Riviera Golf", "Zone 4", etc.],
    "min_bedrooms": number_or_null,
    "required_amenities": ["piscine", "parking", "groupe", etc.],
    "forbidden_criteria": ["bruit", "pas de route bitumée", etc.]
  },
  "objections": ["tableau de chaînes listant les refus ou points de blocage exprimés"],
  "decision_stage": "discovery" ou "qualifying" ou "evaluating" ou "ready_to_visit" ou "negotiating" ou "closed_won" ou "closed_lost",
  "confidence_score": 0.85
}`

    const rawResponse = await fastLLMComplete(reflectionPrompt, 'Tu es un extracteur JSON analytique strict.')
    if (!rawResponse) return null

    // Nettoyage du JSON
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    const updatedModel: Partial<ProspectMentalModel> = {
      entity_id: cleanId,
      summary: parsed.summary || 'Prospect en recherche immobilière',
      preferences: {
        budget_min: parsed.preferences?.budget_min ?? null,
        budget_max: parsed.preferences?.budget_max ?? null,
        transaction_type: parsed.preferences?.transaction_type ?? null,
        property_types: Array.isArray(parsed.preferences?.property_types) ? parsed.preferences.property_types : [],
        preferred_communes: Array.isArray(parsed.preferences?.preferred_communes) ? parsed.preferences.preferred_communes : [],
        preferred_quartiers: Array.isArray(parsed.preferences?.preferred_quartiers) ? parsed.preferences.preferred_quartiers : [],
        min_bedrooms: parsed.preferences?.min_bedrooms ?? null,
        required_amenities: Array.isArray(parsed.preferences?.required_amenities) ? parsed.preferences.required_amenities : [],
        forbidden_criteria: Array.isArray(parsed.preferences?.forbidden_criteria) ? parsed.preferences.forbidden_criteria : [],
      },
      objections: Array.isArray(parsed.objections) ? parsed.objections : [],
      decision_stage: parsed.decision_stage || 'qualifying',
      confidence_score: typeof parsed.confidence_score === 'number' ? parsed.confidence_score : 0.8,
      last_reflected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // 4. Sauvegarde dans prospect_mental_models
    const { data: savedModel } = await memoryClient
      .from('prospect_mental_models')
      .upsert(updatedModel, { onConflict: 'entity_id' })
      .select('*')
      .single()

    // 5. Synchroniser avec la table prospects si présente
    const crmClient = mainClient || memoryClient
    if (parsed.preferences?.budget_max || parsed.preferences?.preferred_communes?.[0]) {
      await crmClient
        .from('prospects')
        .update({
          commune: parsed.preferences.preferred_communes?.[0] ?? undefined,
          budget_max: parsed.preferences.budget_max ?? undefined,
          type_bien: parsed.preferences.property_types?.[0] ?? undefined,
        })
        .eq('phone', cleanId)
    }

    return (savedModel as ProspectMentalModel) || null
  } catch (err) {
    console.error('[Hindsight] reflect failed:', err)
    return null
  }
}
