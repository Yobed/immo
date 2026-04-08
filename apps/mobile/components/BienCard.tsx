import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { formatFCFA } from '@immo-ci/shared'
import type { Database } from '@immo-ci/shared'
import { colors, spacing, borderRadius, typography } from '../constants/theme'

// Type Bien depuis la base de données réelle (pas de prix unique ni photo_principale_url)
type BienRow = Database['public']['Tables']['biens']['Row']

// Type étendu pour l'affichage dans les listes (avec cover_url optionnel depuis biens_medias)
export interface BienListItem {
  id: string
  titre: string
  prix_mois_fcfa: number | null
  prix_vente_fcfa: number | null
  commune: string
  type_bien: string
  statut: string
  cover_url?: string | null
}

interface BienCardProps {
  bien: BienListItem
}

export function BienCard({ bien }: BienCardProps) {
  const router = useRouter()

  // Afficher le prix mensuel en priorité, sinon le prix de vente
  const prix = bien.prix_mois_fcfa ?? bien.prix_vente_fcfa ?? 0
  const prixLabel = bien.prix_mois_fcfa
    ? `${formatFCFA(prix)}/mois`
    : bien.prix_vente_fcfa
    ? formatFCFA(prix)
    : 'Prix non renseigné'

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/bien/${bien.id}`)}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: bien.cover_url ?? 'https://via.placeholder.com/300x200?text=Immo+CI' }}
        style={styles.image}
        contentFit="cover"
        transition={200}
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
      />
      <View style={styles.body}>
        <Text style={styles.titre} numberOfLines={2}>{bien.titre}</Text>
        <Text style={styles.commune}>{bien.commune} · {bien.type_bien}</Text>
        <Text style={styles.prix}>{prixLabel}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 180 },
  body: { padding: spacing.md },
  titre: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  commune: { ...typography.caption, color: colors.textLight, marginBottom: spacing.sm },
  prix: { fontSize: 16, fontWeight: '700', color: colors.secondary },
})
