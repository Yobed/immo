import { Property, Contact, Visit, Deal } from './types';

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-001',
    title: 'Villa Duplex Contemporaine Meublée avec Piscine & Vue Lagune',
    slug: 'villa-duplex-cocody-riviera-golf',
    reference: 'VIL-RG-2026',
    description: 'Somptueuse villa d\'architecte meublée située au cœur de la Riviera Golf à Cocody. Prestations haut standing, salon avec double hauteur sous plafond, suite parentale panoramique avec dressing et salle de bain en travertin. Jardin paysager avec piscine à débordement et terrasse couverte. Groupe électrogène insonorisé 40 kVA et réserve d\'eau SODECI 5 000L. Idéale pour bail corporate ou mission diplomatique.',
    operation: 'rent',
    property_type: 'villa',
    status: 'available',
    price: 3800000, // FCFA / mois
    currency: 'FCFA',
    city: 'Abidjan',
    district: 'Cocody Riviera Golf',
    address: 'Riviera Golf 4, Proche Ambassade des USA',
    surface: 650,
    bedrooms: 5,
    bathrooms: 6,
    has_pool: true,
    has_generator: true,
    has_security: true,
    has_parking: true,
    legal_status: 'ACD',
    featured: true,
    flipbook_url: 'https://heyzine.com/flip-book/e12d59cb9e.html',
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85'
    ],
    owner_name: 'Dr. Kouamé',
    owner_phone: '+2250708091011',
    created_at: '2026-10-15T10:00:00Z',
  },
  {
    id: 'prop-002',
    title: 'Penthouse de Prestige Meublé avec Terrasse Panoramique & Jacuzzi',
    slug: 'penthouse-prestige-marcory-zone-4',
    reference: 'PNT-Z4-104',
    description: 'Rare penthouse au dernier étage d\'une résidence sécurisée de grand standing en Zone 4. Vue imprenable à 360° sur Abidjan et la lagune Ébrié. Immense pièce de vie baignée de lumière, cuisine haut de gamme entièrement équipée, ascenseur privatif à clé, jacuzzi sur terrasse extérieure. Deux places de parking en sous-sol. Syndic professionnel certifié et groupe électrogène 250 kVA.',
    operation: 'rent',
    property_type: 'penthouse',
    status: 'available',
    price: 2800000, // FCFA / mois charges comprises
    currency: 'FCFA',
    city: 'Abidjan',
    district: 'Marcory Zone 4',
    address: 'Rue Paul Langevin, Zone 4C',
    surface: 380,
    bedrooms: 4,
    bathrooms: 4,
    has_pool: true,
    has_generator: true,
    has_security: true,
    has_parking: true,
    legal_status: 'TF',
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=85'
    ],
    owner_name: 'Mme Bamba',
    owner_phone: '+2250504030201',
    created_at: '2026-10-18T14:30:00Z',
  },
  {
    id: 'prop-003',
    title: 'Appartement Meublé Standing 4 Pièces avec Conciergerie',
    slug: 'appartement-meuble-4-pieces-plateau',
    reference: 'APP-PL-04',
    description: 'Appartement spacieux et moderne au Plateau, idéal pour cadres dirigeants, diplomates ou expatriés. Décoration contemporaine soignée, fibre optique haut débit dédiée, climatisation split inverter, conciergerie 24/7, salle de sport au sein de la résidence. Bail diplomatique ou corporate avec clause de préavis allégée.',
    operation: 'rent',
    property_type: 'appartement',
    status: 'available',
    price: 1800000, // FCFA / mois
    currency: 'FCFA',
    city: 'Abidjan',
    district: 'Plateau',
    address: 'Boulevard de la République',
    surface: 190,
    bedrooms: 3,
    bathrooms: 3,
    has_pool: false,
    has_generator: true,
    has_security: true,
    has_parking: true,
    legal_status: 'CMP',
    featured: false,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=85'
    ],
    owner_name: 'Société Civile Immobilière Ivoire',
    owner_phone: '+2250102030405',
    created_at: '2026-10-22T09:15:00Z',
  },
  {
    id: 'prop-004',
    title: 'Villa d\'Architecte 6 Pièces avec Piscine & Jardin Privatif',
    slug: 'villa-architecte-beverly-hills-cocody',
    reference: 'VIL-BH-420',
    description: 'Superbe villa individuelle dans une enceinte résidentielle fermée et gardée à Riviera Beverly Hills. Séjour de réception de 90 m², cuisine équipée avec îlot central, 4 chambres en suite dont une suite parentale avec terrasse privative. Piscine à débordement, loge gardien, groupe électrogène insonorisé et forage d\'appoint.',
    operation: 'rent',
    property_type: 'villa',
    status: 'available',
    price: 4200000, // FCFA / mois
    currency: 'FCFA',
    city: 'Abidjan',
    district: 'Riviera Beverly Hills',
    address: 'Cité Résidentielle Fermée Beverly Hills, Cocody',
    surface: 550,
    bedrooms: 5,
    bathrooms: 5,
    has_pool: true,
    has_generator: true,
    has_security: true,
    has_parking: true,
    legal_status: 'ACD',
    featured: true,
    flipbook_url: 'https://heyzine.com/flip-book/e12d59cb9e.html',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1200&q=85'
    ],
    owner_name: 'M. Touré S.',
    owner_phone: '+2250749001122',
    created_at: '2026-10-28T16:00:00Z',
  },
  {
    id: 'prop-005',
    title: 'Résidence Balnéaire d\'Exception Pieds dans l\'Eau avec Ponton',
    slug: 'villa-balneaire-assinie-pk9',
    reference: 'VIL-AS-901',
    description: 'Propriété d\'exception les pieds dans le sable entre lagune et mer à Assinie PK 9. Disponible en bail longue durée ou villégiature diplomatique annuelle. 6 suites indépendantes, ponton privé pour bateau certifié DGAMP, solarium, paillote lounge panoramique et personnel de service inclus.',
    operation: 'rent',
    property_type: 'villa',
    status: 'under_offer',
    price: 5500000, // FCFA / mois
    currency: 'FCFA',
    city: 'Assinie',
    district: 'Assinie Mafia PK 9',
    address: 'PK 9.5 Côté Lagune avec accès mer',
    surface: 850,
    bedrooms: 6,
    bathrooms: 7,
    has_pool: true,
    has_generator: true,
    has_security: true,
    has_parking: true,
    legal_status: 'ACD',
    featured: true,
    flipbook_url: 'https://heyzine.com/flip-book/e12d59cb9e.html',
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85'
    ],
    owner_name: 'M. de Saint-Gilles',
    owner_phone: '+2250757008899',
    created_at: '2026-10-30T11:20:00Z',
  },
  {
    id: 'prop-006',
    title: 'Plateau de Bureaux Modernes 250 m² à Cocody Danga',
    slug: 'plateau-bureaux-cocody-danga',
    reference: 'BUR-CD-250',
    description: 'Immeuble neuf de grand standing à Cocody Danga pour siège ou filiale régionale. Espace décloisonné et modulable, câblage réseau RJ45 catégorie 6A, double vitrage thermique et acoustique, groupe électrogène de secours 250 kVA, ascenseur, 5 places de stationnement réservées.',
    operation: 'rent',
    property_type: 'bureau',
    status: 'available',
    price: 3200000, // FCFA / mois
    currency: 'FCFA',
    city: 'Abidjan',
    district: 'Cocody Danga',
    address: 'Rue des Jardins prolongée',
    surface: 250,
    bedrooms: 0,
    bathrooms: 4,
    has_pool: false,
    has_generator: true,
    has_security: true,
    has_parking: true,
    legal_status: 'ACD',
    featured: false,
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80'
    ],
    owner_name: 'Groupe Financier Atlantique',
    owner_phone: '+2250505112233',
    created_at: '2026-11-02T15:00:00Z',
  }
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'cont-001',
    full_name: 'Jean-Philippe Konan',
    phone: '+225 07 48 22 11 00',
    email: 'jp.konan@africafund.ci',
    type: 'tenant',
    lead_score: 'hot',
    qualification_score: 96,
    budget_min: 3000000,
    budget_max: 4500000,
    preferred_districts: ['Cocody Riviera Golf', 'Cocody Ambassades', 'Riviera Beverly Hills'],
    preferred_types: ['villa'],
    profession: 'Directeur Général Panafricain (Fonds Private Equity)',
    residence_country: 'Côte d\'Ivoire (Abidjan)',
    financial_readiness: 'Bail corporate pris en charge par le fonds + caution 2 mois consignée sous séquestre notarié',
    kyc_status: 'valid',
    timeline: 'immediate',
    key_interests: ['Bail Corporate', 'Piscine 14m', 'Groupe Insonorisé 40 kVA', 'Séquestre Notarié', 'Sécurité Riviera Golf'],
    notes: 'Locataire corporate haut standing. Recherche villa contemporaine pour emménagement rapide. Visite confirmée avec son épouse et son juriste d\'entreprise.',
    last_interaction: 'Aujourd\'hui 11h24 via WhatsApp • Confirmation créneau visite locative',
    source: 'whatsapp',
    created_at: '2026-11-05T09:30:00Z',
    objections: [
      {
        id: 'obj-001',
        category: 'sequestre',
        objection: 'Garantie de restitution intégrale du dépôt de garantie (caution 2 mois)',
        client_statement: 'En fin de bail, comment s\'assurer que le bailleur ne retient pas la caution abusivement pour de l\'usure normale ?',
        recommended_response: 'Le dépôt de garantie de 2 mois est consigné sous séquestre notarié. L\'état des lieux d\'entrée et de sortie est dressé contradictoirement par commissaire de justice, garantissant la restitution sous 15 jours.',
        proof_document: 'Protocole de Séquestre Notarié & Grille de Vétusté CIMA',
        status: 'resolved'
      },
      {
        id: 'obj-002',
        category: 'technique',
        objection: 'Prise en charge de la maintenance du groupe électrogène et de la piscine',
        client_statement: 'Qui assure les entretiens périodiques du groupe 40 kVA et les produits de traitement du bassin ?',
        recommended_response: 'Le bailleur a souscrit un contrat de maintenance trimestriel tout compris avec Perkins CI et un pisciniste agréé, inclus dans les charges locatives.',
        proof_document: 'Contrat d\'Entretien Perkins & Attestation de Révision',
        status: 'resolved'
      }
    ],
    whatsapp_history: [
      {
        id: 'msg-001',
        sender: 'client',
        sender_name: 'Jean-Philippe Konan',
        timestamp: 'Hier 14:10',
        text: 'Bonjour, j\'ai consulté votre fiche pour la Villa Riviera Golf 4 (Réf. VIL-RG-2026). Ce bien meublé est-il disponible pour une prise de bail corporate au 1er décembre ?',
        status: 'read'
      },
      {
        id: 'msg-002',
        sender: 'agent',
        sender_name: 'Aya (Agent IA Cabinet)',
        timestamp: 'Hier 14:11',
        text: 'Bonjour M. Konan. Oui, cette villa meublée de 650 m² est libre d\'occupation et éligible au bail société avec dépôt de garantie consigné sous séquestre notarié. Avez-vous pu consulter notre plaquette numérique ?',
        status: 'read'
      },
      {
        id: 'msg-003',
        sender: 'client',
        sender_name: 'Jean-Philippe Konan',
        timestamp: 'Hier 14:15',
        text: 'Oui, très claire. Notre siège exige un groupe électrogène de secours insonorisé et une attestation de titre régulier du bailleur.',
        status: 'read'
      },
      {
        id: 'msg-004',
        sender: 'agent',
        sender_name: 'Koffi Fabrice (Négociateur Senior)',
        timestamp: 'Hier 14:22',
        text: 'Absolument M. Konan. Le groupe 40 kVA avec inverseur automatique est contrôlé, et le titre ACD du propriétaire est audité au Guichet Unique MCLU. Visite possible samedi 15h30 ?',
        media_type: 'document',
        media_label: 'Fiche_Technique_Equipements_VIL-RG.pdf',
        status: 'read'
      },
      {
        id: 'msg-005',
        sender: 'client',
        sender_name: 'Jean-Philippe Konan',
        timestamp: 'Aujourd\'hui 11:20',
        text: 'Parfait. Notre DRH confirme la visite samedi 15h30. Nous prévoyons 2 mois de caution + 2 mois d\'avance sous séquestre.',
        status: 'read'
      },
      {
        id: 'msg-006',
        sender: 'agent',
        sender_name: 'Koffi Fabrice (Négociateur Senior)',
        timestamp: 'Aujourd\'hui 11:24',
        text: 'Créneau confirmé pour samedi 15h30. Je vous transmets le protocole d\'accès et le projet de bail type corporate.',
        media_type: 'property_card',
        media_label: 'Projet_Bail_Corporate_Prestige_2026.pdf',
        status: 'read'
      }
    ]
  },
  {
    id: 'cont-002',
    full_name: 'Marie-Laure Doumbia',
    phone: '+225 05 55 12 34 56',
    email: 'marielaure.d@gmail.com',
    type: 'tenant',
    lead_score: 'hot',
    qualification_score: 92,
    budget_min: 2200000,
    budget_max: 3000000,
    preferred_districts: ['Marcory Zone 4', 'Cocody Danga', 'Plateau'],
    preferred_types: ['penthouse', 'appartement'],
    profession: 'Directrice Juridique & Conformité (Groupe Énergie)',
    residence_country: 'Diaspora (Paris / retour Abidjan)',
    financial_readiness: 'Prise en charge relocation société + virement caution Société Générale CI prêt',
    kyc_status: 'valid',
    timeline: '1_month',
    key_interests: ['Vue Lagune', 'Copropriété Sécurisée', 'Syndic Pro', 'Zone 4', 'Séquestre Notarié', 'Meublé Standing'],
    notes: 'Expatriée de retour définitif. Très exigeante sur la sécurité du quartier, la réputation du syndic et la fluidité d\'accès par le pont HKB.',
    last_interaction: 'Hier 17h45 • Visite locative confirmée avec son architecte',
    source: 'website',
    created_at: '2026-11-04T16:20:00Z',
    objections: [
      {
        id: 'obj-003',
        category: 'technique',
        objection: 'Gouvernance du syndic de copropriété et charges trimestrielles',
        client_statement: 'À Zone 4, beaucoup d\'immeubles souffrent d\'une gestion défaillante de l\'ascenseur et du groupe électrogène collectif.',
        recommended_response: 'L\'immeuble dispose d\'un syndic professionnel certifié avec contrat de maintenance Otis et groupe 250 kVA secouru à 100%. Charges incluses dans le bail.',
        proof_document: 'PV Assemblée Générale 2025 & Règlement de Copropriété',
        status: 'resolved'
      }
    ],
    whatsapp_history: [
      {
        id: 'msg-010',
        sender: 'client',
        sender_name: 'Marie-Laure Doumbia',
        timestamp: '04 Nov 16:30',
        text: 'Bonsoir, je prépare ma réinstallation à Abidjan depuis Paris. Le Penthouse de Marcory Zone 4 (Réf. PNT-Z4-104) est-il disponible à la location meublée pour 12 mois minimum ?',
        status: 'read'
      },
      {
        id: 'msg-011',
        sender: 'agent',
        sender_name: 'Aya (Agent IA Cabinet)',
        timestamp: '04 Nov 16:32',
        text: 'Bonsoir Mme Doumbia. Bienvenue ! Oui, le penthouse est libre, loué meublé tout confort à 2,8M FCFA/mois charges syndic comprises. Souhaitez-vous recevoir la ventilation des charges et les plans ?',
        status: 'read'
      },
      {
        id: 'msg-012',
        sender: 'client',
        sender_name: 'Marie-Laure Doumbia',
        timestamp: '04 Nov 16:35',
        text: 'Oui avec plaisir. Je fais inspecter le bien par mon architecte d\'intérieur ce jeudi pour valider le mobilier.',
        status: 'read'
      },
      {
        id: 'msg-013',
        sender: 'agent',
        sender_name: 'Aya Kouassi (Senior)',
        timestamp: '04 Nov 16:40',
        text: 'Voici le dossier technique complet : plans cotés 380 m², PV du syndic professionnel et inventaire du mobilier haut de gamme.',
        media_type: 'document',
        media_label: 'Dossier_Locatif_Penthouse_Zone4.pdf',
        status: 'read'
      }
    ]
  },
  {
    id: 'cont-003',
    full_name: 'M. Stéphane Brou',
    phone: '+225 07 09 88 77 66',
    email: 'sbrou.immo@yahoo.fr',
    type: 'tenant',
    lead_score: 'warm',
    qualification_score: 86,
    budget_min: 2500000,
    budget_max: 3500000,
    preferred_districts: ['Cocody Danga', 'Cocody Riviera Golf', 'Cocody Les Deux-Plateaux'],
    preferred_types: ['villa'],
    profession: 'Directeur d\'Exploitation Grands Travaux BTP',
    residence_country: 'Côte d\'Ivoire (Abidjan)',
    financial_readiness: 'Contrat CDI groupe multinational + caution bancaire solidaire Ecobank',
    kyc_status: 'valid',
    timeline: '1_month',
    key_interests: ['Villa Duplex', 'Piscine', 'Groupe Insonorisé', 'Cocody Danga', 'Bail 2 ans'],
    notes: 'Recherche une villa duplex de standing avec jardin pour sa famille. Exige une climatisation révisée et un groupe électrogène automatique.',
    last_interaction: 'Ce matin 09h15 • Programmation visite vendredi 10h',
    source: 'whatsapp',
    created_at: '2026-11-02T11:00:00Z',
    objections: [
      {
        id: 'obj-004',
        category: 'technique',
        objection: 'État de la climatisation centrale et étanchéité de toiture',
        client_statement: 'À l\'approche de la saison des pluies, je veux m\'assurer qu\'aucune infiltration n\'a été masquée par une couche de peinture récente.',
        recommended_response: 'Rapport d\'expertise technique pré-locative réalisé le 28/10/2026 avec caméra thermique, toiture révisée et garantie étanchéité 1 an transmise.',
        proof_document: 'Rapport d\'Audit Technique Pré-Locatif Cabinet 2026',
        status: 'resolved'
      }
    ],
    whatsapp_history: [
      {
        id: 'msg-020',
        sender: 'client',
        sender_name: 'Stéphane Brou',
        timestamp: '02 Nov 11:05',
        text: 'Bonjour, la villa à Cocody Riviera Golf (Réf. VIL-RG-2026) est-elle disponible en location non meublée ou semi-meublée ?',
        status: 'read'
      },
      {
        id: 'msg-021',
        sender: 'agent',
        sender_name: 'Aya (Agent IA Cabinet)',
        timestamp: '02 Nov 11:06',
        text: 'Bonjour M. Brou. Le bien est proposé meublé mais le bailleur accepte une formule semi-meublée (cuisine équipée, électroménager et groupe 40kVA maintenus).',
        status: 'read'
      },
      {
        id: 'msg-022',
        sender: 'client',
        sender_name: 'Stéphane Brou',
        timestamp: '02 Nov 11:15',
        text: 'Très intéressant. Pouvons-nous caler une visite ce vendredi à 10h pour que je puisse inspecter les chambres et le local technique ?',
        status: 'read'
      }
    ]
  },
  {
    id: 'cont-004',
    full_name: 'Claire Vance (Ambassade)',
    phone: '+225 01 44 33 22 11',
    email: 'c.vance@diplomatie.org',
    type: 'tenant',
    lead_score: 'hot',
    qualification_score: 95,
    budget_min: 1800000,
    budget_max: 2500000,
    preferred_districts: ['Plateau', 'Cocody Ambassades'],
    preferred_types: ['appartement'],
    profession: 'Première Conseillère Diplomatique',
    residence_country: 'Abidjan (Mission Diplomatique)',
    financial_readiness: 'Prise en charge intégrale bail diplomatique par l\'État d\'envoi (règlement annuel d\'avance sous séquestre)',
    kyc_status: 'valid',
    timeline: 'immediate',
    key_interests: ['Bail Diplomatique', 'Sécurité Cordon', 'Groupe Automatique', 'Plateau', 'Meublé Haut Standing'],
    notes: 'Bail officiel 3 ans ferme. Nécessite accord de sécurité de l\'officier de sécurité régionale de l\'ambassade.',
    last_interaction: 'Ce matin 08h30 • Dossier diplomatique transmis',
    source: 'website',
    created_at: '2026-11-07T08:10:00Z',
    objections: [
      {
        id: 'obj-005',
        category: 'technique',
        objection: 'Homologation de la porte d\'entrée blindée et temps de commutation du groupe',
        client_statement: 'Les normes diplomatiques exigent une coupure inférieure à 15 secondes et un accès sous contrôle biométrique.',
        recommended_response: 'Inverseur de source automatique installé avec bascule en 8 secondes sur groupe Perkins 150 kVA. Porte blindée classe 4 homologuée.',
        proof_document: 'Rapport Sécurité & Fiche Technique Groupe Perkins',
        status: 'resolved'
      }
    ],
    whatsapp_history: [
      {
        id: 'msg-030',
        sender: 'client',
        sender_name: 'Claire Vance',
        timestamp: 'Aujourd\'hui 08:15',
        text: 'Bonjour, notre chancellerie valide le dossier de l\'appartement 4P au Plateau (Réf. APP-PL-04). Pouvez-vous insérer la clause diplomatique type dans le projet de bail ?',
        status: 'read'
      },
      {
        id: 'msg-031',
        sender: 'agent',
        sender_name: 'Aya Kouassi (Senior)',
        timestamp: 'Aujourd\'hui 08:25',
        text: 'Bonjour Mme Vance. Clause diplomatique d\'exonération de préavis en cas de rappel de mission intégrée selon vos standards. Bail type transmis sous séquestre notarié.',
        status: 'read'
      }
    ]
  },
  {
    id: 'cont-005',
    full_name: 'Dr. Christian Aké',
    phone: '+44 7911 123456',
    email: 'ake.surgery@harleystreet.co.uk',
    type: 'owner',
    lead_score: 'hot',
    qualification_score: 98,
    budget_min: 5000000,
    budget_max: 6000000, // Loyer mensuel visé pour son bien
    preferred_districts: ['Assinie-Mafia', 'Cocody Riviera Golf'],
    preferred_types: ['villa'],
    profession: 'Chirurgien Orthopédiste & Propriétaire Bailleur (Londres)',
    residence_country: 'Royaume-Uni (Diaspora Londres)',
    financial_readiness: 'Propriétaire en titre foncier ACD régularisé. Recherche mandat de gestion locative sécurisé.',
    kyc_status: 'valid',
    timeline: 'immediate',
    key_interests: ['Gestion Locative Déléguée', 'Sélection Locataire Corporate', 'Garantie Loyers Impayés', 'Assinie', 'Caution Séquestrée'],
    notes: 'Bailleur premium confiant la location annuelle de sa villa pieds dans l\'eau à Assinie (5,5M FCFA/mois). Exige des locataires expatriés ou missions diplomatiques triés sur le volet.',
    last_interaction: 'Aujourd\'hui 10h12 via WhatsApp • Validation du mandat de gestion locative',
    source: 'referral',
    created_at: '2026-11-06T18:00:00Z',
    objections: [
      {
        id: 'obj-006',
        category: 'sequestre',
        objection: 'Garantie de reversement mensuel régulier des loyers sur compte UK',
        client_statement: 'Depuis Londres, comment s\'assurer que les loyers en devises sont virés chaque 5 du mois sans retenue illégitime ?',
        recommended_response: 'Mandat de gestion agréé avec compte séquestre de gestion dédié, attestation fiscale de non-double imposition et virement automatique Swift / SEPA le 5 ouvré.',
        proof_document: 'Convention de Mandat de Gestion Locative Internationale',
        status: 'resolved'
      }
    ],
    whatsapp_history: [
      {
        id: 'msg-040',
        sender: 'client',
        sender_name: 'Dr. Christian Aké',
        timestamp: 'Hier 21:00',
        text: 'Bonsoir cher cabinet. Je souhaite mettre ma villa d\'Assinie PK 9 en location annuelle corporate à 5,5M FCFA/mois. Pouvez-vous assurer l\'audit des locataires et la gestion complète ?',
        status: 'read'
      },
      {
        id: 'msg-041',
        sender: 'agent',
        sender_name: 'Koffi Fabrice (Négociateur Senior)',
        timestamp: 'Hier 21:15',
        text: 'Bonsoir Docteur Aké. Absolument. Nous prenons en charge la sélection rigoureuse (KYC, caution 2 mois séquestrée, baux d\'entreprises multinationales) et l\'état des lieux certifié par huissier.',
        status: 'read'
      },
      {
        id: 'msg-042',
        sender: 'client',
        sender_name: 'Dr. Christian Aké',
        timestamp: 'Aujourd\'hui 09:40',
        text: 'Très bien. Nous avons un candidat potentiel de l\'ambassade qui souhaite visiter ce samedi en bateau. Pouvez-vous l\'accueillir sur place ?',
        status: 'read'
      },
      {
        id: 'msg-043',
        sender: 'agent',
        sender_name: 'Koffi Fabrice (Négociateur Senior)',
        timestamp: 'Aujourd\'hui 10:12',
        text: 'Visite organisée pour samedi 11h30 avec le conseiller de chancellerie. Dossier de solvabilité d\'ores et déjà pré-validé.',
        status: 'read'
      }
    ]
  },
  {
    id: 'cont-006',
    full_name: 'Fatoumata Bakayoko',
    phone: '+225 07 77 99 88 11',
    email: 'f.bakayoko@group-ivoire.ci',
    type: 'owner',
    lead_score: 'hot',
    qualification_score: 97,
    budget_min: 12000000,
    budget_max: 18000000, // Volume mensuel du portefeuille locatif
    preferred_districts: ['Cocody Ambassades', 'Cocody Riviera Golf'],
    preferred_types: ['villa'],
    profession: 'Présidente Directrice Générale (Propriétaire Foncière)',
    residence_country: 'Côte d\'Ivoire (Abidjan)',
    financial_readiness: 'Portefeuille de 4 villas de prestige à Cocody confiées en mandat de gestion locative exclusive',
    kyc_status: 'valid',
    timeline: 'immediate',
    key_interests: ['Mandat de Gestion Exclusive', 'Baux Diplomatiques 3 ans', 'Préservation du Patrimoine', 'Séquestre Notarié'],
    notes: 'Bailleresse institutionnelle de premier plan. Confie la commercialisation et le suivi des baux de prestige de son parc immobilier familial.',
    last_interaction: 'Hier 19h00 • Signature mandat de location exclusive villa Beverly Hills',
    source: 'referral',
    created_at: '2026-11-03T14:30:00Z',
    objections: [
      {
        id: 'obj-008',
        category: 'sequestre',
        objection: 'Garantie de conservation de l\'état des finitions de luxe par les occupants',
        client_statement: 'Les villas ont des parquets en teck et des marbres d\'Italie. Je ne veux que des diplomates ou directeurs généraux respectueux.',
        recommended_response: 'Nous exigeons un état des lieux numérique d\'entrée sur 120 points avec huissier de justice et une caution séquestrée de 2 mois majorée d\'une garantie de remise en état société.',
        proof_document: 'Protocole d\'État des Lieux Numérique & Caution Séquestrée',
        status: 'resolved'
      }
    ],
    whatsapp_history: [
      {
        id: 'msg-050',
        sender: 'client',
        sender_name: 'Fatoumata Bakayoko',
        timestamp: '03 Nov 14:40',
        text: 'Bonjour Monsieur. Ma villa de Riviera Beverly Hills (Réf. VIL-BH-420) se libère le 15 décembre. Je recherche un locataire diplomatique ou dirigeant de grand groupe à 4,2M FCFA/mois.',
        status: 'read'
      },
      {
        id: 'msg-051',
        sender: 'agent',
        sender_name: 'Direction Cabinet Immo',
        timestamp: '03 Nov 15:00',
        text: 'Chère Madame Bakayoko, nous avons deux candidats parfaits en cours de qualification : le directeur général Afrique d\'Orange et une première conseillère d\'ambassade. Les visites sont programmées cette semaine.',
        status: 'read'
      }
    ]
  },
  {
    id: 'cont-007',
    full_name: 'Marc-Antoine de Saint-Germain',
    phone: '+225 05 00 11 22 44',
    email: 'm.desaintgermain@orange.com',
    type: 'tenant',
    lead_score: 'hot',
    qualification_score: 91,
    budget_min: 3500000,
    budget_max: 5000000,
    preferred_districts: ['Cocody Riviera Golf', 'Marcory Zone 4', 'Riviera Beverly Hills'],
    preferred_types: ['villa', 'penthouse'],
    profession: 'Directeur Général Filiale Télécoms Régionale',
    residence_country: 'Abidjan (Expatriation)',
    financial_readiness: 'Bail corporate pris en charge à 100% par le siège multinationale (budget mensuel validé 4,5M FCFA)',
    kyc_status: 'valid',
    timeline: '1_month',
    key_interests: ['Villa Sécurisée', 'Piscine', 'Groupe Insonorisé', 'Fibre Optique Dédiée', 'Bail Corporate'],
    notes: 'Contrat d\'expatriation 4 ans. Famille avec 3 enfants scolarisés au Lycée Français Blaise Pascal. Prise de bail souhaitée au 15 décembre.',
    last_interaction: 'Ce matin 10h00 • Programmation visite Beverly Hills mercredi 15h',
    source: 'call',
    created_at: '2026-11-06T10:00:00Z',
    objections: [
      {
        id: 'obj-009',
        category: 'technique',
        objection: 'Temps de trajet pour le ramassage scolaire Blaise Pascal et Jean Mermoz',
        client_statement: 'La fluidité du boulevard Mitterrand aux heures de pointe le matin est déterminante pour nos enfants.',
        recommended_response: 'La villa Beverly Hills est située à 6 minutes de Blaise Pascal par voie résidentielle interne sans emprunter les carrefours encombrés.',
        proof_document: 'Plan de Circulation & Fiche Rapprochée Écoles Internationales',
        status: 'resolved'
      }
    ],
    whatsapp_history: [
      {
        id: 'msg-060',
        sender: 'client',
        sender_name: 'M.-A. de Saint-Germain',
        timestamp: '06 Nov 10:15',
        text: 'Bonjour, ma prise de poste est confirmée. Pouvons-nous visiter la villa de Beverly Hills à 4,2M FCFA ce mercredi après-midi avec notre responsable des services généraux ?',
        status: 'read'
      },
      {
        id: 'msg-061',
        sender: 'agent',
        sender_name: 'Aya Kouassi (Senior)',
        timestamp: '06 Nov 10:30',
        text: 'Bonjour M. de Saint-Germain. Visite confirmée mercredi à 15h00. Nous préparerons sur place le dossier technique pour votre responsable des services généraux.',
        status: 'read'
      }
    ]
  },
  {
    id: 'cont-008',
    full_name: 'Ibrahim Sangaré',
    phone: '+1 514 889 7700',
    email: 'isangare@tech-capital.ca',
    type: 'investor',
    lead_score: 'warm',
    qualification_score: 82,
    budget_min: 150000000,
    budget_max: 260000000,
    preferred_districts: ['Marcory Zone 4', 'Plateau', 'Cocody Danga'],
    preferred_types: ['appartement', 'bureau'],
    profession: 'Ingénieur Cloud & Business Angel (Montréal / Abidjan)',
    residence_country: 'Canada (Diaspora)',
    financial_readiness: 'Recherche investissement locatif avec mandat de gestion intégrale (loyers garantis 2M à 3M FCFA/mois)',
    kyc_status: 'valid',
    timeline: '3_months',
    key_interests: ['Rendement Locatif Net', 'Gestion Locative Déléguée', 'Bail Meublé Expatrié', 'Zone 4'],
    notes: 'Diaspora canadienne préparant un portefeuille de rendement locatif à Abidjan. Très analytique sur le cashflow net et la gestion des locataires.',
    last_interaction: 'Hier 22h30 • Simulation locative personnalisée partagée',
    source: 'website',
    created_at: '2026-11-01T15:20:00Z',
    objections: [
      {
        id: 'obj-010',
        category: 'prix',
        objection: 'Impact de l\'impôt foncier ivoirien (IRF 15%) sur la rentabilité nette réelle',
        client_statement: 'Les agences annoncent souvent du 9% brut sans déduire la fiscalité et les provisions pour vacance.',
        recommended_response: 'Notre mandat de gestion intègre explicitement l\'IRF 15%, un forfait de gestion de 10% et 1 mois de vacance. Le rendement net d\'exploitation ressort à 6,8% réel.',
        proof_document: 'Rapport d\'Étude de Rentabilité Locative 2026 (PDF)',
        status: 'resolved'
      }
    ],
    whatsapp_history: [
      {
        id: 'msg-070',
        sender: 'client',
        sender_name: 'Ibrahim Sangaré',
        timestamp: '01 Nov 22:30',
        text: 'Bonjour, j\'ai utilisé votre simulateur locatif en ligne depuis Montréal. Prenez-vous en charge la gestion locative intégrale avec garantie de loyers impayés ?',
        status: 'read'
      },
      {
        id: 'msg-071',
        sender: 'agent',
        sender_name: 'Aya (Agent IA Cabinet)',
        timestamp: '01 Nov 22:32',
        text: 'Bonjour M. Sangaré. Oui, notre cabinet assure le mandat de gestion déléguée pour la diaspora (encaissement, reversement mensuel en devises, gestion des baux diplomatiques).',
        status: 'read'
      }
    ]
  }
];

