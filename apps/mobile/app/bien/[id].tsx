import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useSession } from '../../hooks/useAuth'
import { formatFCFA } from '@immo-ci/shared'
import type { Database } from '@immo-ci/shared'
import { colors, spacing, typography, borderRadius } from '../../constants/theme'

type BienRow = Database['public']['Tables']['biens']['Row']

export default function FicheBienScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useSession()
  const [bien, setBien] = useState<BienRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase
      .from('biens')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setBien(data)
        setLoading(false)
      })
  }, [id])

  function handleReserver() {
    if (!session) {
      Alert.alert('Connexion requise', 'Connectez-vous pour réserver ce bien.')
      return
    }
    // Navigation vers flow réservation web (web app) — v1: message informatif
    Alert.alert(
      'Réservation',
      `Réservez "${bien?.titre}" depuis l'application web pour finaliser le paiement CinetPay.`
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (!bien) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Bien introuvable</Text>
      </View>
    )
  }

  // Prix à afficher (mensuel en priorité, sinon vente)
  const prixLabel = bien.prix_mois_fcfa
    ? `${formatFCFA(bien.prix_mois_fcfa)}/mois`
    : bien.prix_vente_fcfa
    ? formatFCFA(bien.prix_vente_fcfa)
    : 'Prix non renseigné'

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: 'https://via.placeholder.com/400x250?text=Immo+CI' }}
        style={styles.image}
        contentFit="cover"
        transition={300}
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
      />
      <View style={styles.content}>
        <Text style={styles.prix}>{prixLabel}</Text>
        <Text style={styles.titre}>{bien.titre}</Text>
        <Text style={styles.commune}>
          {bien.commune}{bien.quartier ? ` · ${bien.quartier}` : ''} · {bien.type_bien}
        </Text>

        {bien.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{bien.description}</Text>
          </View>
        ) : null}

        <View style={styles.detailsGrid}>
          {bien.surface_m2 ? (
            <Text style={styles.detail}>Surface : {bien.surface_m2} m²</Text>
          ) : null}
          {bien.nb_pieces ? (
            <Text style={styles.detail}>Pièces : {bien.nb_pieces}</Text>
          ) : null}
          {bien.nb_chambres ? (
            <Text style={styles.detail}>Chambres : {bien.nb_chambres}</Text>
          ) : null}
          {bien.charges_mois_fcfa ? (
            <Text style={styles.detail}>Charges : {formatFCFA(bien.charges_mois_fcfa)}/mois</Text>
          ) : null}
          {bien.depot_garantie_fcfa ? (
            <Text style={styles.detail}>Caution : {formatFCFA(bien.depot_garantie_fcfa)}</Text>
          ) : null}
        </View>

        {bien.adresse_complete ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adresse</Text>
            <Text style={styles.description}>{bien.adresse_complete}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.ctaButton} onPress={handleReserver}>
          <Text style={styles.ctaText}>Réserver ce bien</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  image: { width: '100%', height: 260 },
  content: { padding: spacing.lg },
  prix: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: spacing.xs,
  },
  titre: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  commune: { ...typography.body, color: colors.textLight, marginBottom: spacing.lg },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  description: { ...typography.body, color: colors.text, lineHeight: 22 },
  detailsGrid: { marginBottom: spacing.md },
  detail: { ...typography.body, color: colors.text, marginBottom: spacing.xs },
  errorText: { color: colors.danger, fontSize: 16 },
  ctaButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  ctaText: { color: colors.white, fontWeight: '700', fontSize: 16 },
})
