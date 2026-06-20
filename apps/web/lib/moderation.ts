/**
 * Modération automatique des annonces — règles anti-spam, anti-doublon
 * et qualité minimale du contenu.
 *
 * Appelée côté serveur (createBien / updateBien) AVANT l'insert.
 * Retourne soit { ok: true } soit { ok: false, reason: '...' } qu'on
 * peut afficher à l'utilisateur.
 *
 * Politique : ces règles sont des GUARD-RAILS pour bloquer les annonces
 * manifestement spam ou douteuses. Elles ne remplacent pas la validation
 * admin (workflow brouillon → en_attente → publié) qui reste obligatoire.
 */

export interface ModerationInput {
  titre?: string | null
  description?: string | null
  type_bien?: string | null
  commune?: string | null
  prix_mois_fcfa?: number | null
  prix_nuit_fcfa?: number | null
  prix_vente_fcfa?: number | null
}

export interface ModerationResult {
  ok: boolean
  reason?: string
  warnings?: string[]
}

// Mots clés interdits — annonces frauduleuses, contenu illégal, etc.
const FORBIDDEN_TERMS = [
  'arnaque',
  'fake',
  'crypto investissement',
  'mlm',
  'pyramide',
  'gain rapide',
  'doubler votre argent',
  'libido',
  'massage',
  'escort',
]

// Patterns d'URLs suspects dans description (phishing, redirections externes)
const URL_REGEX = /https?:\/\/(?!(?:[a-z0-9-]+\.)?bogbes-?groupe\.vercel\.app)[a-z0-9.-]+/i

// Patterns de spam typiques
const SPAM_PATTERNS = [
  /[A-Z\s]{30,}/, // tout en majuscules sur 30+ caractères
  /(.)\1{10,}/, // 11+ fois le même caractère (ex: "!!!!!!!!!!")
  /\bcontactez\s+moi\s+sur\s+whatsapp\b/i, // contournement intermédiation
  /\b(?:\+?\d{2,3}[\s.-]*)?\d{2}[\s.-]*\d{2}[\s.-]*\d{2}[\s.-]*\d{2}[\s.-]*\d{2}\b/, // n° de téléphone
]

const MIN_TITLE_LENGTH = 8
const MIN_DESCRIPTION_LENGTH = 30
const MAX_TITLE_LENGTH = 150
const MAX_DESCRIPTION_LENGTH = 5000

/**
 * Vérifications synchrones (titre, description, contenu) — pas de DB.
 */
