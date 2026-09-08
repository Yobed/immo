import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { FavoriteButton } from './FavoriteButton'
import { colors, spacing, borderRadius, typography } from '../constants/theme'
import type { PublicListing } from '../lib/catalogue-api'

export type BienListItem = PublicListing

interface BienCardProps {
  bien: BienListItem
}

export function BienCard({ bien }: BienCardProps) {
  const router = useRouter()

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/bien/[id]', params: { id: bien.id, source: bien.source } })}
      activeOpacity={0.85}
    >
      <View>
        <Image
          source={bien.photo_principale ? { uri: bien.photo_principale } : require('../assets/icon.png')}
          style={styles.image}
          contentFit="cover"
          transition={200}
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        />
        {bien.source === 'bogbes' && <FavoriteButton bienId={bien.id} onImage style={styles.fav} />}
      </View>
      <View style={styles.body}>
        <Text style={styles.titre} numberOfLines={2}>{bien.titre}</Text>
        <Text style={styles.commune}>{bien.commune} · {bien.type_bien}</Text>
        <Text style={styles.prix}>{bien.prix_label}</Text>
        <Text style={styles.reference}>{bien.reference}</Text>
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
  fav: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  body: { padding: spacing.md },
  titre: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  commune: { ...typography.caption, color: colors.textLight, marginBottom: spacing.sm },
  prix: { fontSize: 16, fontWeight: '700', color: colors.secondary },
  reference: { fontSize: 12, color: colors.textLight, marginTop: spacing.xs },
})
