# Fiches « Annonces web » — présentation de la description

## Objectif

Améliorer la lecture de la section « À propos de ce bien » sur ordinateur et
téléphone sans modifier les données originales ni exposer les coordonnées de
la source. La page doit permettre de comprendre le bien en quelques secondes,
puis de consulter les détails utiles.

## Décision de design

La section affiche la **description complète** du bien. Aucun résumé, classement
ou réécriture éditoriale n'est généré. Le texte est seulement nettoyé pour le
rendu public, puis espacé visuellement en paragraphes et lignes lisibles.

Le bloc conserve le bleu de la marque, ses bordures actuelles et ses rayons,
mais utilise davantage d'espace entre les niveaux. Les informations principales
(prix, surface, pièces) restent au-dessus de la description et ne sont pas
répétées dans le texte.

## Normalisation du contenu

La fonction de présentation nettoie uniquement l'affichage public :

- suppression du HTML, des liens, des adresses e-mail et des numéros de contact ;
- suppression des hashtags en fin de texte (aucun hashtag ne doit rester dans le
  rendu public) ;
- conservation des séparateurs `•`, `·`, `▪`, `◦`, `;` et des retours à la ligne,
  avec seulement des retours visuels supplémentaires pour aérer l'affichage ;
- conservation de tous les mots, chiffres, marqueurs de prix et de loyer de la
  description après nettoyage ;
- conservation du texte source en base pour les administrateurs.

Les liens, e-mails et numéros de téléphone sont retirés du contenu affiché
(aucun lien ou numéro réel ne doit survivre). Un libellé neutre comme
« Coordonnées masquées » peut être utilisé dans une zone réservée aux
administrateurs, mais les placeholders techniques `[contact retiré]` et
`[lien retiré]` ne doivent pas apparaître au prospect. Les formats couverts
incluent les numéros ivoiriens `+225`, `00225`, `07`, `05` et `01`, avec ou sans
espaces, points, parenthèses ou tirets.

Si aucun découpage fiable n'est possible, la page garde un paragraphe unique
avec une largeur maximale et des retours à la ligne respectés. Si le contenu est
vide, la section n'est pas rendue.

## Responsive et accessibilité

- téléphone (≤ 639 px) : une seule colonne, texte 15–16 px, éléments espacés et sans
  débordement horizontal ;
- tablette (640–1023 px) : une seule colonne pour respecter l'ordre intégral du
  texte et garder une largeur de lecture stable ;
- écran large (≥ 1024 px) : la description reste dans une colonne contrôlée,
  limitée à environ 75 caractères par ligne ;
- les icônes restent décoratives (`aria-hidden`) et les titres gardent une
  hiérarchie `h2`/`p`/`ul` correcte ;
- contraste maintenu avec les variables de thème existantes ;
- aucun emoji ajouté dans le code ou le contenu d'interface.

## Périmètre technique

- `apps/web/lib/catalogue/description-presentation.ts` : fonction TypeScript
  pure `presentDescription`, qui conserve le texte complet et ne modifie que
  les espaces/separateurs utilisés pour l'affichage ;
- `apps/web/app/(public)/annonce/[id]/page.tsx` : import du module de présentation
  et rendu de la section ;
- `apps/web/tsconfig.json` : autoriser les extensions `.ts` explicites nécessaires
  au test Node ESM strip-types, sans modifier le comportement de compilation ;
- `apps/web/lib/catalogue/public-description.ts` : nettoyage du texte public,
  suppression des coordonnées/hashtags et conservation des retours utiles ;
- `apps/web/scripts/test-description-presentation.mjs` : test déterministe
  obligatoire de la fonction de présentation et du helper de nettoyage. Il sera
- exécuté par `npm run test:description --workspace @immo-ci/web` ; le plan doit
  ajouter explicitement dans `apps/web/package.json` le script
  `"test:description": "node --experimental-strip-types scripts/test-description-presentation.mjs"`
  ainsi que `"engines": { "node": ">=22.6.0" }`, requis pour importer les modules `.ts` purs sans
  nouvelle dépendance ;
- le test importera directement `../lib/catalogue/description-presentation.ts`
  et `../lib/catalogue/public-description.ts`, et couvrira hashtags,
  séparateurs sans marqueur, retours à la ligne, conservation exacte des
  marqueurs prix/loyer/montant, formats de téléphone, absence de placeholders et
  conservation de la valeur source ;
- aucune modification de la base, des données source, du CRM ou des fichiers
  marketing.

## Vérification attendue

- une annonce contenant des hashtags et une longue phrase est lisible sans
  bloc compact ;
- une annonce structurée par `;` ou `•` reste complète et est seulement espacée ;
- une annonce non structurée par un titre mais contenant `;`, `•` ou des retours
  à la ligne reste complète et lisible ;
- aucun prix, loyer ou autre détail descriptif n'est supprimé ou résumé ;
- aucun hashtag, numéro, e-mail ou URL réel ne reste dans le rendu public ;
- la page compile et les routes `/annonce/[id]` existantes répondent toujours.

La vérification visuelle couvre les largeurs 390 px, 768 px et 1440 px. La
vérification accessibilité contrôle les titres et listes sémantiques, `aria-hidden`
sur les icônes décoratives, la navigation clavier, le contraste et l'absence de
débordement horizontal.
