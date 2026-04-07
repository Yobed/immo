# Phase 5: App Mobile, Tests & Déploiement — Research

**Researched:** 2026-04-07
**Domain:** Expo SDK 52, Expo Router 4, Firebase FCM, Playwright, Maestro, EAS Build
**Confidence:** HIGH (stack confirmed), MEDIUM (FCM integration), HIGH (deployment)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MOB-01 | App Expo avec navigation par onglets (Expo Router) | File-based routing via `(tabs)/` group + `_layout.tsx`, Stack.Protected pour auth guard — pattern documenté officiellement |
| MOB-02 | Écrans principaux : liste biens, fiche bien, réservation, profil | FlatList pour liste, ScrollView pour fiche/profil, Pressable pour interactions — primitives RN standard |
| MOB-03 | Composants React Native adaptés depuis le web (~85% code partagé) | Logic/hooks 100% réutilisables depuis packages/shared ; primitives HTML → RN obligatoire ; NativeWind v4 pour className partagé |
| MOB-04 | Notifications push Firebase FCM fonctionnelles | expo-notifications + FCM V1 API ; Supabase Edge Function déclenche FCM via JWT + google-auth-library ; fcm_token stocké dans profiles |
</phase_requirements>

---

## Summary

Phase 5 couvre trois domaines distincts : l'app mobile Expo, les tests E2E cross-platform, et le déploiement sur store. Le projet a déjà une coquille Expo SDK 52 vide avec Expo Router ~4.0.0, `@supabase/supabase-js` et `@immo-ci/shared`. Le travail réel est de construire les 4 écrans, câbler l'authentification Supabase, les notifications push FCM, puis packager pour l'App Store et le Play Store via EAS Build.

**Attention critique :** Expo SDK 52 a activé la New Architecture par défaut. NativeWind v4 a des problèmes connus avec la New Architecture sur SDK 52 (builds APK/AAB cassés, Expo Go fonctionne mais pas les builds production). Le contournement recommandé est soit de désactiver temporairement la New Architecture dans app.json, soit d'utiliser StyleSheet natif RN à la place de NativeWind pour cette phase.

**Recommandation principale :** Utiliser StyleSheet natif React Native pour les composants mobile (pas NativeWind v4), partager uniquement la logique pure depuis `packages/shared` (types, utils, constantes), et utiliser EAS Build pour toute la pipeline de déploiement.

---

## Standard Stack

### Core

| Library | Version vérifiée | Purpose | Why Standard |
|---------|-----------------|---------|--------------|
| expo | ~52.0.0 (actuel: 55.0.12) | Runtime mobile | Déjà installé dans le projet |
| expo-router | ~4.0.0 (actuel: 55.0.11) | Navigation file-based | Déjà installé ; pattern officiel Expo |
| react-native | 0.76.0 | Primitives UI | Bundled avec Expo SDK 52 |
| @supabase/supabase-js | 2.101.1 | Auth + DB client | Déjà installé, même version que web |
| expo-sqlite | ~15.x | KV store pour session Supabase | Remplace AsyncStorage ; nouveau standard Expo 2025 |
| expo-notifications | ~0.29.x | Push notifications (FCM) | Library officielle Expo pour push |
| expo-device | ~7.x | Détection device physique | Requis par expo-notifications |
| expo-constants | ~17.x | ProjectID pour push token | Requis par expo-notifications |
| react-native-url-polyfill | ^2.0.0 | URL API polyfill | Requis par @supabase/supabase-js en RN |
| @expo/vector-icons | ~14.x | Icônes tab bar | Inclus dans Expo SDK 52 |
| expo-secure-store | ~14.x | Stockage sécurisé secrets | Pour tokens sensibles (< 2048 bytes) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-safe-area-context | ~4.x | Insets safe area | Obligatoire avec expo-router |
| react-native-screens | ~4.x | Optimisation navigation | Requis par expo-router |
| expo-image | ~2.x | Image optimisée | Remplace `<Image>` RN pour perf |
| @playwright/test | 1.59.1 | E2E web Next.js | Tests critiques sur navigateur |
| maestro | CLI | E2E mobile Expo | Alternative Detox, recommandée par Expo |
| eas-cli | latest | Build + submit stores | EAS Build officiel Expo |

