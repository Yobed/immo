export type PropertyOperation = 'sale' | 'rent';

export type PropertyType = 
  | 'villa' 
  | 'appartement' 
  | 'penthouse' 
  | 'terrain' 
  | 'bureau' 
  | 'immeuble';

export type PropertyStatus = 
  | 'available' 
  | 'under_offer' 
  | 'under_contract' 
  | 'sold' 
  | 'rented'
  | 'cleaning'      // En cours de nettoyage par conciergerie
  | 'maintenance'   // Maintenance technique requise
  | 'reserved';     // Réservé pour visite imminente

export type ConciergeCheckStatus = 
  | 'ready'          // Prêt / Conforme 100%
  | 'cleaning'       // Nettoyage en cours
  | 'maintenance'    // Maintenance requise
  | 'occupied'       // Occupé par locataire / client
  | 'reserved';      // Réservé / Visite VIP imminente

export type CleaningGrade = 'impeccable' | 'satisfaisant' | 'a_revoir';

export interface ConciergeChecklist {
  cleaning: boolean;         // Ménage sols & vitres
  linen: boolean;            // Linge & Literie prestige
  ac_electricity: boolean;   // Climatisation & groupe électrogène
  plumbing: boolean;         // Pression d'eau & chauffe-eau
  keys_security: boolean;    // Pass magnétique & coffre-fort
  welcome_kit: boolean;      // Bouteille d'eau, kit d'accueil VIP
}

export interface ZoneInspectionDetail {
  id: string;
  name: string; // ex: 'Salon & Réception', 'Suites & Chambres', etc.
  status: 'ok' | 'issue' | 'recheck';
  comment?: string;
  photos?: string[];
}

export interface ConciergeInspection {
  id: string;
  property_id: string;
  property_title: string;
  property_reference: string;
  inspector_name: string;
  inspector_phone: string;
  inspector_role: string;
  timestamp: string;
  started_at?: string;      // Horodatage précis de démarrage du check
  completed_at?: string;    // Horodatage précis de fin
  duration_minutes?: number; // Durée de l'intervention en minutes
  check_status: ConciergeCheckStatus;
  availability_status: PropertyStatus;
  cleaning_grade: CleaningGrade;
  checklist: ConciergeChecklist;
  zone_details?: ZoneInspectionDetail[];
  notes?: string;
  issues?: string[];
  photos?: string[];
  signature?: string;
}

export type LegalStatus = 
  | 'ACD' // Arrêté de Concession Définitive (le plus sécurisé en CI)
  | 'TF'  // Titre Foncier
  | 'CMP' // Certificat de Mutation Propriétaire
  | 'Approbation' // Approbation Ministérielle (lotissement)
  | 'En cours';

export interface Property {
  id: string;
  title: string;
  slug: string;
  reference: string;
  description: string;
  operation: PropertyOperation;
  property_type: PropertyType;
  status: PropertyStatus;
  price: number;
  currency: 'FCFA';
  city: string; // ex: Abidjan, Assinie, Grand-Bassam, Yamoussoukro
  district: string; // ex: Cocody Riviera Golf, Marcory Zone 4, Plateau, Cocody Ambassades
  address?: string;
  surface: number; // m²
  bedrooms: number;
  bathrooms: number;
  has_pool: boolean;
  has_generator: boolean; // Très valorisé en Côte d'Ivoire
  has_security: boolean;
  has_parking: boolean;
  legal_status: LegalStatus;
  featured: boolean;
  images: string[];
  flipbook_url?: string; // Lien de la plaquette de vente feuilletable Heyzine (Flipbook interactif)
  owner_name?: string;
  owner_phone?: string;
  concierge_status?: ConciergeCheckStatus;
  last_inspection_date?: string;
  last_inspection_started_at?: string;
  last_inspection_duration?: number;
  last_inspection_photos?: string[];
  last_inspector_name?: string;
  inspection_notes?: string;
  cleaning_grade?: CleaningGrade;
  checklist?: ConciergeChecklist;
  created_at: string;
  updated_at?: string;
}

export type LeadScore = 'hot' | 'warm' | 'cold';
export type ContactType = 'buyer' | 'tenant' | 'owner' | 'investor';
export type LeaseStatus = 'candidate' | 'active_tenant' | 'former_tenant' | 'archived';

export interface WhatsAppMessage {
  id: string;
  sender: 'client' | 'agent' | 'system';
  sender_name: string;
  timestamp: string;
  text: string;
  media_type?: 'document' | 'audio' | 'image' | 'property_card';
  media_label?: string;
  media_url?: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface ProspectObjection {
  id: string;
  category: 'foncier' | 'prix' | 'sequestre' | 'delai' | 'technique' | 'juridique';
  objection: string;
  client_statement: string;
  recommended_response: string;
  proof_document: string;
  status: 'resolved' | 'pending' | 'in_discussion';
}

export interface Contact {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  type: ContactType;
  lead_score: LeadScore;
  budget_min?: number;
  budget_max?: number;
  preferred_districts: string[];
  preferred_types: PropertyType[];
  notes?: string;
  last_interaction?: string;
  source: 'whatsapp' | 'website' | 'call' | 'referral';
  created_at: string;
  // Enrichissement Qualification & Intelligence Commerciale
  qualification_score?: number; // 0-100%
  financial_readiness?: string; // ex: 'Fonds propres certifiés BOA', 'Ligne NSIA Banque'
  kyc_status?: 'valid' | 'pending' | 'to_review';
  timeline?: 'immediate' | '1_month' | '3_months' | 'undecided';
  lease_status?: LeaseStatus;
  contract_signature_date?: string;
  lease_end_date?: string;
  profession?: string;
  residence_country?: string;
  key_interests?: string[];
  objections?: ProspectObjection[];
  whatsapp_history?: WhatsAppMessage[];
}

export type VisitStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export interface Visit {
  id: string;
  property_id: string;
  contact_id: string;
  scheduled_at: string;
  status: VisitStatus;
  visit_type?: 'first' | 'counter' | 'inventory';
  feedback?: string;
  agent_name: string;
  created_at: string;
  // Joins optionnels
  property?: Property;
  contact?: Contact;
}

export type DealStage = 
  | 'new_lead' 
  | 'qualified' 
  | 'visit_scheduled' 
  | 'offer_made' 
  | 'under_contract' 
  | 'closed_won' 
  | 'closed_lost';

export interface Deal {
  id: string;
  property_id: string;
  contact_id: string;
  title: string;
  stage: DealStage;
  deal_value: number;
  commission_expected: number;
  expected_closing_date?: string;
  notes?: string;
  created_at: string;
  property?: Property;
  contact?: Contact;
}

export interface MatchingResult {
  contact: Contact;
  matched_properties: {
    property: Property;
    score: number; // 0-100%
    reasons: string[];
  }[];
}
