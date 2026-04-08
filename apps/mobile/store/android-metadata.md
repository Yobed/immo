# Google Play Metadata — Immo CI (Android)

## Informations de base

**Titre:** Immo CI — Immobilier CI
*(50 caractères max — "Immo CI — Immobilier CI" = 22 caractères)*

**Package name:** ci.immo.app

**Catégorie:** Maison & jardin (House & Home)

## Description courte (80 caractères max)

Trouvez et réservez des biens immobiliers en Côte d'Ivoire. Payez par mobile money.

## Description longue (4000 caractères max)

Immo CI est la première plateforme immobilière numérique de Côte d'Ivoire. Que vous cherchiez à louer un appartement à Cocody, acheter une villa à Bassam ou publier votre bien à Abidjan, Immo CI vous accompagne à chaque étape.

POUR LES LOCATAIRES ET ACHETEURS

- Parcourez des annonces vérifiées dans toutes les communes d'Abidjan
- Filtrez par commune, type de bien, prix en FCFA
- Photos, vidéos et visite virtuelle 360°
- Réservez en ligne, payez par Wave, Orange Money, MTN ou Moov
- Contrats de bail OHADA générés automatiquement
- Suivi de vos réservations en temps réel

POUR LES PROPRIÉTAIRES ET AGENCES

- Publiez en 5 minutes avec photos et description IA
- Recevez vos paiements sur votre mobile money
- Quittances de loyer automatiques chaque mois
- Tableau de bord : revenus, taux d'occupation, alertes
- Badge KYC vérifié pour inspirer confiance

SÉCURITÉ ET DROIT IVOIRIEN

- Vérification KYC des propriétaires
- Contrats conformes droit OHADA
- Paiements via CinetPay (leader CI)
- Notifications push en temps réel

**Pourquoi Immo CI ?**
L'immobilier en Côte d'Ivoire souffre d'annonces obsolètes, de propriétaires injoignables et de paiements risqués. Immo CI change ça : annonces fraîches, propriétaires vérifiés, paiements sécurisés.

Abidjan, Yamoussoukro, Bouaké, San Pédro — toute la CI dans votre poche.

## Graphic Feature (1024 × 500 px)

- Fond dégradé : #1A5276 → #154360
- Texte : "Immo CI" (Playfair Display, blanc)
- Sous-texte : "L'immobilier ivoirien, enfin digital"
- Élément visuel : silhouette skyline Abidjan Plateau

## Captures d'écran requises

- Téléphone Android : 1080 × 1920 px minimum — au moins 2
- Tablette 7" (optionnel)
- Écrans : Liste biens, Fiche bien, Réservations, Profil

## Classification du contenu

- Public cible : Tous les utilisateurs (18+)
- Violence : Non
- Données financières : Oui (paiements mobile money)
- Localisation : Non (pas de géoloc en temps réel)

## Prérequis Google Play

- [ ] Compte Google Play Developer (25 USD — paiement unique)
- [ ] Package name `ci.immo.app` réservé
- [ ] Service Account JSON créé dans Google Play Console → Setup → API access
- [ ] Chemin du service account dans eas.json: `./google-service-account.json`
- [ ] `google-services.json` téléchargé depuis Firebase Console et placé dans `apps/mobile/`
- [ ] Feature graphic 1024×500 PNG prête

## Commandes EAS Submit

```bash
# Build production
eas build --platform android --profile production

# Soumettre au Play Store (track internal d'abord)
eas submit --platform android --profile production

# Puis promouvoir vers production depuis Google Play Console
```
