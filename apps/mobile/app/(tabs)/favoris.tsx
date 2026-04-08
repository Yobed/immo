import { useState, useEffect, useCallback } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { useSession } from '../../hooks/useAuth'
import { BienCard, BienListItem } from '../../components/BienCard'
import { colors, spacing } from '../../constants/theme'

export default function FavorisScreen() {
  const { session } = useSession()
  const [favoris, setFavoris] = useState<BienListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchFavoris() {
    if (!session?.user?.id) return

    const { data, error } = await supabase
      .from('favoris')
      .select('bien_id, biens(id, titre, prix_mois_fcfa, prix_vente_fcfa, commune, type_bien, statut)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const items: BienListItem[] = data
        .filter((f) => f.biens)
        .map((f) => {
          const b = f.biens as {
            id: string
            titre: string
            prix_mois_fcfa: number | null
            prix_vente_fcfa: number | null
            commune: string
            type_bien: string
            statut: string
          }
          return {
            id: b.id,
            titre: b.titre,
            prix_mois_fcfa: b.prix_mois_fcfa,
            prix_vente_fcfa: b.prix_vente_fcfa,
            commune: b.commune,
            type_bien: b.type_bien,
            statut: b.statut,
            cover_url: null,
          }
        })
      setFavoris(items)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchFavoris().finally(() => setLoading(false))
  }, [session])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchFavoris()
    setRefreshing(false)
  }, [session])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favoris}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BienCard bien={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>♡</Text>
            <Text style={styles.empty}>Aucun favori pour l'instant</Text>
            <Text style={styles.emptyHint}>
              Ajoutez des biens à vos favoris depuis l'onglet Accueil
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  emptyContainer: { alignItems: 'center', marginTop: 64, paddingHorizontal: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md, color: colors.border },
  empty: { fontSize: 16, color: colors.textLight, fontWeight: '600', textAlign: 'center' },
  emptyHint: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginTop: spacing.sm },
})
