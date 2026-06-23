import { useEffect, useState } from 'react'
import { TouchableOpacity, ActivityIndicator, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useAuth'
import { colors } from '../constants/theme'

interface FavoriteButtonProps {
  bienId: string
  size?: number
  /** Sur photo (cœur blanc/orange) ou sur fond clair (cœur gris/orange) */
  onImage?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * Cœur favori autonome : lit l'état au montage, bascule (insert/delete favoris)
 * avec mise à jour optimiste. Redirige vers login si non connecté.
 */
export function FavoriteButton({ bienId, size = 22, onImage = false, style }: FavoriteButtonProps) {
  const { session } = useSession()
  const router = useRouter()
  const [fav, setFav] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    if (!session?.user?.id) {
      setFav(false)
      return
    }
    supabase
      .from('favoris')
      .select('bien_id')
      .eq('user_id', session.user.id)
      .eq('bien_id', bienId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setFav(!!data)
      })
    return () => {
      active = false
    }
  }, [session, bienId])

  async function toggle() {
    if (!session?.user?.id) {
      router.push('/(auth)/login')
      return
    }
    if (busy || fav === null) return
    setBusy(true)
    const next = !fav
    setFav(next) // optimiste
    const uid = session.user.id
    const { error } = next
      ? await supabase.from('favoris').insert({ user_id: uid, bien_id: bienId })
      : await supabase.from('favoris').delete().eq('user_id', uid).eq('bien_id', bienId)
    if (error) setFav(!next) // rollback
    setBusy(false)
  }

  const idleColor = onImage ? colors.white : colors.textLight
  return (
    <TouchableOpacity
      onPress={toggle}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={[onImage ? styles.onImage : undefined, style]}
      accessibilityRole="button"
      accessibilityLabel={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      {fav === null ? (
        <ActivityIndicator size="small" color={colors.secondary} />
      ) : (
        <Ionicons name={fav ? 'heart' : 'heart-outline'} size={size} color={fav ? colors.secondary : idleColor} />
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  onImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