export const INITIAL_VISITS: Visit[] = [
  {
    id: 'vis-001',
    property_id: 'prop-001',
    contact_id: 'cont-001',
    scheduled_at: '2026-11-09T15:30:00Z',
    status: 'scheduled',
    agent_name: 'Koffi Fabrice (Négociateur Senior)',
    feedback: 'Visite locative de prise de bail confirmée. M. Konan viendra avec son juriste et le responsable logistique du fonds pour valider la convention de bail corporate et le groupe électrogène.',
    created_at: '2026-11-06T14:00:00Z',
  },
  {
    id: 'vis-002',
    property_id: 'prop-002',
    contact_id: 'cont-002',
    scheduled_at: '2026-11-08T11:00:00Z',
    status: 'scheduled',
    agent_name: 'Aya Kouassi (Conseillère Baux)',
    feedback: 'Visite d\'inspection locative Penthouse Zone 4. Mme Doumbia sera accompagnée de son architecte d\'intérieur pour valider l\'aménagement et vérifier l\'isolation phonique des baies.',
    created_at: '2026-11-05T17:45:00Z',
  },
  {
    id: 'vis-003',
    property_id: 'prop-004',
    contact_id: 'cont-007',
    scheduled_at: '2026-11-10T15:00:00Z',
    status: 'scheduled',
    agent_name: 'Koffi Fabrice (Négociateur Senior)',
    feedback: 'Visite corporate Villa Beverly Hills. M. de Saint-Germain visitera avec le responsable des services généraux d\'Orange Côte d\'Ivoire pour homologation du logement de fonction.',
    created_at: '2026-11-06T10:30:00Z',
  },
  {
    id: 'vis-004',
    property_id: 'prop-003',
    contact_id: 'cont-004',
    scheduled_at: '2026-11-09T09:30:00Z',
    status: 'scheduled',
    agent_name: 'Aya Kouassi (Conseillère Baux)',
    feedback: 'Visite de sécurité diplomatique Appartement Plateau 4P. Inspection conjointe avec l\'officier de sécurité régionale de l\'ambassade pour contrôle des accès et de la porte blindée.',
    created_at: '2026-11-07T08:30:00Z',
  },
  {
    id: 'vis-005',
    property_id: 'prop-001',
    contact_id: 'cont-003',
    scheduled_at: '2026-11-13T10:00:00Z',
    status: 'scheduled',
    agent_name: 'Koffi Fabrice',
    feedback: 'Visite locative famille M. Stéphane Brou. Contrôle de la piscine, du système d\'alarme et de l\'autonomie en eau potable (cuve 5 000L).',
    created_at: '2026-11-02T11:20:00Z',
  },
  {
    id: 'vis-006',
    property_id: 'prop-005',
    contact_id: 'cont-005',
    scheduled_at: '2026-11-14T11:30:00Z',
    status: 'scheduled',
    agent_name: 'Koffi Fabrice & Dr. Aké',
    feedback: 'Visite de prestige en bateau à Assinie PK 9 avec un candidat locataire diplomatique (Directeur d\'agence onusienne). Accueil direct sur le ponton privé.',
    created_at: '2026-11-06T18:40:00Z',
  },
  {
    id: 'vis-007',
    property_id: 'prop-006',
    contact_id: 'cont-008',
    scheduled_at: '2026-11-11T14:30:00Z',
    status: 'scheduled',
    agent_name: 'Aya Kouassi',
    feedback: 'Visite technique bail commercial Bureaux Cocody Danga 250 m². Analyse des gaines techniques, raccordement fibre optique et comptage électrique autonome.',
    created_at: '2026-11-04T12:00:00Z',
  },
  {
    id: 'vis-008',
    property_id: 'prop-003',
    contact_id: 'cont-004',
    scheduled_at: '2026-11-04T10:00:00Z',
    status: 'completed',
    agent_name: 'Aya Kouassi (Conseillère Baux)',
    feedback: 'Première visite d\'orientation effectuée. Candidate diplomatique très enthousiaste sur la vue et la conciergerie 24/7. Dossier transmis pour rédaction du bail diplomatique.',
    created_at: '2026-11-01T09:00:00Z',
  }
];

