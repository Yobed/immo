import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Property, Contact } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const EUR_EXCHANGE_RATE = 655.957;

/**
 * Formate un montant en FCFA avec espaces séparateurs (ex: 150 000 000 FCFA)
 */
export function formatFCFA(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

/**
 * Formate un montant FCFA converti en Euros
 */
export function formatEUR(amountFCFA?: number | null): string {
  if (amountFCFA === undefined || amountFCFA === null || isNaN(amountFCFA)) return '0 €';
  const inEur = Math.round(amountFCFA / EUR_EXCHANGE_RATE);
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(inEur) + ' €';
}

/**
 * Formate un montant avec conversion possible en Euros pour la diaspora
 */
export function formatCurrency(amountFCFA: number, currency: 'FCFA' | 'EUR' = 'FCFA'): string {
  if (amountFCFA === undefined || amountFCFA === null || isNaN(amountFCFA)) return '0 FCFA';
  if (currency === 'EUR') {
    const inEur = Math.round(amountFCFA / EUR_EXCHANGE_RATE);
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(inEur) + ' €';
  }
  return formatFCFA(amountFCFA);
}

/**
 * Génère le lien WhatsApp direct avec message pré-rempli
 */
export function getWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Moteur de matching intelligent entre un contact et un bien
 */
export function calculateMatchScore(contact: Contact, property: Property): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const isSaleInterest = contact.type === 'buyer' || contact.type === 'investor';
  const isRentInterest = contact.type === 'tenant';

  if ((isSaleInterest && property.operation === 'sale') || (isRentInterest && property.operation === 'rent')) {
    score += 30;
    reasons.push(property.operation === 'sale' ? 'Opération Vente conforme' : 'Opération Location conforme');
  } else if (!isSaleInterest && !isRentInterest) {
    score += 15;
  }

  if (contact.budget_max) {
    if (property.price <= contact.budget_max) {
      if (contact.budget_min && property.price >= contact.budget_min) {
        score += 30;
        reasons.push('Prix parfaitement dans la fourchette budgétaire');
      } else {
        score += 25;
        reasons.push('Prix inférieur au budget maximum');
      }
    } else if (property.price <= contact.budget_max * 1.1) {
      score += 15;
      reasons.push('Prix négociable proche du budget max (+10%)');
    }
  } else {
    score += 15;
  }

  if (contact.preferred_districts && contact.preferred_districts.length > 0) {
    const districtMatch = contact.preferred_districts.some(
      (d) => property.district.toLowerCase().includes(d.toLowerCase()) || 
             property.city.toLowerCase().includes(d.toLowerCase())
    );
    if (districtMatch) {
      score += 25;
      reasons.push(`Quartier souhaité (${property.district})`);
    }
  } else {
    score += 15;
  }

  if (contact.preferred_types && contact.preferred_types.length > 0) {
    if (contact.preferred_types.includes(property.property_type)) {
      score += 15;
      reasons.push(`Typologie recherchée (${property.property_type})`);
    }
  } else {
    score += 10;
  }

  return {
    score: Math.min(100, score),
    reasons,
  };
}