export function moderateBienContent(input: ModerationInput): ModerationResult {
  const warnings: string[] = []
  const titre = (input.titre || '').trim()
  const description = (input.description || '').trim()
  const fullText = `${titre}\n${description}`.toLowerCase()

  // 1. Validations minimales
  if (titre.length < MIN_TITLE_LENGTH) {
    return { ok: false, reason: `Titre trop court (minimum ${MIN_TITLE_LENGTH} caractères).` }
  }
  if (titre.length > MAX_TITLE_LENGTH) {
    return { ok: false, reason: `Titre trop long (maximum ${MAX_TITLE_LENGTH} caractères).` }
  }
  if (description.length < MIN_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      reason: `Description trop courte (minimum ${MIN_DESCRIPTION_LENGTH} caractères). Décrivez le bien, sa zone, ses atouts.`,
    }
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return { ok: false, reason: `Description trop longue (maximum ${MAX_DESCRIPTION_LENGTH} caractères).` }
  }

  // 2. Mots interdits
  for (const term of FORBIDDEN_TERMS) {
    if (fullText.includes(term)) {
      return {
        ok: false,
        reason: `Contenu non autorisé détecté : "${term}". Modifiez le texte de votre annonce.`,
      }
    }
  }

  // 3. Patterns spam
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(description) || pattern.test(titre)) {
      if (pattern.source.includes('telephone') || pattern.source.includes('whatsapp')) {
        return {
          ok: false,
          reason:
            'Numéro de téléphone ou mention WhatsApp détecté. Les contacts directs ne sont pas autorisés — l\'intermédiation passe par BOGBE\'S.',
        }
      }
      return {
        ok: false,
        reason: 'Format suspect détecté (trop de majuscules, caractères répétés…). Rédigez normalement votre annonce.',
      }
    }
  }

  // 4. URLs externes interdites
  if (URL_REGEX.test(description) || URL_REGEX.test(titre)) {
    return {
      ok: false,
      reason: 'Les liens externes ne sont pas autorisés dans les annonces.',
    }
  }

  // 5. Cohérence prix
  const hasPrice = !!(input.prix_mois_fcfa || input.prix_nuit_fcfa || input.prix_vente_fcfa)
  if (!hasPrice) {
    warnings.push('Aucun prix renseigné — l\'annonce affichera "Prix sur demande".')
  }

  // 6. Cohérence type meublé / prix nuit
  if (input.type_bien === 'residence_meublee' && !input.prix_nuit_fcfa) {
    warnings.push(
      'Résidence meublée sans prix /nuit : le prix /mois sera ignoré (règle métier).',
    )
  }

  // 7. Prix aberrants (sanity check)
  if (input.prix_mois_fcfa != null && input.prix_mois_fcfa < 10_000) {
    warnings.push('Prix /mois très bas (< 10 000 FCFA) — vérifiez votre saisie.')
  }
  if (input.prix_nuit_fcfa != null && input.prix_nuit_fcfa < 3_000) {
    warnings.push('Prix /nuit très bas (< 3 000 FCFA) — vérifiez votre saisie.')
  }
  if (input.prix_vente_fcfa != null && input.prix_vente_fcfa < 500_000) {
    warnings.push('Prix de vente très bas (< 500 000 FCFA) — vérifiez votre saisie.')
  }

  return { ok: true, warnings: warnings.length > 0 ? warnings : undefined }
}

/**
 * Détection de doublons par fingerprint approximatif.
 * Appelée côté serveur avec un Supabase client. Si on détecte un bien
 * trop similaire du MÊME proprio, on bloque (évite les annonces clonées).
 *
 * Stratégie : on cherche les biens du même proprio avec :
 *   - même commune
 *   - même type_bien
 *   - même nb_pieces (si renseigné)
 *   - prix similaire ±10%
 * Si match → block.
 */
export async function detectDuplicateBien(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  proprietaireId: string,
  input: ModerationInput & { nb_pieces?: number | null; excludeId?: string },
): Promise<ModerationResult> {
  const refPrix =
    input.prix_mois_fcfa ?? input.prix_nuit_fcfa ?? input.prix_vente_fcfa ?? null
  if (!input.commune || !input.type_bien || !refPrix) {
    return { ok: true } // pas assez de données pour fingerprint, on laisse passer
  }

  const prixMin = Math.floor(refPrix * 0.9)
  const prixMax = Math.ceil(refPrix * 1.1)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
    .from('biens')
    .select('id, titre')
    .eq('proprietaire_id', proprietaireId)
    .eq('commune', input.commune)
    .eq('type_bien', input.type_bien)
    .or(
      `and(prix_mois_fcfa.gte.${prixMin},prix_mois_fcfa.lte.${prixMax}),` +
        `and(prix_nuit_fcfa.gte.${prixMin},prix_nuit_fcfa.lte.${prixMax}),` +
        `and(prix_vente_fcfa.gte.${prixMin},prix_vente_fcfa.lte.${prixMax})`,
    )
    .not('statut', 'eq', 'archive')
    .limit(3)

  if (input.excludeId) q = q.neq('id', input.excludeId)
  if (input.nb_pieces != null) q = q.eq('nb_pieces', input.nb_pieces)

  const { data, error } = await q
  if (error || !data || data.length === 0) return { ok: true }

  // Doublon détecté
  return {
    ok: false,
    reason: `Vous avez déjà une annonce très similaire publiée : "${(data[0] as { titre: string }).titre}". Modifiez-la plutôt que d'en créer une nouvelle.`,
  }
}
