import { useState, useEffect, useCallback, useRef } from 'react'
import { View, FlatList, TextInput, StyleSheet, ActivityIndicator, Text, RefreshControl, Pressable } from 'react-native'
import { BienCard } from '../../components/BienCard'
import { colors, spacing } from '../../constants/theme'
import { fetchCataloguePage, type PublicListing } from '../../lib/catalogue-api'

const PAGE_SIZE = 24

export default function AccueilScreen() {
  const [biens, setBiens] = useState<PublicListing[]>([])
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestNumber = useRef(0)
  const controller = useRef<AbortController | null>(null)

  const load = useCallback(async (query: string, nextPage: number, append = false) => {
    const sequence = ++requestNumber.current
    if (!append) controller.current?.abort()
    const current = new AbortController()
    controller.current = current
    try {
      const payload = await fetchCataloguePage({ query, page: nextPage, limit: PAGE_SIZE, signal: current.signal })
      if (sequence !== requestNumber.current) return
      setError(null)
      setTotal(payload.total)
      setPage(payload.page)
      setHasMore(payload.hasMore)
      setBiens(previous => append
        ? [...new Map([...previous, ...payload.items].map(item => [`${item.source}:${item.id}`, item])).values()]
        : payload.items)
    } catch (reason) {
      if (current.signal.aborted || sequence !== requestNumber.current) return
      setError(reason instanceof Error ? reason.message : 'Connexion impossible. Vérifiez votre réseau.')
      if (!append) setBiens([])
    }
  }, [])

  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      setLoading(true)
      load(search, 0).finally(() => {
        if (active) setLoading(false)
      })
    }, 300)
    return () => { active = false; clearTimeout(timer); controller.current?.abort() }
  }, [search, load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load(search, 0)
    setRefreshing(false)
  }, [search, load])

  const onEndReached = useCallback(async () => {
    if (!hasMore || loadingMore || loading || refreshing) return
    setLoadingMore(true)
    await load(search, page + 1, true)
    setLoadingMore(false)
  }, [hasMore, loadingMore, loading, refreshing, load, search, page])

  return <View style={styles.container}>
    <View style={styles.searchBlock}>
      <TextInput
        style={styles.searchBar}
        placeholder="Commune, quartier ou type de bien"
        placeholderTextColor={colors.textLight}
        value={search}
        onChangeText={setSearch}
        accessibilityLabel="Rechercher une annonce"
        returnKeyType="search"
      />
      <Text style={styles.summary}>{total == null ? 'Catalogue des annonces web' : `${total.toLocaleString('fr-FR')} annonce${total > 1 ? 's' : ''} avec photos`}</Text>
    </View>
    {loading ? <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.loadingText}>Mise à jour des annonces…</Text></View> :
    <FlatList
      data={biens}
      keyExtractor={item => `${item.source}:${item.id}`}
      renderItem={({ item }) => <BienCard bien={item} />}
      contentContainerStyle={styles.list}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null}
      ListEmptyComponent={<View style={styles.emptyBox}><Text style={styles.empty}>{error ?? 'Aucune annonce ne correspond à cette recherche.'}</Text>{error && <Pressable style={styles.retry} onPress={() => { setLoading(true); load(search, 0).finally(() => setLoading(false)) }}><Text style={styles.retryText}>Réessayer</Text></Pressable>}</View>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    />}
  </View>
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  loadingText: { fontSize: 15, color: colors.textLight },
  searchBlock: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  searchBar: { minHeight: 48, paddingHorizontal: spacing.md, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, fontSize: 16 },
  summary: { marginTop: spacing.sm, color: colors.textLight, fontSize: 14, fontWeight: '600' },
  list: { paddingTop: spacing.sm, paddingBottom: spacing.xl, flexGrow: 1 },
  footer: { paddingVertical: spacing.lg },
  emptyBox: { alignItems: 'center', paddingHorizontal: spacing.xl, marginTop: 48, gap: spacing.md },
  empty: { textAlign: 'center', color: colors.textLight, fontSize: 15, lineHeight: 22 },
  retry: { minHeight: 44, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
  retryText: { color: colors.white, fontWeight: '700', fontSize: 15 },
})
