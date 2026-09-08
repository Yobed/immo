import { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Linking } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams } from 'expo-router'
import { FavoriteButton } from '../../components/FavoriteButton'
import { fetchListing, type ListingSource, type PublicListing } from '../../lib/catalogue-api'
import { colors, spacing, typography, borderRadius } from '../../constants/theme'

const CONSEILLER_WA = '2250544872051'

function isSource(value: string | undefined): value is ListingSource {
  return value === 'web' || value === 'bogbes' || value === 'flash-old' || value === 'flash-mid' || value === 'flash-fresh'
}

export default function FicheBienScreen() {
  const params = useLocalSearchParams<{ id?: string; source?: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const sourceParam = Array.isArray(params.source) ? params.source[0] : params.source
  const source: ListingSource = isSource(sourceParam) ? sourceParam : (/^[0-9a-f-]{36}$/i.test(id || '') ? 'bogbes' : 'web')
  const [bien, setBien] = useState<PublicListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!id) { setError('Référence du bien absente.'); setLoading(false); return }
    setLoading(true); setError(null); setBien(null)
    try { setBien(await fetchListing(source, id, signal)) }
    catch (reason) { if (!signal?.aborted) setError(reason instanceof Error ? reason.message : 'Bien introuvable') }
    finally { if (!signal?.aborted) setLoading(false) }
  }, [id, source])

  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort() }, [load])

  async function open(url: string, failure: string) {
    try { await Linking.openURL(url) } catch { Alert.alert('Action impossible', failure) }
  }

  function handleContact() {
    if (!bien) return
    const msg = `Bonjour, le bien ${bien.reference} m'intéresse : ${bien.titre}, ${bien.commune}. Je souhaite vérifier sa disponibilité et préparer une visite. Lien : ${bien.url}`
    open(`https://wa.me/${CONSEILLER_WA}?text=${encodeURIComponent(msg)}`, "WhatsApp ne peut pas s'ouvrir. Contactez le conseiller au +225 05 44 87 20 51.")
  }

  function handleReserver() {
    if (!bien) return
    open(`${bien.url}#reserver`, 'Ouvrez bogbesgroup.com pour poursuivre votre demande.')
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.muted}>Actualisation du bien…</Text></View>
  if (!bien || error) return <View style={styles.center}><Text style={styles.errorText}>{error || 'Bien introuvable'}</Text><TouchableOpacity style={styles.retry} onPress={() => load()}><Text style={styles.retryText}>Réessayer</Text></TouchableOpacity></View>

  const cover = bien.photos?.[0] || bien.photo_principale
  return <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
    <View>
      <Image source={cover ? { uri: cover } : require('../../assets/icon.png')} style={styles.image} contentFit="cover" transition={200} />
      {bien.source === 'bogbes' && <FavoriteButton bienId={bien.id} onImage size={24} style={styles.fav} />}
    </View>
    <View style={styles.content}>
      <Text style={styles.reference}>{bien.reference} · {bien.source === 'web' ? 'Annonce web' : bien.source === 'bogbes' ? 'Bien BOGBE’S' : 'Offre flash'}</Text>
      <Text style={styles.prix}>{bien.prix_label}</Text>
      <Text style={styles.titre}>{bien.titre}</Text>
      <Text style={styles.commune}>{bien.commune}{bien.quartier ? ` · ${bien.quartier}` : ''}{bien.type_bien ? ` · ${bien.type_bien}` : ''}</Text>

      <View style={styles.reassurance}>
        <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
        <Text style={styles.reassuranceText}>Ce bien vous intéresse ? Notre conseiller vérifie sa disponibilité et vous accompagne pour préparer votre visite.</Text>
      </View>

      {bien.description ? <View style={styles.section}><Text style={styles.sectionTitle}>Description</Text><Text style={styles.description}>{bien.description}</Text></View> : null}
      <View style={styles.detailsGrid}>
        {bien.surface_m2 ? <Text style={styles.detail}>Surface : {bien.surface_m2} m²</Text> : null}
        {bien.nb_pieces ? <Text style={styles.detail}>Pièces : {bien.nb_pieces}</Text> : null}
      </View>

      <TouchableOpacity style={styles.waButton} onPress={handleContact} activeOpacity={0.85} accessibilityRole="button">
        <Ionicons name="chatbubble-ellipses-outline" size={21} color={colors.white} />
        <Text style={styles.waText}>Échanger avec un conseiller</Text>
      </TouchableOpacity>
      <Text style={styles.contactHint}>La référence {bien.reference} et le lien du bien seront transmis au conseiller.</Text>
      <TouchableOpacity style={styles.secondaryButton} onPress={handleReserver} accessibilityRole="button">
        <Text style={styles.secondaryText}>Voir le parcours de réservation</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xl * 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  muted: { color: colors.textLight, fontSize: 15 },
  image: { width: '100%', height: 280, backgroundColor: colors.border },
  fav: { position: 'absolute', top: spacing.md, right: spacing.md },
  content: { padding: spacing.lg },
  reference: { color: colors.textLight, fontSize: 13, fontWeight: '700', marginBottom: spacing.sm, textTransform: 'uppercase' },
  prix: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.secondary, marginBottom: spacing.xs },
  titre: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  commune: { ...typography.body, color: colors.textLight, marginBottom: spacing.lg },
  reassurance: { flexDirection: 'row', gap: spacing.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg },
  reassuranceText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 22 },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  description: { ...typography.body, color: colors.text, lineHeight: 24 },
  detailsGrid: { marginBottom: spacing.lg },
  detail: { ...typography.body, color: colors.text, marginBottom: spacing.xs },
  errorText: { color: colors.danger, fontSize: 16, textAlign: 'center' },
  retry: { minHeight: 44, justifyContent: 'center', borderRadius: borderRadius.md, backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
  retryText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  waButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, padding: spacing.md, borderRadius: borderRadius.md },
  waText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  contactHint: { ...typography.caption, color: colors.textLight, textAlign: 'center', marginTop: spacing.sm, lineHeight: 19 },
  secondaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, marginTop: spacing.md, paddingHorizontal: spacing.md },
  secondaryText: { color: colors.text, fontSize: 15, fontWeight: '700' },
})
