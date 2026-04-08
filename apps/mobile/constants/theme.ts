// Palette officielle Immo CI — StyleSheet natif uniquement (pas NativeWind)
export const colors = {
  primary: '#1A5276',    // bleu profond CI
  secondary: '#E67E22',  // orange CI
  accent: '#27AE60',     // vert succès
  danger: '#E74C3C',     // rouge erreur/danger
  text: '#2C3E50',       // texte principal
  textLight: '#8E9EAB',  // texte secondaire
  background: '#F8F9FA', // fond général
  white: '#FFFFFF',
  border: '#D5D8DC',
  card: '#FFFFFF',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
}

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  price: { fontSize: 16, fontWeight: '700' as const, fontFamily: 'JetBrains Mono' },
}
