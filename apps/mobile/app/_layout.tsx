import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SessionProvider, AuthGuard } from '../hooks/useAuth'
import { usePushNotifications } from '../hooks/usePushNotifications'

// Composant séparé pour utiliser usePushNotifications DANS le SessionProvider
// (le hook utilise useSession qui nécessite SessionProvider dans l'arbre)
function PushNotificationsHandler() {
  usePushNotifications()  // S'enregistre automatiquement quand session active
  return null             // Pas de rendu — pure side effect
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <PushNotificationsHandler />
      <AuthGuard>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen
            name="bien/[id]"
            options={{
              headerShown: true,
              headerTitle: 'Détail du bien',
              headerTintColor: '#1A5276',
            }}
          />
          <Stack.Screen name="notifications" options={{ headerShown: true, headerTitle: 'Notifications' }} />
        </Stack>
      </AuthGuard>
    </SessionProvider>
  )
}