### Alternatives Considérées

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| StyleSheet natif RN | NativeWind v4 | NativeWind v4 a des bugs New Architecture sur SDK 52 builds — StyleSheet est plus sûr pour la production |
| expo-sqlite kv-store | @react-native-async-storage | expo-sqlite/kv-store est le nouveau standard Expo 2025 avec API synchrone bonus |
| Maestro | Detox | Detox échoue 8/10 fois sur devices physiques ; Maestro a support officiel EAS Workflows |
| EAS Build | Local build Xcode/Android Studio | EAS gère les credentials automatiquement ; plus simple en monorepo |

**Installation (apps/mobile) :**
```bash
npx expo install expo-notifications expo-device expo-constants expo-sqlite expo-secure-store expo-image react-native-url-polyfill
npx expo install react-native-safe-area-context react-native-screens
```

---

## Architecture Patterns

### Recommended Project Structure (apps/mobile/)

```
apps/mobile/
├── app/
│   ├── _layout.tsx              # Root layout — SessionProvider + Stack.Protected
│   ├── (auth)/
│   │   ├── _layout.tsx          # Stack layout pas de header
│   │   ├── login.tsx            # Écran connexion
│   │   └── register.tsx         # Écran inscription
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tabs layout avec icônes
│   │   ├── index.tsx            # Onglet Accueil — liste biens
│   │   ├── favoris.tsx          # Onglet Favoris
│   │   ├── reservations.tsx     # Onglet Réservations
│   │   └── profil.tsx           # Onglet Profil
│   └── bien/
│       └── [id].tsx             # Fiche bien (hors tabs, shared screen)
├── components/
│   ├── BienCard.tsx             # Carte bien dans FlatList
│   ├── BienDetail.tsx           # Fiche complète
│   └── ui/                      # Primitives bouton, input, etc.
├── hooks/
│   └── useAuth.tsx              # Wrapper session Supabase
├── lib/
│   └── supabase.ts              # Client Supabase RN
└── constants/
    └── theme.ts                 # Couleurs, spacing (palette CI)
```

### Pattern 1: Authentification avec Stack.Protected (Expo Router 4)

**Ce que c'est :** Expo Router 4 introduit `Stack.Protected` — les routes sont toujours définies mais la navigation redirige selon la garde.

**Quand l'utiliser :** Pour protéger `(tabs)` derrière la session Supabase.

**Exemple :**
```tsx
// app/_layout.tsx
// Source: https://docs.expo.dev/router/advanced/authentication/
import { Stack } from 'expo-router'
import { SessionProvider, useSession } from '../hooks/useAuth'
import { SplashScreen } from 'expo-router'

SplashScreen.preventAutoHideAsync()

function RootNavigator() {
  const { session, isLoading } = useSession()
  
  if (isLoading) return null // garde splash screen visible
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="bien/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  )
}
```

**Note importante SDK 52 :** `Stack.Protected` a été introduit dans Expo Router v4 (SDK 53). Pour SDK 52, le pattern équivalent utilise React Context + `useEffect` + `router.replace()`. Vérifier la version réelle de expo-router installée (`~4.0.0` dans package.json correspond probablement à 3.x en SDK 52).

**Pattern SDK 52 fiable (Context + redirect) :**
```tsx
// app/_layout.tsx — compatible SDK 52 / Expo Router v3
import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { SessionProvider, useSession } from '../hooks/useAuth'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSession()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [session, isLoading, segments])

  return <>{children}</>
}
```

### Pattern 2: Client Supabase pour React Native

**Différences clés vs web :** Pas de `@supabase/ssr`, pas de cookies — utiliser `expo-sqlite/kv-store` pour la persistance de session.

```typescript
// lib/supabase.ts
// Source: https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native
import 'react-native-url-polyfill/auto'
import 'expo-sqlite/localStorage/install'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,      // expo-sqlite localStorage polyfill
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // OBLIGATOIRE en RN — pas de browser URL
  },
})
```

**Variables d'environnement mobiles :** Préfixe `EXPO_PUBLIC_` obligatoire (équivalent de `NEXT_PUBLIC_` pour Next.js). Créer `apps/mobile/.env`.

### Pattern 3: Tab Navigation

```tsx
// app/(tabs)/_layout.tsx
// Source: https://docs.expo.dev/router/advanced/tabs/
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#1A5276',  // couleur CI définie dans app.json
      tabBarInactiveTintColor: '#8E9EAB',
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favoris"
        options={{
          title: 'Favoris',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Réservations',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
```

