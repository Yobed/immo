'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Target, Share2, Users, Sparkles, Copy, Check, Download, 
  ExternalLink, ArrowRight, TrendingUp, DollarSign, Filter, 
  Layers, Zap, MessageCircle, Globe, Smartphone, BarChart3, 
  ShieldCheck, CheckCircle2, Sliders, Eye, RefreshCw, Send,
  Briefcase, Compass, Award, Building, ChevronRight, Hash,
  FileSpreadsheet, Megaphone, HelpCircle
} from 'lucide-react';
import { formatFCFA } from '@/lib/utils';
import { INITIAL_PROPERTIES, INITIAL_CONTACTS } from '@/lib/mock-data';

// =============================================================================
// 1. PERSONAS STRATÉGIQUES ABIDJAN PRESTIGE (PSYCHOGRAPHIE & RÉSEAUX SOCIAUX)
// =============================================================================
interface PersonaTarget {
  id: string;
  name: string;
  badge: string;
  role: string;
  budgetRange: string;
  targetDistricts: string[];
  preferredProperties: string[];
  psychographics: {
    coreDesire: string;
    hiddenFear: string;
    trustBarrier: string;
    identityCommitment: string;
    decisionTrigger: string;
  };
  socialTargeting: {
    meta: {
      locations: string[];
      interests: string[];
      placements: string[];
      lookalikeSource: string;
      demographics: string;
    };
    linkedin: {
      jobTitles: string[];
      industries: string[];
      companySize: string;
      targetCompanies: string[];
    };
    tiktok: {
      videoStyle: string;
      hookAngle: string;
      soundStyle: string;
    };
    google: {
      exactKeywords: string[];
      phraseKeywords: string[];
      negativeKeywords: string[];
    };
  };
  recommendedOffer: string;
  estimatedReachAbidjan: string;
  expectedCpl: string;
}

