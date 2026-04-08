import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { useSession } from '../../hooks/useAuth'
import { StatutBadge } from '../../components/StatutBadge'
import type { Database } from '@immo-ci/shared'
import { colors, spacing, typography, borderRadius } from '../../constants/theme'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function ProfilScreen() {
  const { session } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data)
        setLoading(false)
      })
  }, [session])

  async function handleLogout() {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          // AuthGuard redirige automatiquement vers login
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  // Afficher les initiales depuis full_name (schéma réel profiles)
  const fullName = profile?.full_name ?? session?.user?.email ?? '?'
  const nameParts = fullName.split(' ')
  const initials = nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : fullName.slice(0, 2).toUpperCase()

  // Label rôle
  const roleLabel =
    profile?.role === 'proprietaire'
      ? 'Propriétaire'
      : profile?.role === 'agence'
      ? 'Agence'
      : 'Locataire'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <Text style={styles.name}>{fullName}</Text>
      <Text style={styles.email}>{session?.user?.email}</Text>
      <Text style={styles.role}>{roleLabel}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statut KYC</Text>
        <StatutBadge statut={(profile?.kyc_statut ?? 'non_soumis') as any} />
      </View>

      {profile?.phone && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Téléphone</Text>
          <Text style={styles.sectionValue}>{profile.phone}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { alignItems: 'center', padding: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { color: colors.white, fontSize: 28, fontWeight: '700' },
  name: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  email: { ...typography.body, color: colors.textLight, marginBottom: spacing.xs },
  role: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  section: { width: '100%', marginBottom: spacing.lg },
  sectionTitle: { ...typography.body, color: colors.textLight, marginBottom: spacing.sm },
  sectionValue: { ...typography.body, color: colors.text },
  logoutButton: {
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
  },
  logoutText: { color: colors.white, fontWeight: '700', fontSize: 16 },
})