### Pattern 4: Liste de biens — FlatList

```tsx
// app/(tabs)/index.tsx
import { FlatList, View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { formatFCFA } from '@immo-ci/shared'  // réutilisation directe

export default function AccueilScreen() {
  const router = useRouter()
  
  return (
    <FlatList
      data={biens}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => router.push(`/bien/${item.id}`)}
        >
          <Text style={styles.prix}>{formatFCFA(item.prix)}</Text>
        </Pressable>
      )}
      contentContainerStyle={styles.list}
    />
  )
}
```

### Pattern 5: Notifications Push FCM

```typescript
// hooks/usePushNotifications.ts
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { supabase } from '../lib/supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null  // simulateur non supporté
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  
  if (finalStatus !== 'granted') return null
  
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  })
  
  // Sauvegarder le token FCM dans profiles
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase
      .from('profiles')
      .update({ fcm_token: token.data })
      .eq('id', user.id)
  }
  
  return token.data
}
```

### Pattern 6: Supabase Edge Function → FCM

```typescript
// supabase/functions/send-push/index.ts
// Source: https://supabase.com/docs/guides/functions/examples/push-notifications
import { createClient } from 'npm:@supabase/supabase-js@2'
import { JWT } from 'npm:google-auth-library@9'
import serviceAccount from '../service-account.json' with { type: 'json' }

Deno.serve(async (req) => {
  const { user_id, title, body, data } = await req.json()
  
  // Récupérer le token FCM depuis profiles
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const { data: profile } = await supabase
    .from('profiles')
    .select('fcm_token')
    .eq('id', user_id)
    .single()
  
  // Auth JWT avec service account Google
  const jwtClient = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  })
  const { access_token } = await jwtClient.authorize()
  
  // Envoyer via FCM V1 API
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        message: {
          token: profile!.fcm_token,
          notification: { title, body },
          data: data ?? {},
        },
      }),
    }
  )
  
  return new Response(JSON.stringify(await res.json()))
})
```

**Prérequis :** Colonne `fcm_token TEXT` dans la table `profiles` (migration requise).

### Anti-Patterns à Éviter

- **NativeWind v4 en production SDK 52 :** Les builds APK/AAB crashent avec New Architecture activée. Utiliser StyleSheet natif RN jusqu'à la stabilisation ou upgrade SDK 53+.
- **`<View>` et `<Text>` imbriqués incorrectement :** En RN, `<Text>` ne peut contenir que du texte ou d'autres `<Text>` — pas de `<View>`.
- **FlatList dans ScrollView :** Provoque un warning "VirtualizedLists should never be nested inside plain ScrollViews" et désactive la virtualisation.
- **`detectSessionInUrl: true` en RN :** Plante le client Supabase — toujours `false` en mobile.
- **expo-notifications dans Expo Go (SDK 53+) :** Expo Go ne supporte plus les push à partir de SDK 53. Un development build est obligatoire. Avec SDK 52, Expo Go supporte encore les push (mais cela change en SDK 53).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Navigation tabs | Custom tab bar RN | expo-router `(tabs)/` | Gestion back button Android, URL linking, state restore |
| Auth guard mobile | Middleware custom | Stack.Protected (Router v4) ou useSegments + useEffect (Router v3) | Gestion race conditions loading state |
| Session persistence | Stocker JWT manuellement | expo-sqlite/kv-store via supabase-js storage adapter | Supabase gère refresh automatique |
| Push token management | Webhook custom | expo-notifications + Supabase Edge Function | FCM V1 auth, gestion erreurs, retry |
| Image optimisée | `<Image>` RN natif | expo-image | Blurhash, cache, lazy load, webp auto |
| App signing | Xcode/Android Studio manuel | EAS Build | Gestion credentials, provisioning profiles, keystore automatique |
| Store submission | Upload binaire manuel | `eas submit` | Automatise metadata, credentials, track selection |
| E2E mobile | Detox custom config | Maestro + EAS Workflows | Maestro : YAML simple, support natif EAS, zéro config infra |

**Key insight :** En mobile, tout ce qui touche les credentials (signing, push, OAuth) est complexe par design. EAS et expo-notifications encapsulent cette complexité — les reconstruire from scratch génère des bugs en production (expiration certs, FCM V1 rotation).

