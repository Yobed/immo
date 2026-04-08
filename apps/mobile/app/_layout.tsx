import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SessionProvider, AuthGuard } from '../hooks/useAuth'

export default function RootLayout() {
  return (
    <SessionProvider>
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
        </Stack>
      </AuthGuard>
    </SessionProvider>
  )
}
