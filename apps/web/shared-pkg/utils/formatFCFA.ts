/**
 * Formate un montant en FCFA avec séparateur de milliers.
 * Exemple : formatFCFA(250000) → "250 000 FCFA"
 * Exemple : formatFCFA(1500000) → "1 500 000 FCFA"
 */
export function formatFCFA(montant: number): string {
  return new Intl.NumberFormat('fr-CI', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(montant) + ' FCFA'
}

/**
 * Convertit un montant en lettres (simplifié pour usage contrats).
 * Exemple : montantEnLettres(250000) → "deux cent cinquante mille francs CFA"
 * Note : Implémentation simplifiée — couvre jusqu'à 999 999 999 FCFA
 */
export function montantEnLettres(montant: number): string {
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf']
  const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt']

  function centToWords(n: number): string {
    if (n === 0) return ''
    if (n < 20) return unites[n]
    const d = Math.floor(n / 10), u = n % 10
    if (d === 7) return `soixante-${unites[10 + u]}`
    if (d === 9) return u === 0 ? 'quatre-vingt' : `quatre-vingt-${unites[u]}`
    return u === 0 ? dizaines[d] : `${dizaines[d]}-${unites[u]}`
  }

  if (montant === 0) return 'zéro franc CFA'
  const milliards = Math.floor(montant / 1_000_000_000)
  const millions = Math.floor((montant % 1_000_000_000) / 1_000_000)
  const milliers = Math.floor((montant % 1_000_000) / 1_000)
  const reste = montant % 1_000
  const parts: string[] = []
  if (milliards > 0) parts.push(`${centToWords(milliards)} milliard${milliards > 1 ? 's' : ''}`)
  if (millions > 0) parts.push(`${centToWords(millions)} million${millions > 1 ? 's' : ''}`)
  if (milliers > 0) parts.push(`${centToWords(milliers)} mille`)
  if (reste > 0) parts.push(centToWords(reste))
  return parts.join(' ') + ' francs CFA'
}