---

## Partage de Code Web → Mobile

### Ce qui se réutilise SANS modification depuis packages/shared

| Asset | Réutilisable | Notes |
|-------|-------------|-------|
| Types TypeScript (`Database`, `Bien`, `Profile`, etc.) | ✅ 100% | Pas de dépendance DOM |
| `formatFCFA(amount)` | ✅ 100% | Pure function |
| `formatDate(date)` | ✅ 100% | date-fns est cross-platform |
| Constantes communes (`COMMUNES_CI`, `TYPES_BIEN`) | ✅ 100% | Données statiques |
| Hooks Supabase (fetch biens, fetch profil) | ✅ avec adaptation | Même logique, client RN différent |
| Validation Zod | ✅ 100% | Zod est cross-platform |

### Ce qui NE se réutilise PAS (réécriture obligatoire)

| Web Component | Cause | Équivalent RN |
|---------------|-------|---------------|
| `<div>`, `<span>`, `<p>` | HTML interdit en RN | `<View>`, `<Text>` |
| `className="..."` Tailwind | CSS pas supporté natif | `StyleSheet.create({})` |
| `<img>` | Pas de DOM | `<Image>` ou `expo-image` |
| `<button>`, `<a>` | Pas de DOM | `<Pressable>`, `<TouchableOpacity>` |
| `embla-carousel-react` | Web-only | `<FlatList horizontal>` ou `react-native-snap-carousel` |
| `mapbox-gl` | Web GL | `react-native-maps` (si requis) |
| `pannellum-react` | WebGL web | Hors scope v1 mobile |
| `@react-pdf/renderer` | Node.js renderer | Hors scope mobile |
| `recharts`, `@tremor/react` | DOM SVG | `react-native-chart-kit` ou `victory-native` |

**Estimation réaliste :** ~60-70% code partagé (logique + types), pas 85% — les composants UI sont entièrement réécrits.

---

## Common Pitfalls

### Pitfall 1: New Architecture + NativeWind v4 sur SDK 52
**What goes wrong :** Build APK/AAB échoue ou crash au lancement. Expo Go fonctionne mais pas les builds réels.
**Why it happens :** NativeWind v4 a des incompatibilités avec la New Architecture (Fabric/TurboModules) sur SDK 52 — problème documenté dans plusieurs issues GitHub nativewind.
**How to avoid :** Utiliser StyleSheet natif RN pour Phase 5. Si NativeWind est voulu, désactiver New Architecture dans app.json : `"newArchEnabled": false`.
**Warning signs :** Erreur "Unhandled JS Exception" au lancement du build, ou className ignorés silencieusement.

### Pitfall 2: Expo Router version réelle vs package.json
**What goes wrong :** `expo-router ~4.0.0` dans package.json ne garantit pas Stack.Protected (feature SDK 53+).
**Why it happens :** Le tilde `~` autorise patch versions uniquement. Expo Router 4.x correspond en réalité à des versions qui existaient pour SDK 52/53.
**How to avoid :** Vérifier la version réelle : `npm list expo-router` dans apps/mobile. Si < 4.0.0, utiliser le pattern useSegments + useEffect à la place de Stack.Protected.
**Warning signs :** `Stack.Protected` n'existe pas en TypeScript types.

### Pitfall 3: Push notifications uniquement sur device physique
**What goes wrong :** Tests FCM échouent sur simulateur iOS et émulateur Android.
**Why it happens :** FCM require un token device réel — les simulateurs n'ont pas d'identifiant push.
**How to avoid :** Tester push uniquement sur device physique via EAS development build. Pour CI, utiliser l'Expo push tool avec un token de device réel enregistré.
**Warning signs :** `getExpoPushTokenAsync()` retourne null ou throw sur simulateur.

### Pitfall 4: `detectSessionInUrl` en React Native
**What goes wrong :** App crash ou boucle infinie d'auth au démarrage.
**Why it happens :** Supabase tente de parser l'URL du browser pour détecter les tokens OAuth — il n'y a pas de browser URL en RN.
**How to avoid :** Toujours `detectSessionInUrl: false` dans la config Supabase RN.

