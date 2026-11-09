// Contrôle rapide de la logique de recherche : node scripts/check-property-search.mjs
import assert from 'node:assert/strict';
import { parseFilters, filtersToQuery, filterProperties, similarProperties, EMPTY_FILTERS } from '../lib/property-search.ts';

const p = (id, district, property_type, price) => ({ id, district, property_type, price, operation: 'rent' });
const list = [p('a', 'Plateau', 'appartement', 1_800_000), p('b', 'Cocody', 'villa', 3_800_000), p('c', 'Cocody', 'villa', 5_500_000)];

// URL invalide : valeurs ignorées
assert.deepEqual(parseFilters(new URLSearchParams('type=chateau&budget=abc&tri=x')), EMPTY_FILTERS);
// Aller-retour URL
const f = { district: 'Cocody', type: 'villa', budgetMax: 4_000_000, sort: 'price_desc' };
assert.deepEqual(parseFilters(new URLSearchParams(filtersToQuery(f))), f);
assert.equal(filtersToQuery(EMPTY_FILTERS), '');
// Filtrage + tri
assert.deepEqual(filterProperties(list, { ...EMPTY_FILTERS, district: 'Cocody' }).map((x) => x.id), ['b', 'c']);
assert.deepEqual(filterProperties(list, { ...EMPTY_FILTERS, budgetMax: 4_000_000 }).map((x) => x.id), ['a', 'b']);
assert.deepEqual(filterProperties(list, { ...EMPTY_FILTERS, sort: 'price_desc' }).map((x) => x.id), ['c', 'b', 'a']);
assert.deepEqual(list.map((x) => x.id), ['a', 'b', 'c'], 'le tri ne doit pas muter la liste');
// Biens similaires : exclut le bien courant
assert.deepEqual(similarProperties(list, list[1]).map((x) => x.id), ['c']);
console.log('property-search OK');
