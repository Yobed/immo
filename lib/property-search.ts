import type { Property, PropertyType, PropertyStatus } from './types';

export const AGENCY_NAME = 'Agence Immo';
export const AGENCY_PHONE = '2250788421920';
export const AGENCY_PHONE_DISPLAY = '+225 07 88 42 19 20';

export const TYPE_LABELS: Record<PropertyType, string> = {
  villa: 'Villa',
  appartement: 'Appartement',
  penthouse: 'Penthouse',
  terrain: 'Terrain',
  bureau: 'Bureau',
  immeuble: 'Immeuble',
};

export const STATUS_LABELS: Partial<Record<PropertyStatus, string>> = {
  under_offer: 'Sous offre',
  under_contract: 'Sous compromis',
  reserved: 'Réservé',
  rented: 'Loué',
  sold: 'Vendu',
};

/** Paliers de budget mensuel proposés dans les filtres (FCFA). */
export const BUDGET_STEPS = [1_500_000, 2_500_000, 3_500_000, 5_000_000];

export type SortOrder = 'recent' | 'price_asc' | 'price_desc';

export type PropertyFilters = {
  district: string;
  type: PropertyType | '';
  budgetMax: number | null;
  sort: SortOrder;
};

export const EMPTY_FILTERS: PropertyFilters = { district: '', type: '', budgetMax: null, sort: 'recent' };

/** Lit les filtres depuis l'URL en ignorant toute valeur invalide. */
export function parseFilters(params: URLSearchParams): PropertyFilters {
  const type = params.get('type') ?? '';
  const budget = Number(params.get('budget'));
  const sort = params.get('tri');
  return {
    district: params.get('quartier') ?? '',
    type: type in TYPE_LABELS ? (type as PropertyType) : '',
    budgetMax: Number.isFinite(budget) && budget > 0 ? budget : null,
    sort: sort === 'price_asc' || sort === 'price_desc' ? sort : 'recent',
  };
}

/** Sérialise les filtres non vides en query string (sans le `?`). */
export function filtersToQuery(filters: PropertyFilters): string {
  const params = new URLSearchParams();
  if (filters.district) params.set('quartier', filters.district);
  if (filters.type) params.set('type', filters.type);
  if (filters.budgetMax) params.set('budget', String(filters.budgetMax));
  if (filters.sort !== 'recent') params.set('tri', filters.sort);
  return params.toString();
}

export function filterProperties(properties: Property[], filters: PropertyFilters): Property[] {
  const matches = properties.filter(
    (p) =>
      (!filters.district || p.district === filters.district) &&
      (!filters.type || p.property_type === filters.type) &&
      (!filters.budgetMax || p.price <= filters.budgetMax),
  );
  if (filters.sort === 'price_asc') return [...matches].sort((a, b) => a.price - b.price);
  if (filters.sort === 'price_desc') return [...matches].sort((a, b) => b.price - a.price);
  return matches;
}

/** Valeurs distinctes présentes dans l'inventaire, pour alimenter les sélecteurs. */
export function listDistricts(properties: Property[]): string[] {
  return [...new Set(properties.map((p) => p.district))].sort((a, b) => a.localeCompare(b, 'fr'));
}

export function listTypes(properties: Property[]): PropertyType[] {
  return [...new Set(properties.map((p) => p.property_type))];
}

/** Biens comparables : même type ou même quartier, hors bien courant. */
export function similarProperties(properties: Property[], current: Property, limit = 3): Property[] {
  return properties
    .filter((p) => p.id !== current.id && (p.property_type === current.property_type || p.district === current.district))
    .slice(0, limit);
}

export function priceSuffix(property: Property): string {
  return property.operation === 'rent' ? '/ mois' : '';
}
