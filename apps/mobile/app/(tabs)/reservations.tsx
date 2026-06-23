import { useState, useEffect, useCallback } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { useSession } from '../../hooks/useAuth'
import { StatutBadge } from '../../components/StatutBadge'
import { formatDateCI, formatFCFA } from '@immo-ci/shared'
import { colors, spacing, borderRadius, typography } from '../../constants/theme'

interface ReservationItem {
  id: string
  statut: string
  date_debut: string
  date_fin: string | null
  montant_loyer_fcfa: number
  created_at: string
  biens: {
    titre: string
    commune: string
  } | null
}

export default function ReservationsScreen() {
  const { session } = useSession()
  const [reservations, setReservations] = useState<ReservationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchReservations() {
    if (!session?.user?.id) return

    const { data, error } = await supabase
      .from('reservations')
      .select('id, statut, date_debut, date_fin, montant_loyer_fcfa, created_at, biens(titre, commune)')
      .eq('locataire_id', session.user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setReservations(data as unknown as ReservationItem[])
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchReservations().finally(() => setLoading(false))
  }, [session])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchReservations()
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
        data={reservations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.titreBien} numberOfLines={1}>
                {item.biens?.titre ?? 'Bien supprimé'}
              </Text>
              <StatutBadge statut={item.statut as any} size="sm" />
            </View>
            <Text style={styles.commune}>{item.biens?.commune ?? '—'}</Text>
            <Text style={styles.dates}>
              Du {formatDateCI(item.date_debut)}
              {item.date_fin ? ` au ${formatDateCI(item.date_fin)}` : ''}
            </Text>
            <Text style={styles.montant}>{formatFCFA(item.montant_loyer_fcfa)}/mois</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.empty}>Aucune réservation</Text>
            <Text style={styles.emptyHint}>
              Vos réservations de biens apparaîtront ici
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
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  titreBien: { ...typography.h3, color: colors.text, flex: 1, marginRight: spacing.sm },
  commune: { ...typography.caption, color: colors.textLight, marginBottom: spacing.xs },
  dates: { ...typography.body, color: colors.text, marginBottom: spacing.xs },
  montant: { fontSize: 15, fontWeight: '700', color: colors.secondary },
  emptyContainer: { alignItems: 'center', marginTop: 64, paddingHorizontal: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  empty: { fontSize: 16, color: colors.textLight, fontWeight: '600', textAlign: 'center' },
  emptyHint: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginTop: spacing.sm },
})
