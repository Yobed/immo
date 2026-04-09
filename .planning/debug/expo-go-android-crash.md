---
status: awaiting_human_verify
trigger: "Expo Go (SDK 54) sur Android affiche 'Something went wrong' après avoir scanné le QR code du serveur Metro"
created: 2026-04-08T00:00:00Z
updated: 2026-04-08T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — Dual React version (18.3.1 root + 19.1.0 mobile-local) in Metro bundle causes "Invalid hook call" crash caught by Expo Go's error screen
test: metro.config.js extraNodeModules forces all 'react' resolution to apps/mobile/node_modules/react (19.1.0)
expecting: Single React instance throughout bundle eliminates hook identity mismatch crash
next_action: Apply fix to metro.config.js + clean Metro cache

## Symptoms

expected: L'app Expo Go doit afficher "Immo CI — App OK" en texte blanc sur fond bleu (#1A5276) — c'est un _layout.tsx minimal
actual: Expo Go affiche "Something went wrong / Sorry about that." immédiatement après le chargement
errors:
- Aucun JS error visible (pas de red screen), juste écran générique "Something went wrong"
- Metro ne montre aucun log Android bundling après le scan
- curl expo-router/entry.bundle → 8MB de JS valide
- curl index.bundle → UnableToResolveError (faux positif)
- "Debug: No compatible apps connected, React Native DevTools can only be used with Hermes."
reproduction: npx expo start --lan --clear --port 8083 depuis apps/mobile, scanner QR avec Expo Go SDK 54 Android
started: Jamais fonctionné. Projet monorepo.

## Eliminated

- hypothesis: expo-notifications plugin causes crash without Google Services
  evidence: expo-notifications is in plugins array but crash is JS-level not native; _layout.tsx simplified removes usePushNotifications from root render tree
  timestamp: 2026-04-08

- hypothesis: expo-router 6.x incompatible with Expo Go SDK 54
  evidence: expo-router 6.0.23 peerDeps specify expo-constants ^18.0.13 which is Expo SDK 54. Not a version mismatch.
  timestamp: 2026-04-08

- hypothesis: Missing react-native-gesture-handler or react-native-reanimated causes crash
  evidence: Both only appear in testing-library/mocks.js in expo-router build — not in runtime code
  timestamp: 2026-04-08

- hypothesis: _layout.tsx.bak file confuses expo-router route discovery
  evidence: require.context regex only matches .tsx? files, not .tsx.bak
  timestamp: 2026-04-08

## Evidence

- timestamp: 2026-04-08
  checked: apps/mobile/node_modules/react/package.json
  found: React 19.1.0 installed locally in mobile app
  implication: npm workspaces created a local copy because root has a different version

- timestamp: 2026-04-08
  checked: node_modules/react/package.json (root)
  found: React 18.3.1 in root (hoisted from apps/web which requires react ^18.3.1)
  implication: Two React instances coexist; Metro will bundle BOTH depending on which package imports react

- timestamp: 2026-04-08
  checked: apps/web/package.json
  found: "react": "^18.3.1" — web app uses React 18, causing npm to hoist 18.3.1 to root
  implication: Root node_modules gets React 18; mobile's React 19 is trapped in local node_modules

- timestamp: 2026-04-08
  checked: metro.config.js resolver configuration
  found: nodeModulesPaths = [apps/mobile/node_modules, root/node_modules]. No react alias.
  implication: When expo-router (located in root/node_modules/expo-router) does require('react'), Metro walks from root/node_modules/expo-router up and finds root/node_modules/react = 18.3.1. App code in apps/mobile/app/ finds apps/mobile/node_modules/react = 19.1.0. Two React instances in bundle.

- timestamp: 2026-04-08
  checked: expo-router/build/ExpoRoot.js line 1 of requires
  found: const react_1 = __importStar(require("react")) — imports react at module load
  implication: expo-router gets React 18; app components get React 19 → hook identity mismatch → "Invalid hook call" → caught by Expo Go → "Something went wrong"

- timestamp: 2026-04-08
  checked: @react-native-async-storage/async-storage versions
  found: root=1.23.1, mobile-local=2.2.0 (major version mismatch, different API)
  implication: Secondary issue — needs to be unified. Not the primary crash cause but could cause runtime errors in auth flow.

- timestamp: 2026-04-08
  checked: react-native-web versions
  found: root=0.21.2, mobile-local=0.19.13 (minor version mismatch)
  implication: Minor issue — may or may not cause problems on web builds.

## Resolution

root_cause: Dual React version in Metro bundle. npm workspaces hoisted React 18.3.1 (from apps/web) to root/node_modules while apps/mobile has React 19.1.0 locally. expo-router (in root/node_modules/expo-router) imports React 18 while app code imports React 19. Two React instances cause React's "Invalid hook call" invariant violation, which expo-router's error boundary catches and shows Expo Go's generic "Something went wrong" screen.
fix: Add react, react-native, react-dom aliases in metro.config.js extraNodeModules to force ALL bundle imports to resolve to apps/mobile/node_modules versions (React 19.1.0 and single react-native).
verification:
files_changed: [apps/mobile/metro.config.js]
verification: Awaiting human test on device with --clear Metro restart