const TARGET_PERSONAS: PersonaTarget[] = [
  {
    id: 'expat_diplomat',
    name: '1. Diplomates & Expatriés Multinationals',
    badge: 'Priorité Baux Corporate',
    role: 'Attachés consulaires, DGs de filiales, Directeurs des opérations BAD / TotalEnergies / Orange',
    budgetRange: '3 500 000 – 6 500 000 FCFA / mois',
    targetDistricts: ['Cocody Riviera Golf 4', 'Ambassades', 'Marcory Zone 4'],
    preferredProperties: ['vil-rg-2026', 'vil-amb-2026', 'apt-z4-2026'],
    psychographics: {
      coreDesire: 'Autonomie énergétique et sécurité absolue pour leur famille et leurs réceptions de représentation.',
      hiddenFear: 'Coupures de courant CIE lors d\'un dîner officiel, coupure d\'eau SODECI, ou blocage contractuel en cas de rappel d\'urgence de leur chancellerie.',
      trustBarrier: 'Méfiance envers les intermédiaires informels et les clauses de préavis abusives (dépôt non restitué).',
      identityCommitment: '« Je représente une institution internationale de premier plan ; ma résidence doit refléter nos standards d\'excellence et de sérénité. »',
      decisionTrigger: 'Groupe insonorisé Perkins 60 kVA à basculement automatique (<8s) + Clause Diplomatique 30 jours validée par notaire.',
    },
    socialTargeting: {
      meta: {
        locations: ['Abidjan (Rayon 20km)', 'Expats vivant en Côte d\'Ivoire', 'Afrique de l\'Ouest'],
        interests: ['Expatriate life', 'Diplomatic corps', 'International schools', 'Lufthansa / Air France Flying Blue', 'The Economist'],
        placements: ['Instagram Feed & Stories', 'Facebook Feed', 'Messenger Sponsored'],
        lookalikeSource: 'Lookalike 1% basé sur les 8 baux corporate signés',
        demographics: '35 – 62 ans, français/anglais, CSP++',
      },
      linkedin: {
        jobTitles: ['Ambassador', 'Managing Director', 'Chief Financial Officer', 'Country Manager', 'Head of Mission', 'Regional Director'],
        industries: ['Diplomacy & International Affairs', 'Oil & Energy', 'Banking & Financial Services', 'Telecommunications'],
        companySize: '500+ employés',
        targetCompanies: ['African Development Bank (BAD)', 'TotalEnergies', 'United Nations', 'Orange Côte d\'Ivoire', 'Société Générale', 'Nestlé'],
      },
      tiktok: {
        videoStyle: 'Visite architecturale calme et fluide en 4K (format 9:16), zéro musique agressive, focus sur le groupe insonorisé et le cordon de sécurité.',
        hookAngle: '« Pourquoi les chancelleries internationales n\'acceptent que ce type de villa à Cocody... »',
        soundStyle: 'Lo-fi ambient élégant ou voix off calme et posée.',
      },
      google: {
        exactKeywords: ['[location villa diplomatique abidjan]', '[villa meublee riviera golf ambassades]', '[location bail corporate abidjan]'],
        phraseKeywords: ['"villa standing avec groupe électrogène abidjan"', '"maison sécurisée expatrié cocody"'],
        negativeKeywords: ['gratuit', 'pas cher', 'chambre étudiante', 'studio yopougon', 'bas prix'],
      },
    },
    recommendedOffer: 'Villa Riviera Golf 4 Ambassades · Groupe 60 kVA révisé · Séquestre notarié Me Traoré · Clause Diplomatique 30j',
    estimatedReachAbidjan: '14 500 – 19 000 décideurs qualifiés',
    expectedCpl: '4 800 – 7 200 FCFA / lead qualifié',
  },
  {
    id: 'diaspora_investor',
    name: '2. Diaspora Ivoirienne à Haut Pouvoir d\'Achat',
    badge: 'Investisseurs & Retours',
    role: 'Cadres supérieurs, entrepreneurs et professions libérales basés à Paris, Genève, Londres, Montréal ou New York',
    budgetRange: '2 500 000 – 5 500 000 FCFA / mois (ou 150M – 450M FCFA achat)',
    targetDistricts: ['Cocody Riviera Golf', 'Marcory Biétry', 'Assinie-Mafia', 'Bingerville Titré'],
    preferredProperties: ['ter-rg-2026', 'vil-ass-2026', 'dup-mp-2026'],
    psychographics: {
      coreDesire: 'Réinvestir au pays avec fierté, sécuriser un pied-à-terre de prestige sans se faire escroquer à distance.',
      hiddenFear: 'La fausse attestation villageoise, le terrain revendu 3 fois à Abidjan, ou l\'intermédiaire familial qui détourne les fonds.',
      trustBarrier: 'Traumatisme des récits d\'arnaques foncières vécues par d\'autres membres de la diaspora.',
      identityCommitment: '« J\'ai réussi à l\'international, mon investissement à Abidjan doit être solide, documenté et juridiquement inattaquable. »',
      decisionTrigger: 'Arrêté de Concession Définitive (ACD) purgé au Livre Foncier + Compte Séquestre Notarié (0 FCFA versé sans acte authentique).',
    },
    socialTargeting: {
      meta: {
        locations: ['Île-de-France (Paris)', 'Lyon', 'Genève & Vaud (Suisse)', 'Londres (UK)', 'Montréal (Canada)', 'Bruxelles (Belgique)'],
        interests: ['Côte d\'Ivoire', 'Diaspora ivoirienne', 'Investissement immobilier Afrique', 'Jeune Afrique', 'Air France / Corsair'],
        placements: ['Facebook Feed (très fort chez la diaspora 35-55)', 'Instagram Stories & Reels', 'WhatsApp Direct Click-to-Chat'],
        lookalikeSource: 'Lookalike 1% de nos acquéreurs de la diaspora',
        demographics: '30 – 58 ans, bilingues, propriétaires en Europe',
      },
      linkedin: {
        jobTitles: ['Senior Consultant', 'Software Engineer Manager', 'Director of Finance', 'Senior Legal Counsel', 'Medical Doctor', 'Investor'],
        industries: ['Information Technology', 'Investment Banking', 'Healthcare', 'Management Consulting'],
        companySize: 'Toutes tailles, focus sur les profils à forts revenus',
        targetCompanies: ['BNP Paribas', 'Google', 'Deloitte', 'UBS', 'Amazon', 'Cabinet d\'Avocats Internationaux'],
      },
      tiktok: {
        videoStyle: 'Format éducatif "Stop aux arnaques" : analyse concrète d\'un dossier foncier ACD face caméra avec preuve à l\'écran du Guichet Unique MCLU.',
        hookAngle: '« Vous vivez en France et voulez acheter à Abidjan ? Voici les 3 papiers obligatoires avant de verser 1 seul centime. »',
        soundStyle: 'Dynamique mais sérieux, voix claire avec sous-titres nets.',
      },
      google: {
        exactKeywords: ['[acheter terrain acd abidjan diaspora]', '[programme immobilier prestige abidjan]', '[villa bord de mer assinie achat]'],
        phraseKeywords: ['"notaire abidjan achat immobilier diaspora"', '"investissement locatif sécurisé côte d\'ivoire"'],
        negativeKeywords: ['location courte durée pas cher', 'terrain sans acd', 'attestation coutumière'],
      },
    },
    recommendedOffer: 'Parcelles Titrées ACD Riviera Golf & Assinie · Audit Foncier MCLU Certifié · Séquestre Notarié',
    estimatedReachAbidjan: '85 000 – 120 000 ivoiriens de la diaspora ciblée',
    expectedCpl: '6 500 – 9 800 FCFA / lead qualifié',
  },
  {
    id: 'local_hnwi',
    name: '3. Cadres Dirigeants & Fortune Locale (HNWI)',
    badge: 'Résidences Principales Prestige',
    role: 'Chefs d\'entreprises ivoiriens, directeurs généraux de banques locales, fondateurs de groupes import-export, hauts magistrats',
    budgetRange: '4 000 000 – 8 000 000 FCFA / mois',
    targetDistricts: ['Cocody Riviera Golf 4', 'Riviera M\'Pouto', 'Marcory Zone 4 Penthouse'],
    preferredProperties: ['vil-rg-2026', 'apt-z4-2026', 'vil-amb-2026'],
    psychographics: {
      coreDesire: 'Une adresse statutaire incontestable qui protège leur sphère intime et facilite leurs réceptions privées.',
      hiddenFear: 'Manque de discrétion, vis-à-vis gênant, dégradations prématurées des équipements ou quartier trop exposé aux embouteillages.',
      trustBarrier: 'Le manque de professionnalisme des courtiers occasionnels qui font visiter des biens occupés sans mandat officiel.',
      identityCommitment: '« Je valorise la discrétion et le temps. Tout doit être parfait dès le premier jour, sans négociation de marchand de tapis. »',
      decisionTrigger: 'Mandat exclusif audité, ascenseur privatif à badge, conciergerie dédiée et état des lieux contradictoire sans complaisance.',
    },
    socialTargeting: {
      meta: {
        locations: ['Abidjan (Cocody, Plateau, Zone 4)'],
        interests: ['Luxury lifestyle', 'Architectural Digest', 'Rolex / Patek Philippe', 'Golf Club Abidjan', 'Private banking'],
        placements: ['Instagram Feed (haute résolution visuelle)', 'Stories Instagram', 'Facebook Ads VIP'],
        lookalikeSource: 'Lookalike 1% des résidents de villas prestige',
        demographics: '38 – 65 ans, Abidjan résidentiel',
      },
      linkedin: {
        jobTitles: ['Président Directeur Général (PDG)', 'Directeur Général', 'Membre du Conseil d\'Administration', 'Fondateur', 'Associé Gérant'],
        industries: ['Import-Export', 'Services Financiers', 'BTP & Construction', 'Transport & Logistique'],
        companySize: 'Grandes entreprises ivoiriennes & PME leaders',
        targetCompanies: ['NSIA Banque', 'SIFCA', 'Port Autonome d\'Abidjan', 'Compagnie Ivoirienne d\'Électricité', 'Groupe Carré d\'Or'],
      },
      tiktok: {
        videoStyle: 'Montage cinématique lent style "Architectural Tour" : travelling sur les baies vitrées de 4 mètres, marbre au sol, piscine miroir à débordement.',
        hookAngle: '« 450 m² d\'architecte à la Riviera Golf 4 : visite exclusive de la villa la plus convoitée d\'Abidjan. »',
        soundStyle: 'Musique néo-classique ou piano minimaliste premium.',
      },
      google: {
        exactKeywords: ['[location penthouse standing zone 4]', '[villa d architecte louer abidjan]', '[maison de luxe riviera golf]'],
        phraseKeywords: ['"location villa prestige abidjan"', '"penthouse avec piscine abidjan"'],
        negativeKeywords: ['appartement modeste', 'colocation', 'prix bas'],
      },
    },
    recommendedOffer: 'Penthouse Zone 4 & Villas d\'Architecte Golf 4 · Vue Lagune · Ascenseur à Code · Service Conciergerie 24/7',
    estimatedReachAbidjan: '22 000 – 28 000 dirigeants locaux',
    expectedCpl: '5 500 – 8 000 FCFA / lead qualifié',
  },
  {
    id: 'property_owner',
    name: '4. Bailleurs & Propriétaires Institutionnels',
    badge: 'Recrutement de Mandats',
    role: 'Propriétaires de plusieurs villas ou immeubles de standing à Abidjan cherchant un gestionnaire rigoureux',
    budgetRange: 'Portefeuille 10M – 50M FCFA / mois de loyers',
    targetDistricts: ['Cocody (tous secteurs)', 'Marcory Biétry / Zone 4', 'Plateau'],
    preferredProperties: ['vil-rg-2026', 'apt-z4-2026', 'dup-mp-2026'],
    psychographics: {
      coreDesire: 'Rendement locatif net sécurisé, valorisation de leur patrimoine et zéro charge mentale de gestion quotidienne.',
      hiddenFear: 'Locataires mauvais payeurs, dégradations coûteuses sans recours, vacances locatives prolongées de 6 à 9 mois.',
      trustBarrier: 'Agences traditionnelles opaques qui ne font jamais d\'états des lieux rigoureux et ne révisent pas les groupes électrogènes.',
      identityCommitment: '« Mon patrimoine immobilier est le fruit de décennies de travail ; je refuse de le confier à des amateurs. »',
      decisionTrigger: 'Protocole de solvabilité stricte (salaire net > 3x loyer) + Dépôt sous séquestre notarié + Inspection d\'état des lieux par commissaire de justice.',
    },
    socialTargeting: {
      meta: {
        locations: ['Abidjan', 'France (Diaspora propriétaire)', 'Genève'],
        interests: ['Real estate investing', 'Property management', 'Gestion de patrimoine', 'Notariat', 'Fiscalité immobilière'],
        placements: ['Facebook Feed', 'Instagram Feed', 'Audience Network Premium'],
        lookalikeSource: 'Lookalike 1% de nos propriétaires sous mandat exclusif',
        demographics: '42 – 72 ans, propriétaires confirmés',
      },
      linkedin: {
        jobTitles: ['Investisseur Immobilier', 'Promoteur Immobilier', 'Directeur de Patrimoine', 'Notaire Associé', 'Avocat d\'Affaires'],
        industries: ['Real Estate', 'Legal Practice', 'Investment Management'],
        companySize: 'Toutes structures',
        targetCompanies: ['Chambre des Notaires de Côte d\'Ivoire', 'Ordre des Architectes', 'Bureaux d\'Études Foncier'],
      },
      tiktok: {
        videoStyle: 'Format étude de cas : "Comment nous avons loué cette villa de 4,5M FCFA/mois en 8 jours sans aucun litige d\'état des lieux."',
        hookAngle: '« Propriétaire à Abidjan : voici pourquoi votre villa reste vide depuis 6 mois... »',
        soundStyle: 'Ton professoral, direct et professionnel.',
      },
      google: {
        exactKeywords: ['[confier gestion locative abidjan]', '[agence immobiliere luxe gestion abidjan]', '[mandat de gestion exclusif cocody]'],
        phraseKeywords: ['"meilleure agence immobilière de standing abidjan"', '"gestion locative haut de gamme cocody"'],
        negativeKeywords: ['gratuit', 'faire soi-même', 'sans commission'],
      },
    },
    recommendedOffer: 'Mandat de Gestion Exclusif Sécurisé · Locataires Diplomatiques & Corporate Filtrés · Garantie de Remise en État',
    estimatedReachAbidjan: '12 000 – 16 000 propriétaires patrimoniaux',
    expectedCpl: '7 500 – 12 000 FCFA / mandat potentiel',
  },
];

