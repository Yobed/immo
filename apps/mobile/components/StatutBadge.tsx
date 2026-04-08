import { View, Text, StyleSheet } from 'react-native'
import { colors, borderRadius } from '../constants/theme'

type StatutType =
  | 'en_attente'
  | 'confirmee'
  | 'annulee'
  | 'terminee'
  | 'approuve'
  | 'rejete'
  | 'en_cours'
  | 'non_soumis'

interface StatutBadgeProps {
  statut: StatutType
  size?: 'sm' | 'md'
}

const STATUT_CONFIG: Record<StatutType, { label: string; bg: string; text: string }> = {
  en_attente: { label: 'En attente',  bg: '#FEF9E7', text: '#D4AC0D' },
  confirmee:  { label: 'Confirmée',   bg: '#EAFAF1', text: colors.accent },
  annulee:    { label: 'Annulée',     bg: '#FDEDEC', text: colors.danger },
  terminee:   { label: 'Terminée',    bg: '#EBF5FB', text: colors.primary },
  approuve:   { label: 'Approuvé',    bg: '#EAFAF1', text: colors.accent },
  rejete:     { label: 'Rejeté',      bg: '#FDEDEC', text: colors.danger },
  en_cours:   { label: 'En cours',    bg: '#EBF5FB', text: colors.primary },
  non_soumis: { label: 'Non soumis',  bg: '#F2F3F4', text: colors.textLight },
}

export function StatutBadge({ statut, size = 'md' }: StatutBadgeProps) {
  const config = STATUT_CONFIG[statut] ?? { label: statut, bg: '#F2F3F4', text: colors.textLight }
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        size === 'sm' && styles.badgeSm,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: config.text },
          size === 'sm' && styles.textSm,
        ]}
      >
        {config.label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 2 },
  text: { fontSize: 13, fontWeight: '600' },
  textSm: { fontSize: 11 },
})