### Pitfall 5: `react-native-url-polyfill` import order
**What goes wrong :** Crash "URL is not defined" au runtime.
**Why it happens :** `@supabase/supabase-js` utilise l'API URL qui n'existe pas nativement en RN (Hermes).
**How to avoid :** `import 'react-native-url-polyfill/auto'` DOIT être le premier import dans `lib/supabase.ts`, avant tout import supabase.

### Pitfall 6: EAS Build — monorepo root vs app root
**What goes wrong :** Build EAS échoue sur résolution des workspaces npm.
**Why it happens :** EAS doit avoir accès au `package.json` et lockfile à la racine du monorepo pour résoudre `@immo-ci/shared`.
**How to avoid :** Configurer `eas.json` avec `"projectRoot": "../.."` dans les build profiles, ou s'assurer que le repo root est bien le context Vercel/EAS.

### Pitfall 7: Variables d'environnement Expo vs Next.js
**What goes wrong :** `process.env.NEXT_PUBLIC_SUPABASE_URL` est undefined dans l'app mobile.
**Why it happens :** Expo utilise le préfixe `EXPO_PUBLIC_` — différent de `NEXT_PUBLIC_`.
**How to avoid :** Créer `apps/mobile/.env` avec `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### Pitfall 8: Playwright — tests vs app en cours
**What goes wrong :** Tests Playwright échouent car `npm run dev` Next.js n'est pas démarré.
**Why it happens :** Playwright `webServer` config lance le serveur automatiquement mais le port 3000 peut être déjà pris ou le timeout trop court.
**How to avoid :** Configurer `webServer.reuseExistingServer: true` en dev local, `reuseExistingServer: false` en CI.

---

## Tests E2E — Stratégie

### Web (Playwright)

**Setup dans apps/web/ :**
```bash
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

**playwright.config.ts (apps/web/) :**
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
```

**Flows critiques à tester :**
1. Auth — connexion email/password → redirect dashboard
2. Liste biens — pagination, filtre commune
3. Fiche bien — affichage photos, prix FCFA
4. Réservation — formulaire → confirmation

**Dans turbo.json :** Ajouter task `e2e` avec `dependsOn: ["build"]`.

### Mobile (Maestro)

**Setup Maestro :**
```bash
# Installation CLI (macOS/Linux)
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Structure `.maestro/` dans apps/mobile/ :**
```yaml
# .maestro/auth_flow.yaml
appId: ci.immo.app
---
- launchApp
- assertVisible: "Connexion"
- tapOn: "Email"
- inputText: "test@immo-ci.com"
- tapOn: "Mot de passe"
- inputText: "testpassword123"
- tapOn: "Se connecter"
- assertVisible: "Accueil"
```

**EAS Workflows (`.eas/workflows/e2e.yml`) :**
```yaml
name: Mobile E2E
on: push
jobs:
  test:
    steps:
      - uses: eas/build
        with:
          profile: preview
          platform: android
      - uses: eas/maestro-test
        with:
          flow: .maestro/auth_flow.yaml
```

---

## Déploiement

### Vercel (apps/web/)

**Configuration Vercel Dashboard :**
- Root Directory : `.` (racine monorepo)
- Build Command : `turbo run build --filter=@immo-ci/web`
- Output Directory : `apps/web/.next`
- Framework Preset : Next.js

**Variables d'environnement à définir dans Vercel :**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

**turbo.json — ajouter env vars au cache pipeline :**
```json
{
  "tasks": {
    "build": {
      "env": [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "NEXT_PUBLIC_MAPBOX_TOKEN"
      ]
    }
  }
}
```

### EAS Build (apps/mobile/)

**Initialisation :**
```bash
npm install -g eas-cli
eas login
eas build:configure  # génère eas.json
```

**eas.json recommandé :**
```json
{
  "cli": { "version": ">= 3.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "app-bundle",
        "autoIncrement": "versionCode"
      },
      "ios": { "autoIncrement": "buildNumber" }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "contact@immo-ci.com",
        "ascAppId": "XXXXX",
        "appleTeamId": "XXXXX"
      }
    }
  }
}
```

