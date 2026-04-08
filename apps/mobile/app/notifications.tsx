import { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useAuth'
import { formatDate } from '@immo-ci/shared'
import { colors, spacing, typography } from '../constants/theme'

interface Notification {
  id: string
  titre: string
  message: string
  lien_type: string | null
  lien_id: string | null
  lu: boolean
  created_at: string
}

export default function NotificationsScreen() {
  const { session } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user.id) return

    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setNotifications(data as Notification[])
        setLoading(false)
      })
  }, [session?.user.id])

  function handleTap(notif: Notification) {
    // Marquer comme lu
    supabase
      .from('notifications')
      .update({ lu: true })
      .eq('id', notif.id)
      .then(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, lu: true } : n))
        )
      })

    // Deep link selon le type
    if (notif.lien_type === 'bien' && notif.lien_id) {
      router.push(`/bien/${notif.lien_id}` as never)
    } else if (notif.lien_type === 'reservation') {
      router.push('/(tabs)/reservations' as never)
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      style={styles.container}
      contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.item, !item.lu && styles.itemUnread]}
          onPress={() => handleTap(item)}
          activeOpacity={0.8}
        >
          {!item.lu && <View style={styles.dot} />}
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>{item.titre}</Text>
            <Text style={styles.itemBody} numberOfLines={2}>{item.message}</Text>
            <Text style={styles.itemDate}>{formatDate(item.created_at)}</Text>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>Aucune notification</Text>
        </View>
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1 },
  item: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.white,
    alignItems: 'flex-start',
  },
  itemUnread: { backgroundColor: '#EBF5FB' },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6, marginRight: spacing.sm,
  },
  itemContent: { flex: 1 },
  itemTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  itemBody: { ...typography.body, color: colors.textLight, marginBottom: spacing.xs },
  itemDate: { ...typography.caption, color: colors.textLight },
  separator: { height: 1, backgroundColor: colors.border },
  emptyText: { color: colors.textLight, fontSize: 15 },
})
