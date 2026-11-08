/**
 * Service Catalogue Biens & Synchronisation CRM pour l'Agent WhatsApp
 */

import fs from 'fs';
import path from 'path';

// Catalogue local de référence (Abidjan)
export const PROPERTIES_CATALOG = [
  {
    reference: 'VIL-RG-2026',
    title: 'Villa Duplex Contemporaine avec Piscine & Vue Lagune',
    operation: 'sale',
    type: 'villa',
    price: 450000000,
    district: 'Cocody Riviera Golf',
    surface: 650,
    bedrooms: 5,
    has_pool: true,
    has_generator: true,
    legal_status: 'ACD',
    summary: 'Villa d\'architecte avec piscine à débordement, salon double hauteur, groupe électrogène, sécurisée à la Riviera Golf.',
  },
  {
    reference: 'PNT-Z4-104',
    title: 'Penthouse de Prestige avec Terrasse Panoramique',
    operation: 'sale',
    type: 'penthouse',
    price: 320000000,
    district: 'Marcory Zone 4',
    surface: 380,
    bedrooms: 4,
    has_pool: true,
    has_generator: true,
    legal_status: 'TF',
    summary: 'Dernier étage avec vue panoramique 360° sur Abidjan et lagune, ascenseur privatif et jacuzzi en Zone 4.',
  },
  {
    reference: 'APP-PL-04',
    title: 'Appartement Meublé Standing 4 Pièces en Location',
    operation: 'rent',
    type: 'appartement',
    price: 1800000,
    district: 'Plateau',
    surface: 190,
    bedrooms: 3,
    has_pool: false,
    has_generator: true,
    legal_status: 'CMP',
    summary: 'Grand standing meublé au Plateau avec conciergerie 24/7, groupe et salle de sport. Idéal cadres dirigeants.',
  },
  {
    reference: 'TER-BG-600',
    title: 'Terrain Clôturé avec ACD Titre Foncier à Bingerville',
    operation: 'sale',
    type: 'terrain',
    price: 55000000,
    district: 'Bingerville',
    surface: 600,
    bedrooms: 0,
    has_pool: false,
    has_generator: false,
    legal_status: 'ACD',
    summary: 'Parcelle d\'angle 600 m² viabilisée en cité fermée avec ACD vérifié pour construction de villa.',
  },
  {
    reference: 'VIL-AS-901',
    title: 'Villa Balnéaire Pieds dans l\'Eau à Assinie PK 9',
    operation: 'sale',
    type: 'villa',
    price: 680000000,
    district: 'Assinie',
    surface: 850,
    bedrooms: 6,
    has_pool: true,
    has_generator: true,
    legal_status: 'ACD',
    summary: 'Pieds dans l\'eau avec ponton bateau privé, piscine et paillote lounge à Assinie-Mafia.',
  }
];

export function formatFCFA(amount) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount) + ' FCFA';
}

export function searchCatalog(criteria = {}) {
  const { operation, type, district, maxPrice } = criteria;
  
  return PROPERTIES_CATALOG.filter((p) => {
    if (operation && p.operation !== operation) return false;
    if (type && p.type !== type) return false;
    if (district && !p.district.toLowerCase().includes(district.toLowerCase())) return false;
    if (maxPrice && p.price > maxPrice) return false;
    return true;
  });
}

export function formatPropertyCardWhatsApp(property) {
  return `🏡 *${property.title}*
📍 Quartier : ${property.district}
💰 Prix : *${formatFCFA(property.price)}${property.operation === 'rent' ? ' / mois' : ''}*
📐 Surface : ${property.surface} m² ${property.bedrooms > 0 ? `| ${property.bedrooms} chambres` : ''}
📜 Titre foncier : *${property.legal_status}* vérifié
⚡ Équipements : ${property.has_pool ? 'Piscine ' : ''}${property.has_generator ? '• Groupe électrogène' : ''}
🏷️ Réf : ${property.reference}
📖 Plaquette interactive Heyzine : https://heyzine.com/flip-book/e12d59cb9e.html
👉 Voir sur le site : http://localhost:3000/biens/${property.reference}`;
}
