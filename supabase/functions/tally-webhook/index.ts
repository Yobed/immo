// supabase/functions/tally-webhook/index.ts
// Remplace le pipeline n8n Tally Forms → Supabase

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''
const WASENDER_TOKEN = Deno.env.get('WASENDER_TOKEN') || ''
const ADMIN_WHATSAPP = Deno.env.get('ADMIN_WHATSAPP') || '2250789263373'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, tally-signature',
}

// --- Helpers ---

interface TallyField {
  key: string
  label: string
  type: string
  value: unknown
}

function findField(fields: TallyField[], ...keywords: string[]): string {
  for (const kw of keywords) {
    const f = fields.find(f =>
      f.label?.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(
        kw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      )
    )
    if (f && f.value !== null && f.value !== undefined) {
      if (Array.isArray(f.value)) return f.value.join(', ')
      return String(f.value)
    }
  }
  return ''
}

function findChoiceField(fields: TallyField[], ...keywords: string[]): string {
  for (const kw of keywords) {
    const f = fields.find(f =>
      f.label?.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(
        kw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      )
    )
    if (!f) continue
    // Tally MULTIPLE_CHOICE / DROPDOWN values can be string or array
    if (Array.isArray(f.value)) return f.value[0] || ''
    if (typeof f.value === 'object' && f.value !== null) {
      const v = f.value as Record<string, unknown>
      return String(v.value || v.label || v.id || '')
    }
    return String(f.value || '')
  }
  return ''
}

function toInt(val: string): number | null {
  const n = parseInt(val.replace(/\D/g, ''))
  return isNaN(n) ? null : n
}

function toFloat(val: string): number | null {
  const n = parseFloat(val.replace(/[^\d.]/g, ''))
  return isNaN(n) ? null : n
}

// --- AI formatting ---

async function formatWithAI(record: Record<string, unknown>): Promise<{ titre: string; annonce: string; tags: string }> {
  if (!OPENAI_API_KEY) return { titre: '', annonce: '', tags: '' }

  const prompt = `Tu es expert immobilier en Côte d'Ivoire. Génère en JSON un titre accrocheur, une annonce formatée WhatsApp et des tags pour ce bien.

Bien: ${record.type_bien} à ${record.type_operation}
Commune: ${record.commune} - Quartier: ${record.quartier}
Prix: ${record.prix ? Number(record.prix).toLocaleString('fr-FR') + ' FCFA' : 'NC'}
Pièces: ${record.nb_chambres || '?'} chambres, Surface: ${record.surface_m2 || '?'}m²
Équipements: ${record.equipements || 'NC'}
Description: ${record.description || ''}

JSON attendu: { "titre_annonce": "...", "annonce_formatee": "...", "tags": "..." }`

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 600,
      }),
    })
    const data = await resp.json()
    const parsed = JSON.parse(data.choices[0].message.content)
    return {
      titre: parsed.titre_annonce || '',
      annonce: parsed.annonce_formatee || '',
      tags: parsed.tags || '',
    }
  } catch (e) {
    console.error('AI formatting failed:', e)
    return { titre: '', annonce: '', tags: '' }
  }
}

// --- WhatsApp notification ---

async function notifyAdmin(record: Record<string, unknown>): Promise<void> {
  if (!WASENDER_TOKEN || !ADMIN_WHATSAPP) return

  const msg = `🏠 *Nouveau bien déposé via Tally*

📋 Ref: ${record.titre_annonce || 'En attente'}
👤 ${record.type_deposant === 'agence' ? '🏢 Agence: ' + record.nom_agence : '👤 ' + record.nom_complet}
📱 ${record.contact_principal || record.whatsapp1}
🏡 ${record.type_bien} - ${record.type_operation}
📍 ${record.commune} / ${record.quartier}
💰 ${record.prix ? Number(record.prix).toLocaleString('fr-FR') + ' FCFA' : 'NC'}
📸 ${record.nb_photos || 0} photo(s)

Statut: ⏳ En attente de validation`

  try {
    await fetch('https://www.wasenderapi.com/api/send-message', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WASENDER_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: ADMIN_WHATSAPP, text: msg }),
    })
  } catch (e) {
    console.error('WhatsApp notification failed:', e)
  }
}