export const INITIAL_DEALS: Deal[] = [
  {
    id: 'deal-001',
    property_id: 'prop-001',
    contact_id: 'cont-001',
    title: 'Bail Corporate Villa Riviera Golf - Konan',
    stage: 'visit_scheduled',
    deal_value: 3800000, // FCFA / mois
    commission_expected: 3800000, // 1 mois de loyer HT honoraires de placement
    expected_closing_date: '2026-12-01',
    notes: 'Bail société 2 ans ferme. Caution de 2 mois (7 600 000 FCFA) séquestrée chez notaire partenaire.',
    created_at: '2026-11-06T14:15:00Z',
  },
  {
    id: 'deal-002',
    property_id: 'prop-002',
    contact_id: 'cont-002',
    title: 'Prise de Bail Penthouse Zone 4 - Doumbia',
    stage: 'qualified',
    deal_value: 2800000, // FCFA / mois
    commission_expected: 2800000,
    expected_closing_date: '2026-12-15',
    notes: 'Bail meublé d\'un an renouvelable. Dossier KYC et attestation employeur validés.',
    created_at: '2026-11-05T10:00:00Z',
  },
  {
    id: 'deal-003',
    property_id: 'prop-003',
    contact_id: 'cont-004',
    title: 'Bail Diplomatique Appartement Plateau - Ambassade',
    stage: 'under_contract',
    deal_value: 1800000, // FCFA / mois
    commission_expected: 1800000,
    expected_closing_date: '2026-11-15',
    notes: 'Bail diplomatique 3 ans. Clause diplomatique validée. Caution consignée sous séquestre notarié.',
    created_at: '2026-11-07T08:30:00Z',
  },
  {
    id: 'deal-004',
    property_id: 'prop-004',
    contact_id: 'cont-007',
    title: 'Bail Résidence Dirigeant Beverly Hills - Saint-Germain',
    stage: 'offer_made',
    deal_value: 4200000, // FCFA / mois
    commission_expected: 4200000,
    expected_closing_date: '2026-11-25',
    notes: 'Offre locative formulée par le siège télécoms. Accord de principe de la propriétaire Mme Bakayoko.',
    created_at: '2026-11-06T10:45:00Z',
  },
  {
    id: 'deal-005',
    property_id: 'prop-006',
    contact_id: 'cont-008',
    title: 'Bail Commercial Bureaux Cocody Danga',
    stage: 'new_lead',
    deal_value: 3200000, // FCFA / mois
    commission_expected: 3200000,
    expected_closing_date: '2026-12-30',
    notes: 'Demande locative pour implantation succursale fintech régionale.',
    created_at: '2026-11-04T14:00:00Z',
  },
  {
    id: 'deal-006',
    property_id: 'prop-005',
    contact_id: 'cont-005',
    title: 'Bail Annuel Villégiature Assinie PK 9 - Dr. Aké',
    stage: 'closed_won',
    deal_value: 5500000, // FCFA / mois
    commission_expected: 5500000,
    expected_closing_date: '2026-11-02',
    notes: 'Bail signé avec directeur de mission internationale. Caution 2 mois séquestrée et clés remises.',
    created_at: '2026-10-25T15:00:00Z',
  }
];

