# 📱 Plan de Déploiement Mobile & Responsive : Deep Estate Sapphire

Ce document détaille la stratégie pour rendre la plateforme web totalement responsive (Focus Mobile First) et préparer le déploiement des applications natives Android et iOS via Expo.

---

## 🛠️ Phase 1 : Optimisation Responsive (Web App)
L'objectif est d'assurer que les améliorations "Midnight Luxury" fonctionnent parfaitement sur smartphone.

### 1.1 Carte Interactive Responsive
- [ ] **Adaptation des Badges** : Passer les badges de stats (Haut Gauche) d'un alignement vertical à une barre horizontale compacte ou un menu rétractable sur mobile.
- [ ] **Optimisation Popover** : Transformer le panneau du bien sélectionné en une "Bottom Sheet" (panneau coulissant du bas) plus naturelle sur mobile.
- [ ] **Contrôles Mapbox** : Recentrer les boutons de zoom et "Ma Position" pour qu'ils ne soient pas cachés par les encoches des téléphones.

### 1.2 Grille de Biens & Filtres
- [ ] **Grid Layout** : Forcer `grid-cols-1` sur mobile pour les `PremiumBienCard` afin de maximiser la lisibilité.
- [ ] **Filtres Intelligents** : Passer le filtre d'une barre horizontale à un bouton "Filtrer" ouvrant un modal plein écran.

---

## 🚀 Phase 2 : Préparation Application Native (Apps Mobile)
Le projet utilise déjà Expo (apps/mobile). Nous allons finaliser la configuration pour le déploiement.

### 2.1 Synchronisation des Fonctionnalités
- [ ] **Core Parity** : Porter la logique de `get_biens_proches` et l'itinéraire "Bleu Néon" dans le code React Native (`apps/mobile/components/map`).
- [ ] **Design System** : Partager les tokens de couleur (#0a0a12, #D4AF37, #0055ff) entre Web et Mobile via le package `@immo-ci/shared`.

### 2.2 Configuration EAS (Expo Application Services)
- [ ] **Vérification `app.json`** : Configurer les `bundleIdentifier` (iOS) et `package` (Android).
- [ ] **Authentification** : Configurer le Deep Linking pour que les e-mails de connexion ouvrent l'application native.
- [ ] **Build Setup** :
  ```bash
  cd apps/mobile
  eas build:configure
  ```

---

## 📦 Phase 3 : Déploiement Android & iOS
Utilisation des pipelines EAS pour générer les binaires de production.

### 3.1 Android (Google Play Store)
- [ ] Générer le build de production (AAB) : `eas build --platform android --profile production`.
- [ ] Soumission via EAS Submit.

### 3.2 iOS (Apple App Store)
- [ ] Générer le build de production (IPA) : `eas build --platform ios --profile production`.
- [ ] Validation TestFlight.

---

## 📋 Prochaines Étapes Immédiates
1. **Audit Mobile Web** : Vérifier le rendu actuel sur simulateur mobile.
2. **Bottom Sheet Map** : Implémenter le composant pour la carte web.
3. **EAS Login** : Se connecter au compte Expo pour préparer les certificats.

> [!IMPORTANT]
> Le déploiement sur les stores nécessite des comptes développeurs actifs (Apple Developer Program et Google Play Console).
