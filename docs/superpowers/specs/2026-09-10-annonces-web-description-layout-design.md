# Fiches « Annonces web » — présentation de la description

## Objectif

Améliorer la lecture de la section « À propos de ce bien » sur ordinateur et
téléphone sans modifier les données originales ni exposer les coordonnées de
la source. La page doit permettre de comprendre le bien en quelques secondes,
puis de consulter les détails utiles.

## Décision de design

La section adopte une structure éditoriale en trois niveaux :

1. **Résumé** : un paragraphe court, limité à une largeur de lecture confortable.
2. **Points clés** : une liste lisible, un élément par ligne, avec une icône de
   validation et une grille à deux colonnes seulement sur écran large.
3. **À noter** : une information complémentaire séparée visuellement lorsque le
   texte contient un loyer, un prix ou une précision particulière.

Le bloc conserve le bleu de la marque, ses bordures actuelles et ses rayons,
mais utilise davantage d'espace entre les niveaux. Les informations principales
(prix, surface, pièces) restent au-dessus de la description et ne sont pas
répétées dans le texte.

## Normalisation du contenu

La fonction de présentation nettoie uniquement l'affichage public :

- suppression du HTML, des liens, des adresses e-mail et des numéros de contact ;
- suppression des hashtags en fin de texte ;
- reconnaissance des séparateurs `•`, `·`, `▪`, `◦`, `;` et des retours à la ligne ;
- reconnaissance des marqueurs « composition », « caractéristiques »,
  « équipements » et « détails » ;
- détection des marqueurs prix/loyer pour les déplacer vers « À noter » ;
- conservation du texte source en base pour les administrateurs.

Si aucun découpage fiable n'est possible, la page garde un paragraphe unique
avec une largeur maximale et des retours à la ligne respectés. Si le contenu est
vide, la section n'est pas rendue.

## Responsive et accessibilité

- téléphone : une seule colonne, texte 15–16 px, éléments espacés et sans
  débordement horizontal ;
- écran large : résumé et points clés respirent dans une grille contrôlée ;
- les icônes restent décoratives (`aria-hidden`) et les titres gardent une
  hiérarchie `h2`/`p`/`ul` correcte ;
- contraste maintenu avec les variables de thème existantes ;
- aucun emoji ajouté dans le code ou le contenu d'interface.

## Périmètre technique

- `apps/web/app/(public)/annonce/[id]/page.tsx` : présentation et rendu de la
  section ;
- tests unitaires de la fonction de découpage si le projet dispose déjà d'un
  emplacement de tests adapté ;
- aucune modification de la base, des données source, du CRM ou des fichiers
  marketing.

## Vérification attendue

- une annonce contenant des hashtags et une longue phrase est lisible sans
  bloc compact ;
- une annonce structurée par `;` ou `•` produit des points clés ;
- un prix ou un loyer n'est pas dupliqué dans les points clés ;
- les coordonnées restent absentes du rendu public ;
- la page compile et les routes `/annonce/[id]` existantes répondent toujours.
