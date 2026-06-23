import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useSession } from './useAuth'

// Configurer le handler en dehors du hook pour qu'il soit global
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Les simulateurs ne supportent pas les push notifications
  if (!Device.isDevice) {
    console.warn('[Push] Notifications push non disponibles sur simulateur/émulateur')
    return null
  }

  // Vérifier et demander la permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Permission refusée par l\'utilisateur')
    return null
  }

  // Récupérer l'Expo Push Token (nécessite EAS projectId dans app.json)
  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId) {
    console.warn('[Push] EAS projectId manquant dans app.json extra.eas.projectId')
    return null
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
  return tokenData.data  // format: "ExponentPushToken[xxxxxx]"
}

export function usePushNotifications() {
  const { session } = useSession()
  const router = useRouter()
  const notificationListener = useRef<Notifications.EventSubscription | null>(null)
  const responseListener = useRef<Notifications.EventSubscription | null>(null)

  useEffect(() => {
    // Enregistrer seulement si l'utilisateur est connecté
    if (!session?.user.id) return

    // Enregistrer le token et le sauvegarder dans profiles
    registerForPushNotificationsAsync().then(async (token) => {
      if (!token) return

      const { error } = await supabase
        .from('profiles')
        .update({ fcm_token: token })
        .eq('id', session.user.id)

      if (error) {
        console.error('[Push] Erreur sauvegarde token:', error.message)
      } else {
        console.log('[Push] Token enregistré:', token.slice(0, 30) + '...')
      }
    })

    // Listener: notification reçue pendant que l'app est au premier plan
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Push] Notification reçue:', notification.request.content.title)
    })

    // Listener: utilisateur tape sur une notification (app en arrière-plan ou fermée)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        lien_type?: string
        lien_id?: string
      }

      // Deep link selon le type de notification
      if (data?.lien_type === 'bien' && data.lien_id) {
        router.push(`/bien/${data.lien_id}` as never)
      } else if (data?.lien_type === 'reservation') {
        router.push('/(tabs)/reservations' as never)
      } else if (data?.lien_type === 'message') {
        router.push('/(tabs)/reservations' as never)  // TODO: ouvrir la messagerie en v2
      }
    })

    // Nettoyer les listeners au démontage
    return () => {
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [session?.user.id])
}