// =============================================================================
// 2. SCRIPTS & ANNONCES MULTICANALES (5 NIVEAUX DE CONSCIENCE)
// =============================================================================
interface AdCopyTemplate {
  id: string;
  personaId: string;
  platform: 'meta' | 'linkedin' | 'tiktok' | 'google';
  awarenessStage: 'unaware' | 'problem_aware' | 'solution_aware' | 'product_aware' | 'most_aware';
  awarenessLabel: string;
  hook: string;
  body: string;
  headline: string;
  ctaText: string;
  visualBrief: string;
  conversionSecret: string;
}

const AD_TEMPLATES: AdCopyTemplate[] = [
  {
    id: 'ad-meta-expat-01',
    personaId: 'expat_diplomat',
    platform: 'meta',
    awarenessStage: 'problem_aware',
    awarenessLabel: '2. Conscient du Problème (Pannes CIE & Eau)',
    hook: '« À Abidjan, louer une villa à 4M sans vérifier le groupe électrogène est un piège. »',
    body: 'Pour les missions diplomatiques et directions générales, une coupure de courant en pleine réception officielle n\'est pas envisageable.\n\nNos villas de la Riviera Golf 4 et Marcory Zone 4 intègrent un protocole d\'autonomie intégrale :\n• Groupe Perkins 60 kVA insonorisé avec inverseur automatique (< 8 secondes)\n• Bâche tampon SODECI de 5 000L avec surpresseur silencieux\n• Titre foncier ACD audité et purgé au Livre Foncier\n• Clause diplomatique de résiliation sous 30 jours sans pénalité\n\nConsultez les dossiers techniques certifiés et réservez une visite privée avec notre négociateur.',
    headline: 'Villas d\'Architecte & Résidences Diplomatiques · Abidjan',
    ctaText: 'Envoyer un message WhatsApp',
    visualBrief: 'Carrousel Instagram 1080x1080 : Diapo 1 (Façade crépuscule), Diapo 2 (Gros plan groupe Perkins 60kVA propre), Diapo 3 (Piscine miroir éclairée), Diapo 4 (Plan cadastral tamponné Me Traoré).',
    conversionSecret: 'Cible directement l\'angoisse logistique de l\'expatrié tout en apportant une réponse technique chiffrée (60 kVA, 8s, 5000L).',
  },
  {
    id: 'ad-linkedin-expat-02',
    personaId: 'expat_diplomat',
    platform: 'linkedin',
    awarenessStage: 'solution_aware',
    awarenessLabel: '3. Conscient de la Solution (Bail Corporate & Séquestre)',
    hook: 'Baux Corporate & Chancelleries à Abidjan : Pourquoi le séquestre notarié élimine 100% des litiges de restitution de caution.',
    body: 'La signature d\'un bail de direction générale à Abidjan (3M à 7M FCFA/mois) mobilise un dépôt de garantie conséquent.\n\nNotre cabinet applique la Convention Tripartite de Séquestre Notarié en l\'étude de Me Traoré :\n1. Vos fonds de garantie sont séquestrés sur compte notarié sécurisé\n2. Les clés ne sont remises qu\'après état des lieux d\'entrée par commissaire de justice\n3. Restitution garantie sous 15 jours ouvrés selon le barème d\'usure CIMA\n\nAccédez à notre catalogue confidentiel de résidences de prestige prêtes pour emménagement immédiat.',
    headline: 'Gestion des Baux Exécutifs & Diplomatiques · Abidjan Cocody',
    ctaText: 'Télécharger le Dossier Confidentiel',
    visualBrief: 'Format Document LinkedIn (PDF carrousel 5 pages) ou Image épurée d\'un bureau d\'architecte avec vue lagune et sceau notarial.',
    conversionSecret: 'Parle le langage contractuel des directions juridiques et DAF de multinationales en apportant une réassurance institutionnelle.',
  },
  {
    id: 'ad-meta-diaspora-03',
    personaId: 'diaspora_investor',
    platform: 'meta',
    awarenessStage: 'unaware',
    awarenessLabel: '1. Inconscient / Révélation (Le Vrai Risque Foncier)',
    hook: '« 72% des litiges fonciers de la diaspora à Abidjan viennent d\'une seule erreur : signer sans réquisition trentenaire. »',
    body: 'Vous vivez à Paris, Genève, Londres ou Montréal et vous préparez votre investissement à Abidjan ?\n\nNe versez pas 1 FCFA sur la base d\'une simple promesse villageoise ou d\'une attestation coutumière.\n\nNotre protocole d\'acquisition pour la diaspora :\n✓ Réquisition foncière certifiée auprès de la Conservation de la Propriété Foncière MCLU\n✓ Bornage contradictoire géométré par expert agréé\n✓ Tout versement consigné sous séquestre notarié Me Traoré jusqu\'à publication de l\'ACD à votre nom\n\nConsultez notre sélection de parcelles titrées et villas de prestige à la Riviera Golf et Assinie.',
    headline: 'Investissement Immobilier Sécurisé Abidjan · Diaspora Certifiée',
    ctaText: 'Discuter sur WhatsApp avec un Expert',
    visualBrief: 'Vidéo face caméra en studio avec incrustation du Livre Foncier ou Carrousel percutant comparant "Attestation Coutumière (Risque)" vs "ACD Notarié (100% Sécurisé)".',
    conversionSecret: 'Désamorce la peur numéro 1 de la diaspora (se faire arnaquer) et se positionne comme l\'unique tiers de confiance juridique.',
  },
  {
    id: 'ad-tiktok-diaspora-04',
    personaId: 'diaspora_investor',
    platform: 'tiktok',
    awarenessStage: 'product_aware',
    awarenessLabel: '4. Conscient du Produit (Visite Foncier & Preuve Cadastrale)',
    hook: '« Voici à quoi ressemble un terrain avec un VRAI titre ACD purgé à Cocody Riviera Golf. »',
    body: 'Script Vidéo 25 secondes :\n[0-3s] Vue drone spectaculaire sur les parcelles de la Riviera Golf 4 avec vue lagune.\n[3-8s] Voice-over : "Arrêtez d\'acheter des terrains avec de simples lettres d\'attribution. Regardez ce document." (Montre le tampon officiel de la Conservation).\n[8-16s] "Ici, 1 200 m² viabilisés, bornés, eau SODECI et groupe reliés. Et surtout : 0 FCFA versé au vendeur sans le notaire."\n[16-25s] "Pour recevoir le plan de masse et le dossier juridique complet sur WhatsApp, cliquez sur le lien en bio."',
    headline: 'Parcelle 1 200 m² Titrée ACD · Riviera Golf 4',
    ctaText: 'Accéder au Dossier WhatsApp',
    visualBrief: 'Vidéo dynamique 9:16 en 60fps avec sous-titres grand format fond noir / texte blanc et or, drone + inspection terrain.',
    conversionSecret: 'Montre la preuve tangible immédiatement sans blabla commercial. Le format vidéo décuple la confiance des acheteurs distants.',
  },
  {
    id: 'ad-meta-hnwi-05',
    personaId: 'local_hnwi',
    platform: 'meta',
    awarenessStage: 'most_aware',
    awarenessLabel: '5. Ultra Conscient (Action Immédiate Penthouse Zone 4)',
    hook: 'Penthouse d\'Architecte Zone 4 Biétry : 480 m², Piscine Privative en Toit-Terrasse & Vue Panoramique Lagune.',
    body: 'Disponible immédiatement pour bail de standing ou achat exclusif :\n\n• Ascenseur privatif à badge ouvrant directement dans la galerie de réception de 110 m²\n• Suite parentale de 65 m² avec dressing sur-mesure et salle de bains marbre\n• Piscine à débordement suspendue au 6ème étage sans aucun vis-à-vis\n• 3 parkings boxés en sous-sol + groupe électrogène automatique 24/7\n\nVisites privées strictement sur rendez-vous et qualification préalable.',
    headline: 'Penthouse Biétry Exclusif · Visite Privée Immédiate',
    ctaText: 'Réserver un Créneau WhatsApp',
    visualBrief: 'Carrousel 5 photos ultra haute définition au coucher de soleil : terrasse avec vue lagune, salon cathédrale, suite master, piscine.',
    conversionSecret: 'Action directe sur le désir de distinction et de prestige. Le ton d\'accès réservé ("sur rendez-vous") active la désirabilité de rareté.',
  },
  {
    id: 'ad-google-search-06',
    personaId: 'property_owner',
    platform: 'google',
    awarenessStage: 'solution_aware',
    awarenessLabel: '3. Conscient de la Solution (Recherche Active Google)',
    hook: 'Agence Immobilière Prestige Abidjan | Gestion Locative & Baux Sécurisés',
    body: 'Confiez votre villa ou penthouse à un cabinet spécialisé à Cocody & Zone 4. Locataires diplomatiques et corporate rigoureusement solvabilisés (salaire > 3x loyer). Dépôt de garantie sous séquestre notarié Me Traoré. Conciergerie technique 24/7 et révision des groupes. Demandez votre audit patrimonial gratuit sous 24h.',
    headline: 'Gestion Locative Haut de Gamme Cocody · Mandat Exclusif Certifié',
    ctaText: 'Demander un Audit de Gestion',
    visualBrief: 'Annonce Google Search textuelle avec extensions de liens (Portefeuille de Biens, Séquestre Notarié, Avis Bailleurs, Contact WhatsApp).',
    conversionSecret: 'Capte l\'intention d\'achat brûlante sur Google au moment exact où le propriétaire cherche à sécuriser son investissement.',
  },
];