// --- Main handler ---

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders })
  }

  // Accept Tally webhook or direct POST
  const eventType = payload.eventType as string
  if (eventType && eventType !== 'FORM_RESPONSE') {
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const data = (payload.data || payload) as Record<string, unknown>
  const fields = (data.fields || []) as TallyField[]

  // --- Map Tally fields → DB columns ---
  const photoFields = fields.filter(f =>
    f.type === 'FILE_UPLOAD' ||
    f.label?.toLowerCase().includes('photo') ||
    f.label?.toLowerCase().includes('image')
  )

  const photoUrls: string[] = []
  for (const pf of photoFields) {
    const vals = Array.isArray(pf.value) ? pf.value : [pf.value]
    for (const v of vals) {
      if (!v) continue
      const url = typeof v === 'object' ? (v as Record<string, string>).url || '' : String(v)
      if (url) photoUrls.push(url)
    }
  }

  const record: Record<string, unknown> = {
    tally_response_id: data.responseId || data.submissionId || crypto.randomUUID(),
    form_id: data.formId || '',
    submitted_at: data.createdAt || new Date().toISOString(),
    source: 'tally',
    statut_publication: 'en_attente',

    // Identité déposant
    type_deposant: findChoiceField(fields, 'vous êtes', 'type de deposant', 'deposant', 'proprietaire', 'agence'),
    nom_complet: findField(fields, 'nom complet', 'nom et prenom', 'votre nom', 'nom prenom'),
    nom_agence: findField(fields, 'nom agence', 'agence', 'nom de l\'agence'),
    contact_principal: findField(fields, 'contact principal', 'telephone', 'numero', 'phone'),
    whatsapp1: findField(fields, 'whatsapp', 'whatsapp 1', 'premier whatsapp'),
    whatsapp2: findField(fields, 'whatsapp 2', 'deuxieme whatsapp', 'second whatsapp'),
    email: findField(fields, 'email', 'mail', 'adresse mail'),
    ville_deposant: findField(fields, 'ville deposant', 'votre ville', 'ville du deposant'),

    // Bien
    type_bien: findChoiceField(fields, 'type de bien', 'type bien', 'nature du bien'),
    type_operation: findChoiceField(fields, 'type operation', 'vente ou location', 'louer ou vendre', 'transaction'),
    commune: findChoiceField(fields, 'commune', 'commune du bien'),
    quartier: findField(fields, 'quartier', 'localite', 'localisation'),
    adresse: findField(fields, 'adresse', 'adresse complete', 'localisation precise'),
    nb_pieces: toInt(findField(fields, 'pieces', 'nombre de pieces', 'nb pieces')),
    nb_chambres: toInt(findField(fields, 'chambres', 'nombre de chambres', 'nb chambres')),
    nb_sdb: toInt(findField(fields, 'salles de bain', 'sdb', 'douches')),
    surface_m2: toFloat(findField(fields, 'surface', 'superficie', 'surface m2', 'm²')),
    etage: findField(fields, 'etage', 'niveau'),
    equipements: findField(fields, 'equipements', 'equipement', 'caracteristiques', 'conforts'),
    prix: toInt(findField(fields, 'prix', 'loyer', 'montant', 'cout')),
    caution: findField(fields, 'caution', 'depot de garantie'),
    avance_loyer: findField(fields, 'avance', 'mois avance', 'avance loyer'),
    frais_agence: findField(fields, 'frais agence', 'honoraires', 'commission'),
    documents_disponibles: findField(fields, 'documents', 'titre foncier', 'papiers'),
    description: findField(fields, 'description', 'informations complementaires', 'details', 'remarques'),
    statut_bien: findChoiceField(fields, 'statut', 'disponibilite', 'etat du bien') || 'disponible',
    autorisation_publication: findChoiceField(fields, 'autorisation', 'accord publication', 'autoriser') || 'Oui',

    // Photos
    photo_url_1: photoUrls[0] || null,
    photo_url_2: photoUrls[1] || null,
    photo_url_3: photoUrls[2] || null,
    photo_url_4: photoUrls[3] || null,
    photo_url_5: photoUrls[4] || null,
    nb_photos: photoUrls.length,
  }

  // --- AI: titre + annonce formatée ---
  const ai = await formatWithAI(record)
  record.titre_annonce = ai.titre
  record.annonce_formatee = ai.annonce
  record.tags = ai.tags

  // --- Supabase INSERT ---
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { error } = await supabase
    .from('tally_responses')
    .upsert(record, { onConflict: 'tally_response_id' })

  if (error) {
    console.error('DB error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // --- Notification admin WhatsApp ---
  await notifyAdmin(record)

  return new Response(JSON.stringify({ success: true, ref: record.tally_response_id }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
