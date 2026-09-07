import { useState, useEffect, useCallback } from 'react'
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
} from 'react-native'
import { BienCard, BienListItem } from '../../components/BienCard'
import { colors, spacing } from '../../constants/theme'

type WebAnnonce = {
  id: number
  titre: string | null
  type_bien: string | null
  commune: string | null
  prix_fcfa: number | null
  surface_m2: number | null
  nb_pieces: number | null
  photo_principale: string | null
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://www.bogbesgroup.com'

export default function AccueilScreen() {
  const [biens, setBiens] = useState<BienListItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchBiens(searchText = '') {
    try {
      const params = searchText ? `?q=${encodeURIComponent(searchText)}` : ''
      const response = await fetch(`${API_URL}/api/mobile/annonces${params}`)
      const payload = await response.json() as { items?: WebAnnonce[] }
      if (response.ok && payload.items) {
      setError(null)
      setBiens(
        payload.items.map((b) => ({
          id: String(b.id),
          titre: b.titre ?? `${b.type_bien ?? 'Bien'} à ${b.commune ?? 'Abidjan'}`,
          prix_mois_fcfa: null,
          prix_vente_fcfa: b.prix_fcfa,
          commune: b.commune ?? '',
          type_bien: b.type_bien ?? '',
          statut: 'publie',
          cover_url: b.photo_principale,
        }))
      )
      } else setError('Impossible de charger les annonces. Réessayez.')
    } catch { setError('Connexion impossible. Vérifiez votre réseau.') }
  }

  useEffect(() => {
    setLoading(true)
    fetchBiens().finally(() => setLoading(false))
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchBiens(search)
    setRefreshing(false)
  }, [search])

  const onSearch = useCallback((text: string) => {
    setSearch(text)
    fetchBiens(text)
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Rechercher par commune ou titre..."
        placeholderTextColor={colors.textLight}
        value={search}
        onChangeText={onSearch}
      />
      <FlatList
        data={biens}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BienCard bien={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{error ?? 'Aucun bien trouvé'}</Text>}
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
  searchBar: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 14,
  },
  list: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  empty: {
    textAlign: 'center',
    color: colors.textLight,
    marginTop: 48,
    fontSize: 15,
  },
})