export default function CrmCiblagePage() {
  const [activeTab, setActiveTab] = useState<'personas' | 'studio' | 'utm' | 'roi'>('personas');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('expat_diplomat');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // UTM Generator State
  const [utmSource, setUtmSource] = useState('meta_ads');
  const [utmCampaign, setUtmCampaign] = useState('riviera_golf_expats');
  const [utmMedium, setUtmMedium] = useState('cpc_carrousel');
  const [utmContent, setUtmContent] = useState('hook_groupe_60kva');
  const [customMsg, setCustomMsg] = useState('Bonjour Cabinet Immo, j\'ai vu votre annonce concernant la villa à la Riviera Golf 4 et je souhaite recevoir le dossier technique certifié.');
  const [isCopiedUtm, setIsCopiedUtm] = useState(false);

  // ROI Simulator State
  const [monthlyBudgetFCFA, setMonthlyBudgetFCFA] = useState<number>(1000000);
  const [targetCpm, setTargetCpm] = useState<number>(1400); // 1 400 FCFA pour 1000 impressions qualifiées

  // Calculs dynamiques du simulateur d'entonnoir d'acquisition
  const impressions = Math.round((monthlyBudgetFCFA / targetCpm) * 1000);
  const ctrPercent = 2.4; // 2.4% de taux de clic moyen sur carrousels archi prestige
  const qualifiedClicks = Math.round(impressions * (ctrPercent / 100));
  const conversionToWhatsAppRate = 8.5; // 8.5% des clics engagent une conversation WhatsApp qualifiée
  const generatedLeads = Math.round(qualifiedClicks * (conversionToWhatsAppRate / 100));
  const visitBookingRate = 32; // 32% des leads WhatsApp passent en visite physique de standing
  const physicalVisits = Math.round(generatedLeads * (visitBookingRate / 100));
  const leaseClosingRate = 22; // 22% des visites mènent à une signature de bail sous séquestre notarié
  const closedDeals = Math.max(1, Math.round(physicalVisits * (leaseClosingRate / 100)));
  const avgMonthlyRent = 3800000; // 3,8M FCFA loyer mensuel moyen
  const agencyCommission = closedDeals * avgMonthlyRent; // 1 mois d'honoraires par bail
  const roasMultiplier = (agencyCommission / monthlyBudgetFCFA).toFixed(1);

  const activePersona = TARGET_PERSONAS.find((p) => p.id === selectedPersonaId) || TARGET_PERSONAS[0];

  const filteredAds = AD_TEMPLATES.filter((ad) => {
    if (selectedPersonaId !== 'all' && ad.personaId !== selectedPersonaId) return false;
    if (selectedPlatformFilter !== 'all' && ad.platform !== selectedPlatformFilter) return false;
    return true;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Génération du lien WhatsApp tracké avec UTMs
  const generatedWhatsAppUrl = `https://wa.me/2250700000000?text=${encodeURIComponent(
    `${customMsg}\n\n[Réf Tracking: utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}&utm_content=${utmContent}]`
  )}`;

  // Génération de l'export CSV pour Meta Ads Custom Audience
  const handleExportMetaCsv = () => {
    const headers = ['email', 'phone', 'fn', 'ln', 'value', 'currency', 'country', 'custom_field_kyc'];
    const rows = INITIAL_CONTACTS.map((c) => {
      const parts = c.full_name.split(' ');
      const fn = parts[0] || 'Client';
      const ln = parts.slice(1).join(' ') || 'Prestige';
      // Nettoyer numéro de téléphone pour Meta (doit contenir indicatif pays ex: +225)
      const cleanPhone = c.phone.replace(/[\s-]/g, '');
      return [
        c.email,
        cleanPhone,
        fn,
        ln,
        c.budget_max || 3500000,
        'XOF',
        'CI',
        c.kyc_status === 'valid' ? 'KYC_VALID' : 'KYC_PENDING',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `meta_custom_audience_abidjan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-6 font-sans bg-[#FAF8F5] text-[#161412]">
      
      {/* ========================================================================= */}
      {/* 1. HEADER EXÉCUTIF ARCHITECTURAL (Charbon #191715 & Or Champagne #C8A97E) */}
      {/* ========================================================================= */}
      <header className="relative bg-[#191715] text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-[#2D2926] shadow-warm-md overflow-hidden">
        
        {/* Voile décoratif subtil */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#C8A97E]/15 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C8A97E] bg-[#C8A97E]/10 border border-[#C8A97E]/30 px-2.5 py-0.5 rounded-full font-bold">
                Moteur d&apos;Acquisition &amp; Ciblage Réseaux Sociaux
              </span>
              <span className="text-white/40 text-xs">•</span>
              <span className="text-[11px] font-mono text-white/70">
                Meta · LinkedIn · TikTok · Google Ads
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white">
              Ciblage Haute Précision &amp; Conversion de Prospects
            </h1>

            <p className="text-xs sm:text-sm text-[#FAF8F5]/80 font-normal leading-relaxed">
              Attirez et convertissez les profils à fort patrimoine (Expatriés, Corps Diplomatique, Diaspora d&apos;Europe et Dirigeants locaux) grâce à des audiences qualifiées, des ripostes psychologiques éprouvées et des liens WhatsApp trackés.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-3 rounded-2xl text-left">
              <span className="text-[10px] uppercase font-bold text-[#C8A97E] block">ROAS Moyen Prévu</span>
              <span className="text-xl font-bold text-white">{roasMultiplier}x</span>
              <span className="text-[10px] text-white/60 block mt-0.5">Sur baux corporate</span>
            </div>

            <button
              type="button"
              onClick={handleExportMetaCsv}
              className="px-4 py-3 rounded-2xl bg-white hover:bg-[#FAF8F5] text-[#161412] font-bold text-xs flex items-center gap-2 transition-transform hover:-translate-y-0.5 shadow-warm-xs cursor-pointer"
              title="Télécharger le fichier CSV prêt pour Meta Ads Manager (Lookalike)"
            >
              <Download className="w-4 h-4 text-[#9E7431]" />
              <span>Export CSV Meta Lookalike</span>
            </button>
          </div>
        </div>

      </header>

      {/* ========================================================================= */}
      {/* 2. NAVIGATION ONGLETS STRATÉGIQUES                                       */}
      {/* ========================================================================= */}
      <nav className="flex items-center gap-1.5 border-b border-[#EAE5DC] pb-2 text-xs overflow-x-auto scrollbar-none" aria-label="Sous-sections Ciblage">
        <button
          type="button"
          onClick={() => setActiveTab('personas')}
          className={`py-2 px-3.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'personas'
              ? 'bg-[#191715] text-white shadow-xs'
              : 'bg-white text-[#161412] hover:bg-[#F2ECE1] border border-[#EAE5DC]'
          }`}
        >
          <Users className={`w-3.5 h-3.5 ${activeTab === 'personas' ? 'text-[#C8A97E]' : 'text-[#6E665B]'}`} />
          <span>1. Personas &amp; Audiences ({TARGET_PERSONAS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('studio')}
          className={`py-2 px-3.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'studio'
              ? 'bg-[#191715] text-white shadow-xs'
              : 'bg-white text-[#161412] hover:bg-[#F2ECE1] border border-[#EAE5DC]'
          }`}
        >
          <Megaphone className={`w-3.5 h-3.5 ${activeTab === 'studio' ? 'text-[#C8A97E]' : 'text-[#6E665B]'}`} />
          <span>2. Studio Créatif &amp; Copy ({AD_TEMPLATES.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('utm')}
          className={`py-2 px-3.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'utm'
              ? 'bg-[#191715] text-white shadow-xs'
              : 'bg-white text-[#161412] hover:bg-[#F2ECE1] border border-[#EAE5DC]'
          }`}
        >
          <Share2 className={`w-3.5 h-3.5 ${activeTab === 'utm' ? 'text-[#C8A97E]' : 'text-[#6E665B]'}`} />
          <span>3. Liens WhatsApp &amp; UTMs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roi')}
          className={`py-2 px-3.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'roi'
              ? 'bg-[#191715] text-white shadow-xs'
              : 'bg-white text-[#161412] hover:bg-[#F2ECE1] border border-[#EAE5DC]'
          }`}
        >
          <BarChart3 className={`w-3.5 h-3.5 ${activeTab === 'roi' ? 'text-[#C8A97E]' : 'text-[#6E665B]'}`} />
          <span>4. Simulateur Budget &amp; ROAS</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 3. ONGLET 1 : PERSONAS & AUDIENCES PUBLICITAIRES RÉSEAUX SOCIAUX         */}
      {/* ========================================================================= */}
      {activeTab === 'personas' && (
        <div className="space-y-6">
          
          {/* Sélecteur Rapide des 4 Cibles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TARGET_PERSONAS.map((persona) => {
              const isSelected = persona.id === selectedPersonaId;
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => setSelectedPersonaId(persona.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[120px] ${
                    isSelected
                      ? 'bg-[#191715] text-white border-[#191715] shadow-warm-xs'
                      : 'bg-white text-[#161412] border-[#EAE5DC] hover:border-[#9E7431]'
                  }`}
                >
                  <div className="space-y-1">
                    <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full inline-block font-bold ${
                      isSelected ? 'bg-white/20 text-[#C8A97E]' : 'bg-[#FAF8F5] text-[#9E7431] border border-[#EAE5DC]'
                    }`}>
                      {persona.badge}
                    </span>
                    <h2 className="text-xs font-bold leading-tight block mt-1">
                      {persona.name}
                    </h2>
                  </div>
                  <div className={`text-[11px] font-mono mt-2 ${isSelected ? 'text-white/70' : 'text-[#6E665B]'}`}>
                    {persona.budgetRange}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Fiche Détaillée du Persona Actif (Psychographie & Réseaux Sociaux) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Colonne Gauche : Diagnostic Psychographique (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-[#EAE5DC] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="border-b border-[#F0EBE1] pb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#9E7431] font-bold block">
                  Diagnostic Psychologique (SDT &amp; Croyances)
                </span>
                <h3 className="text-base font-bold text-[#161412] mt-0.5">
                  {activePersona.name}
                </h3>
                <p className="text-xs text-[#6E665B] mt-0.5">
                  {activePersona.role}
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] uppercase font-bold text-[#161412] block">
                    1. Désir Profond (Aspiration) :
                  </span>
                  <p className="text-[#6E665B] mt-0.5 leading-relaxed">
                    {activePersona.psychographics.coreDesire}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC]">
                  <span className="text-[11px] uppercase font-bold text-[#9E7431] block">
                    2. Peur &amp; Anxiété Cachée (Pain Point) :
                  </span>
                  <p className="text-[#161412] mt-0.5 font-medium leading-relaxed italic">
                    « {activePersona.psychographics.hiddenFear} »
                  </p>
                </div>

                <div>
                  <span className="text-[11px] uppercase font-bold text-[#161412] block">
                    3. Frein Majeur de Confiance :
                  </span>
                  <p className="text-[#6E665B] mt-0.5 leading-relaxed">
                    {activePersona.psychographics.trustBarrier}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC]">
                  <span className="text-[11px] uppercase font-bold text-[#161412] block">
                    4. Identité Revendiquée :
                  </span>
                  <p className="text-[#6E665B] mt-0.5 italic">
                    {activePersona.psychographics.identityCommitment}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#F0EBE1]">
                  <span className="text-[11px] uppercase font-bold text-[#9E7431] block">
                    ⚡ Déclencheur d&apos;Action Décisif :
                  </span>
                  <p className="text-[#161412] font-bold mt-0.5">
                    {activePersona.psychographics.decisionTrigger}
                  </p>
                </div>
              </div>

              {/* Offre Recommandée & Portée */}
              <div className="p-3.5 rounded-xl bg-[#191715] text-white space-y-1.5 text-xs">
                <span className="text-[10px] font-mono uppercase text-[#C8A97E] font-bold block">
                  Offre Recommandée dans les Campagnes :
                </span>
                <p className="font-semibold text-white leading-snug">
                  {activePersona.recommendedOffer}
                </p>
                <div className="flex items-center justify-between text-[11px] text-white/70 pt-1 border-t border-white/15">
                  <span>Portée cible : {activePersona.estimatedReachAbidjan}</span>
                  <span className="text-[#C8A97E]">CPL : {activePersona.expectedCpl}</span>
                </div>
              </div>
            </div>

            {/* Colonne Droite : Paramétrages Réseaux Sociaux Prêts à Injecter (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-[#EAE5DC] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
              
              <div className="border-b border-[#F0EBE1] pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#9E7431] font-bold block">
                    Configuration des Plateformes Publicitaires
                  </span>
                  <h3 className="text-base font-bold text-[#161412] mt-0.5">
                    Paramètres de Ciblage Prêts pour Meta, LinkedIn &amp; TikTok
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#161412] border border-[#EAE5DC]">
                  Normes Ads 2026
                </span>
              </div>

              {/* 1. META ADS (Facebook & Instagram) */}
              <div className="space-y-2 p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#161412] flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#9E7431]" />
                    <span>Meta Ads (Facebook &amp; Instagram)</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#6E665B]">Lead Gen &amp; WhatsApp Direct</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-[#6E665B] uppercase block font-bold">Zones Géographiques</span>
                    <span className="font-medium text-[#161412]">{activePersona.socialTargeting.meta.locations.join(' · ')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6E665B] uppercase block font-bold">Démographie &amp; Langues</span>
                    <span className="font-medium text-[#161412]">{activePersona.socialTargeting.meta.demographics}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-[#6E665B] uppercase block font-bold">Centres d&apos;Intérêt Précis</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {activePersona.socialTargeting.meta.interests.map((it, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-[#EAE5DC] text-[11px] text-[#161412]">
                          {it}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-[#6E665B] uppercase block font-bold">Audience Similaire (Lookalike)</span>
                    <span className="font-semibold text-[#9E7431]">{activePersona.socialTargeting.meta.lookalikeSource}</span>
                  </div>
                </div>
              </div>

              {/* 2. LINKEDIN ADS */}
              <div className="space-y-2 p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#161412] flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-[#9E7431]" />
                    <span>LinkedIn Ads (C-Levels &amp; Décideurs)</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#6E665B]">InMail &amp; Carrousels</span>
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-[#6E665B] uppercase block font-bold">Intitulés de Postes Cibles</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {activePersona.socialTargeting.linkedin.jobTitles.map((jt, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-[#EAE5DC] text-[11px] text-[#161412]">
                          {jt}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#6E665B] uppercase block font-bold">Entreprises &amp; Organisations Cibles à Abidjan</span>
                    <span className="text-[11px] text-[#6E665B]">
                      {activePersona.socialTargeting.linkedin.targetCompanies.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. TIKTOK & REELS INSTAGRAM */}
              <div className="space-y-2 p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#161412] flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#9E7431]" />
                    <span>TikTok &amp; Instagram Reels (Visites Immersives)</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#6E665B]">Format 9:16 Court</span>
                </div>

                <div className="space-y-1.5 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-[#6E665B] uppercase block font-bold">Style de Montage Recommandé :</span>
                    <p className="text-[#6E665B]">{activePersona.socialTargeting.tiktok.videoStyle}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6E665B] uppercase block font-bold">Accroche (Hook 3 premières secondes) :</span>
                    <p className="font-bold text-[#161412]">{activePersona.socialTargeting.tiktok.hookAngle}</p>
                  </div>
                </div>
              </div>

              {/* Bouton vers Studio Publicitaire */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('studio')}
                  className="px-4 py-2.5 rounded-xl bg-[#191715] hover:bg-black text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Voir les Annonces Prêtes pour ce Profil</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C8A97E]" />
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ONGLET 2 : STUDIO CRÉATIF & ANNONCES MULTICANALES                     */}
      {/* ========================================================================= */}
      {activeTab === 'studio' && (
        <div className="space-y-5">
          
          {/* Filtres par Plateforme */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: 'all', label: 'Toutes les plateformes' },
                { id: 'meta', label: 'Meta (Instagram / FB)' },
                { id: 'linkedin', label: 'LinkedIn Ads' },
                { id: 'tiktok', label: 'TikTok & Reels' },
                { id: 'google', label: 'Google Search' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlatformFilter(p.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    selectedPlatformFilter === p.id
                      ? 'bg-[#191715] text-white border-[#191715]'
                      : 'bg-white text-[#6E665B] border-[#EAE5DC] hover:border-[#191715]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-[#6E665B] font-mono">
              {filteredAds.length} créatives disponibles
            </div>
          </div>

          {/* Grille des Annonces Copywriting Prêtes à l'Emploi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredAds.map((ad) => {
              const isCopied = copiedId === ad.id;
              const fullCopyText = `${ad.headline}\n\n${ad.hook}\n\n${ad.body}\n\nAppel à l'action : ${ad.ctaText}`;

              return (
                <article
                  key={ad.id}
                  className="bg-white border border-[#EAE5DC] rounded-2xl p-6 space-y-4 hover:border-[#9E7431] transition-colors shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    
                    {/* Header Annonce */}
                    <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#191715] text-white">
                          {ad.platform.toUpperCase()}
                        </span>
                        <span className="text-[11px] font-semibold text-[#9E7431]">
                          {ad.awarenessLabel}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#6E665B]">
                        Réf. {ad.id}
                      </span>
                    </div>

                    {/* Headline & Hook */}
                    <div>
                      <h4 className="text-sm font-bold text-[#161412]">
                        {ad.headline}
                      </h4>
                      <blockquote className="mt-2 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-bold text-[#161412] italic leading-snug">
                        {ad.hook}
                      </blockquote>
                    </div>

                    {/* Corps de l'Annonce (Primary Text) */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#6E665B] font-bold block">
                        Texte Principal de l&apos;Annonce :
                      </span>
                      <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs text-[#161412] leading-relaxed whitespace-pre-line font-normal select-text">
                        {ad.body}
                      </div>
                    </div>

                    {/* Brief Visuel & Secret de Conversion */}
                    <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-1 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-[#161412] uppercase block">Brief Visuel Recommandé :</span>
                        <span className="text-[11px] text-[#6E665B]">{ad.visualBrief}</span>
                      </div>
                      <div className="pt-1 border-t border-[#EAE5DC]">
                        <span className="text-[10px] font-bold text-[#9E7431] uppercase block">Levier Psychologique :</span>
                        <span className="text-[11px] text-[#161412] font-medium">{ad.conversionSecret}</span>
                      </div>
                    </div>

                  </div>

                  {/* Actions Bas de Carte */}
                  <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-[#161412]">
                      Bouton Ads : « {ad.ctaText} »
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopy(fullCopyText, ad.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#191715] hover:bg-black text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#C8A97E]" />
                          <span>Copié dans le Presse-Papier !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#C8A97E]" />
                          <span>Copier l&apos;Annonce</span>
                        </>
                      )}
                    </button>
                  </div>

                </article>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ONGLET 3 : GÉNÉRATEUR DE LIENS WHATSAPP TRACKÉS (UTM) & EXPORT META    */}
      {/* ========================================================================= */}
      {activeTab === 'utm' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Colonne Gauche : Configurateur de Lien (6 cols) */}
          <div className="lg:col-span-6 bg-white border border-[#EAE5DC] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="border-b border-[#F0EBE1] pb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9E7431] font-bold block">
                Tracking d&apos;Attribution Multicanal
              </span>
              <h3 className="text-base font-bold text-[#161412] mt-0.5">
                Générateur de Liens WhatsApp avec Tags UTMs
              </h3>
              <p className="text-xs text-[#6E665B] mt-0.5">
                Identifiez instantanément quelle campagne, quel réseau social et quelle créative a déclenché chaque prospect dans le CRM.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold uppercase text-[#161412] block mb-1">
                  1. Source Publicitaire (utm_source) :
                </label>
                <select
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl px-3 py-2 text-xs text-[#161412] focus:outline-none focus:border-[#9E7431]"
                >
                  <option value="meta_ads">Meta Ads (Instagram / Facebook)</option>
                  <option value="linkedin_ads">LinkedIn Ads (InMail & Feed)</option>
                  <option value="tiktok_ads">TikTok Ads (Reels & Vidéo)</option>
                  <option value="google_ads">Google Ads (Search & Performance Max)</option>
                  <option value="newsletter_diaspora">Newsletter Spéciale Diaspora</option>
                  <option value="partenaire_notaire">Réseau Notarial & Banques Privées</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#161412] block mb-1">
                  2. Support / Format (utm_medium) :
                </label>
                <select
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl px-3 py-2 text-xs text-[#161412] focus:outline-none focus:border-[#9E7431]"
                >
                  <option value="cpc_carrousel">Carrousel Photos Archi (cpc_carrousel)</option>
                  <option value="cpc_video_reel">Reel / Vidéo Courte (cpc_video_reel)</option>
                  <option value="inmail_sponsorise">InMail Direct Décideur (inmail_sponsorise)</option>
                  <option value="search_exact">Mots-Clés Exacts Search (search_exact)</option>
                  <option value="story_swipe">Story Instagram Plein Écran (story_swipe)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#161412] block mb-1">
                  3. Nom de Campagne (utm_campaign) :
                </label>
                <input
                  type="text"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  placeholder="Ex : riviera_golf_expats_2026"
                  className="w-full bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl px-3 py-2 text-xs text-[#161412] focus:outline-none focus:border-[#9E7431]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#161412] block mb-1">
                  4. Accroche / Variante Créative (utm_content) :
                </label>
                <input
                  type="text"
                  value={utmContent}
                  onChange={(e) => setUtmContent(e.target.value)}
                  placeholder="Ex : hook_groupe_60kva_perkins"
                  className="w-full bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl px-3 py-2 text-xs text-[#161412] focus:outline-none focus:border-[#9E7431]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#161412] block mb-1">
                  5. Message WhatsApp Pré-rempli pour le Prospect :
                </label>
                <textarea
                  rows={3}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl p-2.5 text-xs text-[#161412] focus:outline-none focus:border-[#9E7431] resize-none"
                />
              </div>
            </div>

          </div>

          {/* Colonne Droite : Lien Résultant & Test Immédiat (6 cols) */}
          <div className="lg:col-span-6 space-y-5">
            
            <div className="bg-white border border-[#EAE5DC] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="border-b border-[#F0EBE1] pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#9E7431] font-bold block">
                    URL d&apos;Atterrissage Générée
                  </span>
                  <h3 className="text-base font-bold text-[#161412] mt-0.5">
                    Lien WhatsApp avec Traçage Intégré
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#161412] border border-[#EAE5DC]">
                  Prêt à coller dans vos Ads
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-mono text-[#161412] break-all select-all leading-relaxed">
                {generatedWhatsAppUrl}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedWhatsAppUrl);
                    setIsCopiedUtm(true);
                    setTimeout(() => setIsCopiedUtm(false), 2000);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#191715] hover:bg-black text-white text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  {isCopiedUtm ? (
                    <>
                      <Check className="w-4 h-4 text-[#C8A97E]" />
                      <span>Lien Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#C8A97E]" />
                      <span>Copier le Lien Tracké</span>
                    </>
                  )}
                </button>

                <a
                  href={generatedWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#161412] border border-[#EAE5DC] text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-4 h-4 text-[#9E7431]" />
                  <span>Tester sur WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Fiche Explicative Meta Custom Audience */}
            <div className="bg-white border border-[#EAE5DC] rounded-2xl p-5 sm:p-6 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#9E7431]" />
                <h4 className="text-sm font-bold text-[#161412]">
                  Création d&apos;Audiences Similaires (Lookalike Meta)
                </h4>
              </div>

              <p className="text-xs text-[#6E665B] leading-relaxed">
                Téléchargez la liste de vos {INITIAL_CONTACTS.length} contacts qualifiés au format standardisé Meta Ads. L&apos;algorithme de Meta identifiera automatiquement les profils ayant les mêmes caractéristiques patrimoniales et démographiques à Abidjan et dans la diaspora.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExportMetaCsv}
                  className="w-full py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE1] text-[#161412] border border-[#EAE5DC] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#9E7431]" />
                  <span>Télécharger le Fichier CSV (.csv) pour Meta Ads Manager</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ONGLET 4 : SIMULATEUR BUDGET & PRÉVISION DE RENTABILITÉ (ROAS)          */}
      {/* ========================================================================= */}
      {activeTab === 'roi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Colonne Gauche : Sliders de Paramétrage (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-[#EAE5DC] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
            <div className="border-b border-[#F0EBE1] pb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9E7431] font-bold block">
                Simulateur de Rentabilité Publicitaire
              </span>
              <h3 className="text-base font-bold text-[#161412] mt-0.5">
                Calibrez votre Investissement Média
              </h3>
              <p className="text-xs text-[#6E665B] mt-0.5">
                Modélisation basée sur les coûts par mille (CPM) réels d&apos;Abidjan et les taux de conversion du marché prestige.
              </p>
            </div>

            {/* Slider 1 : Budget Publicitaire Mensuel */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline text-xs">
                <span className="font-bold text-[#161412]">Budget Pub Mensuel :</span>
                <span className="text-sm font-bold text-[#9E7431] font-mono">
                  {formatFCFA(monthlyBudgetFCFA)}
                </span>
              </div>
              <input
                type="range"
                min={250000}
                max={5000000}
                step={250000}
                value={monthlyBudgetFCFA}
                onChange={(e) => setMonthlyBudgetFCFA(Number(e.target.value))}
                className="w-full accent-[#9E7431] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#6E665B]">
                <span>250 000 FCFA</span>
                <span>2 500 000 FCFA</span>
                <span>5 000 000 FCFA</span>
              </div>
            </div>

            {/* Slider 2 : CPM Cible Qualifié */}
            <div className="space-y-2 pt-2 border-t border-[#F0EBE1]">
              <div className="flex justify-between items-baseline text-xs">
                <span className="font-bold text-[#161412]">CPM Cible (Coût pour 1 000 impressions) :</span>
                <span className="font-bold text-[#161412] font-mono">
                  {formatFCFA(targetCpm)}
                </span>
              </div>
              <input
                type="range"
                min={800}
                max={3000}
                step={100}
                value={targetCpm}
                onChange={(e) => setTargetCpm(Number(e.target.value))}
                className="w-full accent-[#9E7431] cursor-pointer"
              />
              <p className="text-[11px] text-[#6E665B]">
                Benchmark : 1 200 à 1 800 FCFA pour des cibles expatriées et hauts revenus à Abidjan.
              </p>
            </div>

            {/* Ratios de Conversion Éprouvés */}
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-2 text-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#161412] font-bold block">
                Ratios de Conversion Appliqués :
              </span>
              <div className="space-y-1 text-[11px] text-[#6E665B]">
                <div className="flex justify-between">
                  <span>Taux de clic annonce (CTR) :</span>
                  <span className="font-bold text-[#161412]">{ctrPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Transformation Clic → Lead WhatsApp :</span>
                  <span className="font-bold text-[#161412]">{conversionToWhatsAppRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Transformation Lead → Visite Terrain :</span>
                  <span className="font-bold text-[#161412]">{visitBookingRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Clôture Visite → Bail Signé :</span>
                  <span className="font-bold text-[#9E7431]">{leaseClosingRate}%</span>
                </div>
              </div>
            </div>

          </div>

          {/* Colonne Droite : Décomposition de l'Entonnoir & ROAS (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-[#EAE5DC] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
            
            <div className="border-b border-[#F0EBE1] pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#9E7431] font-bold block">
                  Résultats Prévisionnels Mensuels
                </span>
                <h3 className="text-base font-bold text-[#161412] mt-0.5">
                  Projection des Baux Signés &amp; Honoraires d&apos;Agence
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-[#6E665B] block uppercase">Multiplicateur ROAS</span>
                <span className="text-2xl font-bold text-[#9E7431]">{roasMultiplier}x</span>
              </div>
            </div>

            {/* Étapes de l'Entonnoir Graphique Monochrome & Or */}
            <div className="space-y-3">
              
              {/* Étape 1 : Impressions */}
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6E665B] block">1. Visibilité Totale (Impressions Ads)</span>
                  <span className="text-base font-bold text-[#161412]">{impressions.toLocaleString()} affichages</span>
                </div>
                <span className="text-xs text-[#6E665B] font-mono">Abidjan &amp; Diaspora</span>
              </div>

              {/* Étape 2 : Clics Qualifiés */}
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6E665B] block">2. Clics Qualifiés vers WhatsApp / Fiche</span>
                  <span className="text-base font-bold text-[#161412]">{qualifiedClicks.toLocaleString()} clics</span>
                </div>
                <span className="text-xs text-[#6E665B] font-mono">CTR {ctrPercent}%</span>
              </div>

              {/* Étape 3 : Leads WhatsApp Qualifiés */}
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#9E7431] block">3. Conversations WhatsApp Initiées</span>
                  <span className="text-base font-bold text-[#161412]">{generatedLeads} prospects en discussion</span>
                </div>
                <span className="text-xs font-bold text-[#9E7431] font-mono">
                  {formatFCFA(Math.round(monthlyBudgetFCFA / generatedLeads))} / lead
                </span>
              </div>

              {/* Étape 4 : Visites Physiques Terrain */}
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6E665B] block">4. Visites Physiques Programmées</span>
                  <span className="text-base font-bold text-[#161412]">{physicalVisits} visites confirmées</span>
                </div>
                <span className="text-xs text-[#6E665B] font-mono">Par négociateur terrain</span>
              </div>

              {/* Étape 5 : Baux Signés sous Séquestre */}
              <div className="p-4 rounded-xl bg-[#191715] text-white flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#C8A97E] block">5. Baux Signés sous Séquestre Me Traoré</span>
                  <span className="text-xl font-bold text-white">{closedDeals} nouveaux baux / mois</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/70 block uppercase">Honoraires Agence</span>
                  <span className="text-base font-bold text-[#C8A97E]">
                    {formatFCFA(agencyCommission)}
                  </span>
                </div>
              </div>

            </div>

            {/* Bilan Économique Récapitulatif */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[#6E665B] block">Investissement Publicitaire : <b>{formatFCFA(monthlyBudgetFCFA)}</b></span>
                <span className="text-[#161412] font-semibold block mt-0.5">
                  Volume de loyers annuels captés : <b>{formatFCFA(closedDeals * avgMonthlyRent * 12)}</b>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('utm')}
                className="px-4 py-2 rounded-xl bg-[#191715] hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>Générer les Campagnes Trackées</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C8A97E]" />
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
