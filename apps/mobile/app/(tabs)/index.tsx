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
import { supabase } from '../../lib/supabase'
import { pickCover, type MediaRow } from '../../lib/media'
import { BienCard, BienListItem } from '../../components/BienCard'
import { colors, spacing } from '../../constants/theme'

type BienListRow = {
  id: string
  titre: string
  prix_mois_fcfa: number | null
  prix_vente_fcfa: number | null
  commune: string
  type_bien: string
  statut: string
  biens_medias?: MediaRow[] | null
}

export default function AccueilScreen() {
  const [biens, setBiens] = useState<BienListItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchBiens(searchText = '') {
    let query = supabase
      .from('biens')
      .select('id, titre, prix_mois_fcfa, prix_vente_fcfa, commune, type_bien, statut, biens_medias(url, est_couverture, ordre, type)')
      .eq('statut', 'publie')
      .order('created_at', { ascending: false })
      .limit(20)

    if (searchText) {
      query = query.or(`commune.ilike.%${searchText}%,titre.ilike.%${searchText}%`)
    }

    const { data, error } = await query
    if (!error && data) {
      setBiens(
        (data as unknown as BienListRow[]).map((b) => ({
          id: b.id,
          titre: b.titre,
          prix_mois_fcfa: b.prix_mois_fcfa,
          prix_vente_fcfa: b.prix_vente_fcfa,
          commune: b.commune,
          type_bien: b.type_bien,
          statut: b.statut,
          cover_url: pickCover(b.biens_medias),
        }))
      )
    }
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
        ListEmptyComponent={<Text style={styles.empty}>Aucun bien trouvé</Text>}
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