export interface MarketObjectionItem {
  id: string;
  category: 'foncier' | 'sequestre' | 'prix' | 'technique' | 'fiscalite';
  title: string;
  frequency: number; // % of leads voicing it
  impact_level: 'critique' | 'eleve' | 'moyen';
  client_verbatim: string;
  counter_argument: string;
  deliverable_proof: string;
  suggested_action: string;
}

export const OBJECTION_INTELLIGENCE: MarketObjectionItem[] = [
  {
    id: 'obj-sequestre-01',
    category: 'sequestre',
    title: 'Crainte de non-restitution du dépôt de garantie (caution 2 mois)',
    frequency: 84,
    impact_level: 'critique',
    client_verbatim: '« En fin de bail à Abidjan, les bailleurs trouvent souvent des prétextes pour ne pas restituer la caution de plusieurs millions. »',
    counter_argument: 'La totalité du dépôt de garantie (2 mois de loyer) est consignée sur compte séquestre notarié. L\'état des lieux contradictoire certifié par commissaire de justice débloque la restitution sous 15 jours ouvrés.',
    deliverable_proof: 'Convention de Compte Séquestre Notarié & Grille d\'Usure Normale CIMA',
    suggested_action: 'Annexer systématiquement le protocole de séquestre de garantie au projet de bail.'
  },
  {
    id: 'obj-technique-02',
    category: 'technique',
    title: 'Continuité électrique et autonomie en eau en cas de coupure',
    frequency: 78,
    impact_level: 'critique',
    client_verbatim: '« Est-ce que le groupe électrogène est automatique et insonorisé ? Y a-t-il une réserve d\'eau SODECI avec surpresseur ? »',
    counter_argument: 'Toutes nos propriétés en location de prestige intègrent un inverseur automatique (< 10s), un groupe insonorisé révisé et une cuve d\'eau tampon de minimum 3 000 litres avec surpresseur DAB.',
    deliverable_proof: 'Certificat de Maintenance Groupe & Rapport Sanitaire SODECI',
    suggested_action: 'Démontrer le basculement automatique du groupe dès la première visite sur site.'
  },
  {
    id: 'obj-foncier-03',
    category: 'foncier',
    title: 'Vérification du droit de donner à bail du bailleur',
    frequency: 68,
    impact_level: 'eleve',
    client_verbatim: '« Comment avoir la certitude que la personne qui loue est le propriétaire légitime avec titre ACD incontestable ? »',
    counter_argument: 'Le cabinet audite le titre foncier ACD au Guichet Unique MCLU avant la signature de tout mandat locatif. Le bail est conclu directement avec le titulaire du titre ou son mandataire notarié.',
    deliverable_proof: 'Réquisition au Livre Foncier < 30 jours & Mandat Notarié Exclusif',
    suggested_action: 'Transmettre la fiche d\'audit juridique du titre foncier avec le dossier de candidature.'
  },
  {
    id: 'obj-prix-04',
    category: 'prix',
    title: 'Charges locatives de copropriété et syndic professionnel',
    frequency: 62,
    impact_level: 'eleve',
    client_verbatim: '« Que comprennent exactement les charges mensuelles (ascenseur, gardiennage 24/7, groupe collectif, pisciniste) ? »',
    counter_argument: 'Transparence contractuelle complète : chaque bail de prestige détaille la quote-part exacte de charges, avec communication des factures réelles et PV des assemblées de copropriété.',
    deliverable_proof: 'Décomposition Contractuelle des Charges Locatives & PV d\'AG',
    suggested_action: 'Fournir la fiche synthétique « Loyer Net vs Charges Réelles » lors de la remise de l\'offre.'
  },
  {
    id: 'obj-fiscalite-05',
    category: 'fiscalite',
    title: 'Enregistrement du bail et conformité fiscale DGI / Déductibilité Corporate',
    frequency: 52,
    impact_level: 'moyen',
    client_verbatim: '« Notre direction financière a besoin d\'un bail enregistré aux impôts (DGI) pour déduire les loyers de notre résultat fiscal. »',
    counter_argument: 'Tous nos baux sont enregistrés auprès des services fiscaux de la DGI (droit de bail 2,5%), avec remise des quittances officielles mensuelles numérotées.',
    deliverable_proof: 'Bordereau d\'Enregistrement DGI & Quittance Fiscale Type',
    suggested_action: 'Confirmer la prise en charge des formalités d\'enregistrement DGI sous 72h ouvrées.'
  }
];