**Commandes clés :**
```bash
# Development build (test sur device)
eas build --platform android --profile development

# Production build
eas build --platform all --profile production

# Submit aux stores
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

### App Store (iOS) — Prérequis

| Requis | Détail |
|--------|--------|
| Apple Developer Account | 99 USD/an — obligatoire |
| Bundle ID enregistré | `ci.immo.app` dans Apple Developer Portal |
| App Store Connect | App créée avec métadonnées de base |
| Icône 1024x1024 PNG | Sans transparence, sans coins arrondis |
| Screenshots FR | iPhone 6.9" (1320x2868) + iPad 13" si tablet |
| Description FR | Max 4000 caractères, mots-clés immobilier CI |

### Google Play — Prérequis

| Requis | Détail |
|--------|--------|
| Google Play Developer | 25 USD unique |
| Package name enregistré | `ci.immo.app` |
| Service Account JSON | Pour EAS submit automatique |
| Icône feature graphic | 1024x500 PNG |
| Screenshots FR | Android phone + tablet |
| google-services.json | Firebase config Android (pour FCM) |

### Firebase FCM — Setup complet

**Étapes dans Firebase Console :**
1. Créer projet Firebase "immo-ci"
2. Ajouter app Android (package: `ci.immo.app`) → télécharger `google-services.json`
3. Ajouter app iOS (bundle: `ci.immo.app`) → télécharger `GoogleService-Info.plist`
4. Project Settings → Service Accounts → Generate New Private Key → `service-account.json`
5. EAS Dashboard → Credentials → Ajouter FCM V1 Service Account Key

**app.json — config FCM :**
```json
{
  "expo": {
    "plugins": [
      "expo-router",
      ["expo-notifications", {
        "icon": "./assets/notification-icon.png",
        "color": "#1A5276",
        "defaultChannel": "default"
      }]
    ],
    "android": {
      "package": "ci.immo.app",
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "bundleIdentifier": "ci.immo.app",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "extra": {
      "eas": { "projectId": "YOUR_EAS_PROJECT_ID" }
    }
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FCM Legacy HTTP API | FCM V1 API (OAuth JWT) | 2024 (deprecated juin 2024) | Nouvelle auth requise |
| AsyncStorage pour session | expo-sqlite/kv-store | SDK 52 (2024) | API synchrone en bonus |
| Expo Go pour tout | Development builds | SDK 53 (push SDK 53+) | Nécessite EAS pour tester push |
| Detox pour E2E mobile | Maestro + EAS Workflows | 2024 | Beaucoup moins de config |
| React Navigation config manuelle | Expo Router file-based | SDK 49+ (2023) | Convention over config |
| google-auth-library Node.js | google-auth-library npm: (Deno) | 2024 | Edge Functions = Deno runtime |

**Deprecated/outdated :**
- FCM Legacy API : désactivée depuis juin 2024 — utiliser V1 exclusivement
- `@supabase/ssr` : web uniquement — jamais installer dans apps/mobile
- `expo-av` pour vidéo : remplacé par `expo-video` (stable SDK 52)
- `newArchEnabled: false` globalement : workaround temporaire seulement

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build, EAS CLI | ✓ | v24.13.0 | — |
| npm | Package install | ✓ | 11.6.2 | — |
| eas-cli | EAS Build/Submit | ✗ | — | `npm install -g eas-cli` (Wave 0) |
| expo CLI | Dev server | ✗ (Expo Go suffit pour dev) | — | `npx expo start` sans install global |
| Maestro CLI | E2E mobile | ✗ | — | Install Wave 0 ou EAS Workflows CI |
| @playwright/test | E2E web | ✗ | — | `npm install -D @playwright/test` (Wave 0) |
| Apple Developer Account | iOS build | Non vérifié | — | Requis pour App Store (99 USD/an) |
| Google Play Account | Android submit | Non vérifié | — | Requis (25 USD unique) |
| Firebase project | FCM | Non vérifié | — | Créer Firebase project (gratuit) |
| google-services.json | Android FCM | ✗ non présent | — | Télécharger depuis Firebase Console |
| GoogleService-Info.plist | iOS FCM | ✗ non présent | — | Télécharger depuis Firebase Console |

**Missing dependencies with no fallback :**
- Apple Developer Account (99 USD/an) — requis pour tout build iOS production ou TestFlight
- Google Play Developer Account (25 USD) — requis pour publication Android

**Missing dependencies with fallback :**
- eas-cli : `npm install -g eas-cli` en Wave 0
- @playwright/test : installer dans apps/web devDependencies
- Maestro : installer localement ou utiliser EAS Workflows (cloud)
- Firebase project : créer gratuitement sur console.firebase.google.com

---

## Open Questions

1. **Version exacte d'Expo Router installée**
   - Ce qu'on sait : `package.json` spécifie `~4.0.0` mais le module réel dépend de la résolution npm
   - Ce qui est flou : Stack.Protected est disponible en Router v4+ (SDK 53) — peut ne pas exister en SDK 52
   - Recommandation : `npm list expo-router` dans apps/mobile pour confirmer ; si < 4.0.0, utiliser pattern useSegments

2. **New Architecture activée ou non dans le projet**
   - Ce qu'on sait : SDK 52 active New Architecture par défaut pour nouveaux projets
   - Ce qui est flou : app.json actuel ne spécifie pas `newArchEnabled` — état par défaut inconnu
   - Recommandation : Vérifier et ajouter `"newArchEnabled": false` dans app.json pour éviter problèmes NativeWind si className utilisé

3. **Colonne fcm_token dans profiles**
   - Ce qu'on sait : La table profiles existe (migration 001), mais fcm_token n'est pas mentionné dans les requirements
   - Ce qui est flou : Migration nécessaire ? Quelle politique RLS ?
   - Recommandation : Ajouter migration 009 : `ALTER TABLE profiles ADD COLUMN fcm_token TEXT`

4. **Accounts stores déjà créés ?**
   - Apple Developer Program et Google Play Console — leur existence n'est pas vérifiable depuis le codebase
   - Recommandation : Clarifier avec le client avant la phase de déploiement store (délais Apple : 1-7 jours review)

---

## Sources

### Primary (HIGH confidence)
- [Expo Authentication Docs](https://docs.expo.dev/router/advanced/authentication/) — Pattern Stack.Protected, SessionProvider
- [Expo Tabs Docs](https://docs.expo.dev/router/advanced/tabs/) — Structure (tabs)/_layout.tsx
- [Expo SDK 52 Changelog](https://expo.dev/changelog/2024-11-12-sdk-52) — New Architecture activée par défaut, breaking changes
- [Supabase Expo Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native) — Client RN avec expo-sqlite localStorage
- [Supabase FCM Edge Function](https://supabase.com/docs/guides/functions/examples/push-notifications) — Pattern complet send-push avec JWT
- [FCM V1 Payload](https://docs.expo.dev/push-notifications/sending-notifications-custom/) — Structure message FCM V1
- [eas.json Reference](https://docs.expo.dev/eas/json/) — Configuration EAS Build complète
- [Expo Push Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) — expo-notifications, FCM credentials
- [NativeWind Installation](https://www.nativewind.dev/docs/getting-started/installation) — babel.config.js, metro.config.js
- [EAS Maestro E2E](https://docs.expo.dev/eas/workflows/examples/e2e-tests/) — YAML flows, EAS Workflows integration

### Secondary (MEDIUM confidence)
- [NativeWind SDK 52 Issues](https://github.com/nativewind/nativewind/issues/1342) — New Architecture incompatibilité confirmée par community
- [Vercel Turborepo Docs](https://vercel.com/docs/monorepos/turborepo) — Déploiement monorepo Next.js
- [Turborepo Playwright Guide](https://turborepo.dev/docs/guides/tools/playwright) — Setup E2E dans monorepo

### Tertiary (LOW confidence — à valider)
- NativeWind v4.2.3 (version actuelle npm) pourrait avoir des corrections SDK 52 non documentées — vérifier CHANGELOG avant d'abandonner NativeWind

---

## Metadata

**Confidence breakdown :**
- Standard stack (Expo SDK 52, expo-router, expo-notifications) : HIGH — documentation officielle vérifiée
- Architecture patterns (auth guard, tabs, FlatList) : HIGH — exemples officiels vérifiés
- Firebase FCM V1 integration : MEDIUM — code Edge Function vérifié ; configuration Firebase Console manuelle non testée
- NativeWind v4 compatibilité SDK 52 : LOW pour production — bugs confirmés par issues GitHub, contournement recommandé
- EAS Build / Deployment : HIGH — documentation officielle complète
- Maestro E2E : MEDIUM — support officiel confirmé, YAML syntaxe vérifiée

**Research date :** 2026-04-07
**Valid until :** 2026-05-07 (stack Expo/EAS stable ; FCM V1 API stable)
