import { Contact, ContactType, LeadScore, PropertyType, ProspectObjection, WhatsAppMessage } from './types';

export interface ExtractedWhatsAppEntities {
  fullName?: string;
  phone: string;
  type?: ContactType;
  budgetMin?: number;
  budgetMax?: number;
  preferredDistricts?: string[];
  preferredTypes?: PropertyType[];
  timeline?: 'immediate' | '1_month' | '3_months';
  leadScore: LeadScore;
  qualificationScore: number;
  keyInterests: string[];
  objectionsDetected: ProspectObjection[];
  visitRequest?: {
    requested: boolean;
    date?: string;
    time?: string;
    district?: string;
    propertyRef?: string;
    description?: string;
  };
  summary: string;
}

/**
 * MOTEUR D'EXTRACTION SÉMANTIQUE & QUALIFICATION IMMOBILIÈRE ABIDJAN
 * Analyse tout texte WhatsApp pour extraire les intentions, budgets, quartiers et objections.
 */
export function parseWhatsAppMessage(
  phone: string,
  rawMessage: string,
  pushName?: string,
  existingContact?: Contact
): ExtractedWhatsAppEntities {
  const text = rawMessage.trim();
  const lower = text.toLowerCase();

  // 1. Détection du type de client (Locataire / Propriétaire / Investisseur)
  let type: ContactType = existingContact?.type || 'tenant';
  if (lower.match(/\b(louer|location|bail|emménager|loyer|meublé|locataire)\b/)) {
    type = 'tenant';
  } else if (lower.match(/\b(confier|mettre en location|mon bien|ma villa|propriétaire|gestion locative|vendre mon bien)\b/)) {
    type = 'owner';
  } else if (lower.match(/\b(investir|rentabilité|acd vérifié|rendement|acheter terrain|placement)\b/)) {
    type = 'investor';
  }

  // 2. Extraction du Budget en FCFA (ex: "3,8M", "2 500 000 FCFA", "4 millions", "150 000 000")
  let budgetMax = existingContact?.budget_max;
  let budgetMin = existingContact?.budget_min;

  const budgetMillionsMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:m|million|millions)/i);
  const budgetFullMatch = text.match(/(\d{1,3}(?:[\s.]\d{3})+)\s*(?:fcfa|f cfa|cfa|f)?/i);

  if (budgetMillionsMatch) {
    const val = parseFloat(budgetMillionsMatch[1].replace(',', '.'));
    budgetMax = Math.round(val * 1_000_000);
    budgetMin = Math.round(budgetMax * 0.75);
  } else if (budgetFullMatch) {
    const cleaned = parseInt(budgetFullMatch[1].replace(/[\s.]/g, ''), 10);
    if (!isNaN(cleaned) && cleaned > 100_000) {
      budgetMax = cleaned;
      budgetMin = Math.round(budgetMax * 0.75);
    }
  }

  // 3. Extraction des Quartiers d'Abidjan
  const districtKeywords = [
    { name: 'Cocody Riviera Golf', regex: /\b(riviera golf|golf 4|golf)\b/i },
    { name: 'Riviera Beverly Hills', regex: /\b(beverly hills|beverly)\b/i },
    { name: 'Cocody Ambassades', regex: /\b(ambassade|ambassades|rue des ambassades)\b/i },
    { name: 'Cocody Danga', regex: /\b(danga)\b/i },
    { name: 'Plateau', regex: /\b(plateau|centre des affaires|boulevard de la république)\b/i },
    { name: 'Marcory Zone 4', regex: /\b(zone 4|zone quatre|marcory)\b/i },
    { name: 'Assinie', regex: /\b(assinie|bord de mer|plage)\b/i },
    { name: 'Bingerville', regex: /\b(bingerville)\b/i },
  ];

  const preferredDistricts: string[] = existingContact?.preferred_districts ? [...existingContact.preferred_districts] : [];
  districtKeywords.forEach(({ name, regex }) => {
    if (regex.test(lower) && !preferredDistricts.includes(name)) {
      preferredDistricts.push(name);
    }
  });

  // 4. Extraction de la Typologie de Bien
  const preferredTypes: PropertyType[] = existingContact?.preferred_types 
    ? [...existingContact.preferred_types] 
    : [];

  if (lower.includes('villa') && !preferredTypes.includes('villa')) preferredTypes.push('villa');
  if (lower.includes('penthouse') && !preferredTypes.includes('penthouse')) preferredTypes.push('penthouse');
  if ((lower.includes('appartement') || lower.includes('studio') || lower.includes('4 pièces')) && !preferredTypes.includes('appartement')) preferredTypes.push('appartement');
  if ((lower.includes('terrain') || lower.includes('parcelle') || lower.includes('lot')) && !preferredTypes.includes('terrain')) preferredTypes.push('terrain');

  if (preferredTypes.length === 0) {
    preferredTypes.push('villa');
  }

  // 5. Extraction de la Demande de Visite
  let visitRequested = false;
  let visitTime = '15:30';
  let visitDate = 'Lundi 9 Novembre 2026';

  if (lower.match(/\b(visite|visiter|rdv|rendez-vous|voir le bien|disponible pour visiter)\b/)) {
    visitRequested = true;
    
    // Extraction heure
    const timeMatch = text.match(/(\d{1,2})[hH:](\d{2})?/);
    if (timeMatch) {
      const h = timeMatch[1].padStart(2, '0');
      const m = timeMatch[2] ? timeMatch[2] : '00';
      visitTime = `${h}:${m}`;
    }

    // Extraction jour
    if (lower.includes('samedi')) visitDate = 'Samedi 14 Novembre 2026';
    else if (lower.includes('demain')) visitDate = 'Lundi 9 Novembre 2026';
    else if (lower.includes('aujourd\'hui')) visitDate = 'Aujourd\'hui 8 Novembre 2026';
    else if (lower.includes('mercredi')) visitDate = 'Mercredi 11 Novembre 2026';
  }

  // 6. Extraction des Intérêts clés / Tags
  const keyInterests: string[] = existingContact?.key_interests ? [...existingContact.key_interests] : [];
  const tagKeywords = [
    { tag: 'Bail Corporate', regex: /\b(corporate|société|siège|entreprise|multinationale)\b/i },
    { tag: 'Bail Diplomatique', regex: /\b(diplomatique|ambassade|chancellerie|consulat)\b/i },
    { tag: 'Séquestre Notarié', regex: /\b(séquestre|notaire|caution consignée)\b/i },
    { tag: 'Piscine 14m', regex: /\b(piscine|bassin)\b/i },
    { tag: 'Groupe Insonorisé 40 kVA', regex: /\b(groupe|groupe électrogène|insonorisé|coupure)\b/i },
    { tag: 'Meublé Haut Standing', regex: /\b(meublé|équipé|décoré)\b/i },
    { tag: 'Sécurité Cordon 24/7', regex: /\b(gardien|sécurité|gardiennage|vidéosurveillance)\b/i },
    { tag: 'Fibre Optique Dédiée', regex: /\b(fibre|internet|débit|wifi)\b/i }
  ];

  tagKeywords.forEach(({ tag, regex }) => {
    if (regex.test(lower) && !keyInterests.includes(tag)) {
      keyInterests.push(tag);
    }
  });

  // 7. Détection d'Objections & Craintes juridiques
  const objectionsDetected: ProspectObjection[] = existingContact?.objections ? [...existingContact.objections] : [];

  if (lower.match(/\b(caution|restitution|dépôt de garantie|rendre la caution)\b/) && !objectionsDetected.some(o => o.category === 'sequestre')) {
    objectionsDetected.push({
      id: `obj-wa-${Date.now()}-1`,
      category: 'sequestre',
      objection: 'Garantie de restitution intégrale de la caution locative',
      client_statement: text,
      recommended_response: 'La caution de 2 mois est consignée sous séquestre notarié (Me Bamba). L\'état des lieux contradictoire dressé par commissaire de justice garantit la restitution sous 15 jours.',
      proof_document: 'Protocole de Séquestre Notarié & État des Lieux Numérique Huissier',
      status: 'resolved'
    });
  }

  if (lower.match(/\b(groupe|panne|électricité|cie|entretien groupe)\b/) && !objectionsDetected.some(o => o.category === 'technique')) {
    objectionsDetected.push({
      id: `obj-wa-${Date.now()}-2`,
      category: 'technique',
      objection: 'Continuité électrique et entretien du groupe électrogène',
      client_statement: text,
      recommended_response: 'La résidence dispose d\'un contrat de maintenance trimestriel tout compris avec inverseur automatique instantané sous 10 secondes.',
      proof_document: 'Contrat de maintenance préventive et certificat de charge',
      status: 'resolved'
    });
  }

  if (lower.match(/\b(préavis|mutation|rappel de mission|clause diplomatique)\b/) && !objectionsDetected.some(o => o.category === 'juridique')) {
    objectionsDetected.push({
      id: `obj-wa-${Date.now()}-3`,
      category: 'juridique',
      objection: 'Clause de résiliation anticipée pour rappel de mission diplomatique ou corporate',
      client_statement: text,
      recommended_response: 'Notre contrat type intègre la clause diplomatique officielle avec préavis réduit à 1 mois en cas de rappel de mission justifié.',
      proof_document: 'Bail Type Corporate & Clause Diplomatique Validée CIMA',
      status: 'resolved'
    });
  }

  // 8. Calcul du Score de Qualification & Lead Score
  let score = 50; // base
  if (budgetMax && budgetMax > 0) score += 20;
  if (preferredDistricts.length > 0) score += 10;
  if (preferredTypes.length > 0) score += 10;
  if (visitRequested) score += 10;
  score = Math.min(score, 98);

  const leadScore: LeadScore = visitRequested || (budgetMax && budgetMax >= 2_500_000) ? 'hot' : score >= 70 ? 'warm' : 'cold';

  // 9. Synthèse d'analyse IA
  const summary = visitRequested
    ? `Demande de visite formulée pour ${visitDate} à ${visitTime}. Budget qualifié : ${budgetMax ? (budgetMax / 1_000_000).toFixed(1) + 'M FCFA' : 'À préciser'}. Secteur : ${preferredDistricts.join(', ') || 'Abidjan'}.`
    : `Échange d'intérêt pour ${preferredTypes.join('/')} à ${preferredDistricts.join(', ') || 'Abidjan'}. Intérêts : ${keyInterests.slice(0, 3).join(', ')}.`;

  return {
    fullName: pushName || existingContact?.full_name,
    phone,
    type,
    budgetMin,
    budgetMax,
    preferredDistricts: preferredDistricts.length > 0 ? preferredDistricts : ['Cocody Riviera Golf'],
    preferredTypes,
    timeline: lower.includes('immédiat') || lower.includes('urgence') ? 'immediate' : '1_month',
    leadScore,
    qualificationScore: score,
    keyInterests: keyInterests.length > 0 ? keyInterests : ['Bail Sécurisé', 'Séquestre Notarié'],
    objectionsDetected,
    visitRequest: visitRequested ? {
      requested: true,
      date: visitDate,
      time: visitTime,
      district: preferredDistricts[0] || 'Cocody Riviera Golf',
      description: `Visite locative sollicitée sur WhatsApp par ${pushName || phone}`
    } : undefined,
    summary
  };
}