export interface KeywordInsight {
  keyword: string;
  category: 'foncier' | 'prestation' | 'secteur' | 'finance';
  inquiry_percentage: number;
  sentiment: 'positif' | 'neutre' | 'exigeant';
  monthly_growth: string;
}

export const KEYWORD_RADAR: KeywordInsight[] = [
  { keyword: 'Séquestre Caution Notariée (2 mois)', category: 'finance', inquiry_percentage: 95, sentiment: 'exigeant', monthly_growth: '+28%' },
  { keyword: 'Groupe insonorisé automatique', category: 'prestation', inquiry_percentage: 92, sentiment: 'exigeant', monthly_growth: '+19%' },
  { keyword: 'Bail corporate / Prise en charge société', category: 'finance', inquiry_percentage: 88, sentiment: 'positif', monthly_growth: '+24%' },
  { keyword: 'Cocody Riviera Golf 4 meublé', category: 'secteur', inquiry_percentage: 82, sentiment: 'positif', monthly_growth: '+15%' },
  { keyword: 'Clause diplomatique d\'exonération', category: 'finance', inquiry_percentage: 76, sentiment: 'exigeant', monthly_growth: '+12%' },
  { keyword: 'Marcory Zone 4 Penthouse sécurisé', category: 'secteur', inquiry_percentage: 71, sentiment: 'positif', monthly_growth: '+16%' },
  { keyword: 'État des lieux contradictoire huissier', category: 'foncier', inquiry_percentage: 67, sentiment: 'exigeant', monthly_growth: '+22%' },
  { keyword: 'Réserve eau potable SODECI + surpresseur', category: 'prestation', inquiry_percentage: 64, sentiment: 'positif', monthly_growth: '+9%' },
  { keyword: 'Gestion locative déléguée diaspora', category: 'finance', inquiry_percentage: 58, sentiment: 'positif', monthly_growth: '+35%' },
  { keyword: 'Enregistrement bail DGI déductible', category: 'foncier', inquiry_percentage: 52, sentiment: 'neutre', monthly_growth: '+11%' }
];

export const CRM_ANALYTICS = {
  kpis: {
    total_leads_active: 8,
    qualified_leads_rate: 87.5,
    total_pipeline_volume: 21300000, // FCFA / mois de loyers en cours de négociation
    expected_commissions: 21300000, // FCFA (1 mois de loyer HT par transaction conclue)
    total_monthly_rent_managed: 29800000, // FCFA / mois sous mandat actif
    avg_ticket_rent: 3550000, // FCFA / mois
    avg_rental_closing_days: 14, // Délai moyen de conclusion d'un bail de prestige
    occupancy_rate: 96.2, // % de taux d'occupation du parc locatif
    visits_scheduled_this_week: 7,
    whatsapp_bot_resolution_rate: 94.6,
    audit_deliverable_avg_hours: 48,
  },
  funnel_stages: [
    { stage: '1. Demandes Locatives Reçues', count: 24, conversion_rate: 100 },
    { stage: '2. Dossiers Validés (KYC & Solvabilité)', count: 18, conversion_rate: 75.0 },
    { stage: '3. Visites Locatives Terrain', count: 14, conversion_rate: 77.8 },
    { stage: '4. Accord Bailleur & Réservation', count: 8, conversion_rate: 57.1 },
    { stage: '5. Bail & Caution Séquestrée', count: 5, conversion_rate: 62.5 },
    { stage: '6. État des Lieux & Remise des Clés', count: 4, conversion_rate: 80.0 },
  ],
  demand_by_district: [
    { district: 'Cocody Riviera Golf', share_percentage: 42, count: 6, trend: '+18%' },
    { district: 'Marcory Zone 4 / Biétry', share_percentage: 28, count: 4, trend: '+14%' },
    { district: 'Plateau (Baux Diplomatiques)', share_percentage: 16, count: 2, trend: '+10%' },
    { district: 'Riviera Beverly Hills', share_percentage: 10, count: 2, trend: '+22%' },
    { district: 'Assinie-Mafia (Villégiature)', share_percentage: 4, count: 1, trend: '+8%' },
  ],
  source_efficiency: [
    { source: 'WhatsApp Direct (Bot Aya & Prise de RDV)', count: 12, conversion: 92, avg_score: 94 },
    { source: 'Directions RH & Ambassades (Baux Corporate)', count: 8, conversion: 89, avg_score: 96 },
    { source: 'Site Web Public (Catalogue Locatif)', count: 9, conversion: 75, avg_score: 86 },
    { source: 'Recommandation Propriétaires & Notaires', count: 4, conversion: 85, avg_score: 92 },
  ]
};
