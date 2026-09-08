# BOGBE’S — amélioration globale, version revue avec Astra

Date : 8 septembre 2026. Référence de départ : `d57e2f4`, avec modifications locales préexistantes. Ce document remplace le cadrage comme référence de travail ; il ne restaure pas le document supprimé dans le dossier de travail.

## Résultat recherché

Un prospect trouve une annonce compréhensible, contacte BOGBE’S avec sa référence et reçoit un suivi. Un commercial sait qui rappeler, pour quel bien, quand et pourquoi. Un administrateur peut comprendre les résultats, leurs causes et les données manquantes.

Le travail conserve le site Next.js, l’application Expo, Supabase et l’identité bleu nuit/or. Il améliore les parcours existants par lots livrables. Une nouvelle interface ne suffit pas à déclarer le CRM fiable.

## État des preuves

Revue du code local réalisée avec l’agent `gpt-6-astra`, en lecture seule. Les migrations présentes dans Git ne prouvent pas leur application en production. Un déploiement avec un ancien SHA et `gitDirty=1` ne prouve pas non plus l’absence du code local.

| Constat confirmé dans le code | Conséquence | Lot |
|---|---|---|
| Fusion en plusieurs écritures, erreurs ignorées, événement `merge` incompatible avec 028 | Fusion partielle, historique incomplet, faux prospect perdu | 1 |
| Entrées contact/visite/réservation sans liaison continue au prospect | Parcours et conversions incomplets | 1 |
| Compteurs Performance sur volumes indépendants et plafonnés | Taux inexacts, dates arbitraires, faux zéros | 2 |
| Onglets du catalogue alimentés avec des zéros pour les sources non sélectionnées | Le visiteur croit les autres catalogues vides | 3 |
| Limites de chargement confondues avec pagination complète | Résultats inaccessibles malgré le compteur | 3 |
| Catalogue natif limité à 100, recherche concurrente, loyers mappés en vente | Résultats anciens et prix ambigus | 4 |
| Favoris natifs UUID utilisés pour des identifiants scraping numériques | Ajouts impossibles ou mauvais détail | 4 |
| Référence et lien absents du message de contact natif | Le conseiller ne sait pas quel bien intéresse le client | 4 |

Les accès effectifs à la production, le schéma SQL déployé, les erreurs observées et les performances restent à mesurer au lot 0. Aucune correction applicative ou migration n’est revendiquée par ce document.

## Ordre d’exécution

1. **Lot 0 — établir la vérité de livraison et les tests** : environnement, schéma, fixtures, état initial.
2. **Lot 1 — sécuriser la traçabilité** : droits, journal, fusion, identité, référence et parcours.
3. **Lot 2 — rendre le CRM exploitable** : formulaires, actions du jour, indicateurs, cohortes et exports.
4. **Lot 3 — clarifier le site public** : catalogue complet, classification, navigation et contact.
5. **Lot 4 — aligner le mobile et livrer** : prix, pagination, favoris, cache, recette et documentation.

Le contrat de référence bien du lot 1 est utilisé par les lots 3 et 4. Les améliorations visuelles indépendantes peuvent avancer après l’état initial ; les nouvelles statistiques attendent les liens fiables. Chaque lot comporte son propre contrôle avant activation.

Plans exécutables :

- [0 — État initial et sécurité de livraison](../plans/2026-09-08-00-verification-environnements.md)
- [1 — Identité et traçabilité CRM](../plans/2026-09-08-01-tracabilite-crm.md)
- [2 — Pilotage et expérience commerciale](../plans/2026-09-08-02-pilotage-commercial.md)
- [3 — Catalogue et compréhension visuelle](../plans/2026-09-08-03-catalogue-experience.md)
- [4 — Mobile et recette finale](../plans/2026-09-08-04-mobile-livraison.md)

## Sources et références

| Source physique | Usage | Clé stable proposée |
|---|---|---|
| Supabase principal `tjvozbcnkimfgwonslzm` | Comptes, CRM, biens BOGBE’S | `bogbes:<uuid>` |
| Scraping `rvehvcovkrcykobvenbg` | `v_annonces`, photos `annonces-photos` | `web:<id>` |
| Flash historique `udyfhzyvalansmhkynnc` | Lecture historique | `flash-old:<id>` |
| Flash intermédiaire `mignebexvzrpfxgbhjuf` | Lecture historique | `flash-mid:<id>` |
| Flash récent `jdjzcxvtvxfqflvwkfgv` | Lecture et ingestion actuelle | `flash-fresh:<id>` |

Les adaptateurs et le routage historique des identifiants sont conservés. Pas de recopie intégrale des trois bases flash. L’affichage regroupe les trois sous-sources sous « Offres des agences », tout en conservant leur origine exacte dans le CRM.

`PropertyRef = { source, sourceId }` est le contrat commun. `sourceId` reste une chaîne, UUID ou entier positif décimal canonique ; ne pas convertir un BIGINT en nombre JavaScript sans validation de précision. Une référence courte visible (`WEB-123`, `FLASH-123`, référence BOGBE’S) accompagne la clé structurée interne. L’URL est générée côté serveur sur `https://bogbesgroup.com` avec les routes existantes `/annonce/<id>`, `/offre-flash/<id>`, `/biens/<uuid>` ; elle ne provient pas d’un champ arbitraire du navigateur.

Les nouveaux liens flash précisent `?origine=flash-old|flash-mid|flash-fresh`, validé par le résolveur serveur, et les références visibles utilisent `FLASH-OLD-123`, `FLASH-MID-123` ou `FLASH-FRESH-123`. Ce contrat vaut également pour les favoris et messages conseiller. Les anciens liens sans origine utilisent les plages historiques après vérification de leur unicité ; si un conflit est constaté, afficher une résolution contrôlée sans choisir silencieusement un autre bien.

Le CRM conserve aussi un instantané minimal du bien : titre, commune, catégorie, prix/périodicité, URL interne et date de capture. Un bien retiré conserve son historique ; sa fiche indique son indisponibilité et propose des alternatives. Une nouvelle importation reçoit une nouvelle clé, sauf correspondance explicite documentée dans une table d’alias. Aucun rapprochement automatique sur le seul titre/prix.

Les photos suivent l’ordre `position`, avec URL Storage publique, puis URL source HTTPS autorisée, puis visuel local neutre. Échec mémorisé par image pour éviter une boucle. La table `annonce_photos` compte des photos, pas des biens. Les informations administrateur et les liens propriétaires ne sont jamais inclus dans un DTO public ni son cache. Les descriptions publiques sont nettoyées du HTML et des coordonnées directes ; le texte original reste consultable par les admins.

## Droits et confidentialité

| Acteur | Catalogue et descriptif public | Demande personnelle | Contacts propriétaires, descriptif original | Gestion CRM et exports |
|---|---|---|---|---|
| Visiteur | Oui, version expurgée | Déposer une demande, réponse opaque | Non | Non |
| Prospect connecté | Oui | Ses propres demandes autorisées par RLS | Non | Non |
| Propriétaire | Oui | Ses données selon les règles actuelles | Ses propres données ; aucun accès global | Non |
| Tout administrateur | Oui | Toutes les demandes CRM | Oui, par endpoint/RPC admin | Oui |
| Conseiller responsable | Administrateur assigné dans la première version | Même capacité admin | Oui | Oui |

Ne pas créer un nouveau rôle `conseiller` sans migration et matrice dédiées. L’affectation organise le travail et n’empêche pas les autres administrateurs de lire un dossier. Les restrictions de colonnes de 019 restent en place : une policy admin ne les annule pas. Contrôler la session serveur **à chaque** route, action et export ; un layout seul ne protège pas une action directe.

Les RPC humaines sont exécutées avec le JWT de session : rôle admin vérifié en base, acteur tiré de `auth.uid()`, `search_path` fixé et droits `EXECUTE` limités. Les RPC d’ingestion, séparées, sont réservées au service serveur et inscrivent l’origine système. Les clés service restent côté serveur. Refus explicite 401/403 pour les API ; redirection de connexion pour les pages.

Les données CRM ne vont ni dans AsyncStorage, ni dans le cache partagé/CDN, ni dans les journaux de requêtes. Les consultations de coordonnées originales et exports sont journalisés avec acteur, cible, horodatage et résultat, sans copier le téléphone. Aucun export n’est public. Aucun effacement automatique de dossiers ou historique n’est activé : l’inventaire de conservation/anonymisation est documenté au lot 0, et toute suppression reste une opération métier explicite. Les brouillons sensibles restent en mémoire et disparaissent à la déconnexion.

## Contrat CRM

### Identité et opportunités

Le prospect représente une personne ; l’opportunité représente un parcours commercial. Un prospect peut rechercher plusieurs biens. Les coordonnées du demandeur (`visitor_*`, `client_*`, utilisateur connecté) servent au rapprochement ; `proprietaire_id` et `flash_owner_phone` ne doivent jamais servir d’identité prospect.

Normalisation versionnée SQL/TypeScript : espaces et séparateurs retirés ; `+225` et `00225` avec dix chiffres deviennent une même clé CI ; numéro local CI de dix chiffres reçoit `+225`. Les anciens numéros de huit chiffres restent « à vérifier », sans préfixe inventé. Un numéro étranger déjà international conserve son indicatif ; un numéro étranger/local ambigu n’est pas fusionné automatiquement. Email : trim et casse normalisée, sans modifier points ou suffixes `+`. Vide/invalide => aucune clé.

Rattachement automatique seulement avec identité authentifiée ou canal vérifié et correspondance unique. Si téléphone et email désignent deux dossiers, ou si la demande anonyme revendique une identité non vérifiée, conserver la demande dans la file de rapprochement ; ne pas exposer de dossier existant au navigateur. Le service retourne des identifiants internes typés ; la réponse publique retourne uniquement la référence de la nouvelle demande.

Table nouvelle `crm_opportunities` :

| Champ | Contrat |
|---|---|
| `id`, `prospect_id` | UUID durable, FK prospect canonique |
| `property_source`, `property_source_id`, `property_snapshot` | Paire référence nullable uniquement pour recherche générale ; instantané JSON sans coordonnées |
| `status` | `nouveau`, `contacte`, `visite_planifiee`, `visite_realisee`, `relance`, `gagne`, `perdu` |
| `assigned_to` | Admin existant ou NULL, suppression du compte => désaffectation journalisée |
| `next_action`, `next_action_at` | Texte et timestamptz, saisis ensemble pour une relance |
| `loss_reason`, `loss_note` | Motif normalisé ; note obligatoire pour `autre` |
| `channel`, `source_detail` | Canal `web`, `whatsapp`, `flash` et origine exacte structurée |
| `version`, `created_at`, `updated_at`, `closed_at` | Concurrence optimiste et dates serveur |

Ajouter `opportunity_id` nullable à `contact_requests`, `visites`, `reservations`, `crm_events`. Préserver les FK `bien_id` existantes ; ajouter la paire de référence externe aux trois entités sans insérer un ID scraping dans une FK UUID. Les nouvelles demandes sont liées en transaction dans la base principale. Une demande réitérée rejoint une opportunité ouverte du même prospect et du même bien si elle est unique ; plusieurs correspondances ou recherche générale => décision explicite. Un parcours fermé n’est jamais rouvert implicitement.

Précisément : création de la demande, de sa référence et de l’événement d’ingestion toujours atomique. Si identité non vérifiée/ambiguë, `prospect_id`, `opportunity_id`, `cycle_id` restent NULL avec état « à rapprocher ». Leur attribution ultérieure est une transaction auditée. Une identité vérifiée sans parcours existant crée une opportunité et son premier cycle ; une recherche générale vérifiée crée une opportunité sans bien, sauf sélection explicite d’un besoin existant. La recherche générale anonyme reste une demande à rapprocher.

Les trois tables de demandes portent `crm_link_status` (`linked`, `needs_review`, `legacy_unreviewed`) et `version`. Les anciennes lignes commencent en `legacy_unreviewed` jusqu’au backfill vérifié. Une file « À rapprocher » permet à l’admin de sélectionner/créer personne et parcours ; une RPC dédiée vérifie liens, référence, version et idempotence, puis écrit liaison et événement en transaction. Aucune relation n’est choisie uniquement parce qu’elle apparaît en premier dans la liste.

Table nouvelle `crm_cycles` : `id uuid`, `opportunity_id uuid`, `sequence integer`, `opened_at timestamptz`, `closed_at timestamptz nullable`, `reopen_reason text nullable`, `attribution jsonb`. Unicité `(opportunity_id, sequence)` et au plus un cycle ouvert par opportunité. Ajouter `cycle_id` nullable aux contacts, visites, réservations et événements ; une contrainte transactionnelle vérifie leur cohérence avec `opportunity_id`. L’attribution du cycle est figée au premier contact humain ; les jalons sont dérivés des événements/entités datés du même cycle. Réouverture = nouveau cycle, pas réutilisation des anciennes visites dans de nouvelles conversions.

Les champs CRM actuels sur `prospects` sont conservés pendant la migration. Après activation, l’opportunité devient la source des statuts commerciaux ; la fiche personne présente ses opportunités. Les statuts historiques `en_cours`, `rdv`, `traite` sont affichés comme hérités tant que leur correspondance n’est pas établie ; `traite` ne signifie pas automatiquement `gagne`.

### Transitions, visites et refus

- Nouveau → contacté, visite planifiée, relance ou perdu.
- Contacté → visite planifiée, relance ou perdu.
- Visite planifiée → visite réalisée, relance ou perdu ; replanification par événement sans changement de statut.
- Visite réalisée → relance, gagné ou perdu.
- Relance → contacté, visite planifiée, visite réalisée, gagné ou perdu, selon preuves de jalons.
- Gagné/perdu → réouverture explicite en relance, avec motif et nouvelle échéance. Les anciens jalons restent historiques ; les métriques décrivent le cycle concerné.

`visite_realisee` exige une visite et son compte rendu. `gagne` exige une confirmation commerciale explicite et une réservation validée ou une justification « hors réservation » ; la demande de réservation seule ne suffit pas. Le passage direct gagné sans visite est possible seulement avec justification et reste un parcours hors entonnoir standard.

Exception explicite à la liste des transitions : depuis tout statut ouvert (`nouveau`, `contacte`, `visite_planifiee`, `visite_realisee`, `relance`), un admin peut confirmer `gagne` avec preuve de réservation validée ou référence de conclusion hors réservation, et justification obligatoire pour tout jalon sauté. Aucun contact/visite fictif n’est créé. Ce gain est compté dans les gains et reste hors conversion standard s’il manque un jalon.

Motifs de perte : `prix`, `bien_indisponible`, `proprietaire_injoignable`, `prospect_absent`, `documents_incomplets`, `autre`. Fusion, refus administratif et perte commerciale sont trois opérations distinctes. Les issues visite existantes `realisee`, `annulee`, `no_show`, `non_conclue` restent disponibles ; une visite réalisée non conclue compte comme réalisée, avec une raison et la prochaine action.

Chaque mutation valide rôle, données, état courant et version ; elle écrit l’état et l’événement dans **une transaction**. Conflit => message demandant de recharger, sans écrasement. No-op => aucun double événement. Échec SQL => aucune réussite affichée et aucun fallback silencieux.

### Fusion et journal

RPC unique de fusion : identité acteur vérifiée, `request_id` unique avec empreinte des arguments, verrouillage des deux UUID dans un ordre stable, rollback total à la moindre erreur. Ajouter `merged_into`, `merged_at` à prospects ; interdire les cycles, la fusion avec soi-même et les cibles alias.

Repointage des contacts, visites, réservations et opportunités en transaction. Remplir uniquement les champs vides du principal, conserver les conflits dans l’audit. Les anciennes activités et événements restent immuables sur leur identité originale ; la timeline du principal agrège tous ses alias. Une fusion ne regroupe pas automatiquement deux opportunités et ne crée aucune perte commerciale.

Étendre explicitement les contraintes `crm_events` : entités `opportunity`, `alert_policy`, `alert_override` ; événements `merged`, `reopened`, `validation_changed`, `visit_outcome_recorded`, `identity_linked`, `policy_changed`, `alert_snoozed`, `accessed`, `exported` en plus des valeurs existantes. Conserver `entity_type`, `entity_id`, acteur/origine, avant/après, `prospect_id`, `opportunity_id`, motif, métadonnées et corrélation. Les politiques et reports d’alerte ont un `id uuid` utilisable comme `entity_id`. Supprimer les droits directs d’édition/suppression pour les rôles applicatifs ordinaires ; les opérations de maintenance privilégiées restent auditées, sans prétendre à une immutabilité absolue du service-role.

Origines : `human`, `system`, `backfill`, `legacy_unknown`. Pour un événement ancien sans acteur fiable, garder `actor_id=NULL` et `legacy_unknown`, affiché « Auteur historique non renseigné ». Ne pas inventer d’acteur ni transformer une ancienne action humaine en action système. La contrainte acteur obligatoire concerne les nouvelles mutations humaines ; aucune nouvelle action applicative ne peut choisir `legacy_unknown`.

## Mesures et actions

Le tableau d’accueil commercial montre au plus quatre indicateurs : à contacter, relances dues, comptes rendus attendus, opportunités non assignées. Puis une liste priorisée avec responsable, annonce/référence, dernière action et prochaine échéance. Les détails, historique, qualité et graphiques sont accessibles progressivement, sans masquer les erreurs.

**Unité analytique : cycle distinct d’opportunité (`COUNT(DISTINCT cycle_id)`).** Pour un cycle initial, le premier contact humain consigné définit l’entrée dans la cohorte `[début, fin)` en `Africa/Abidjan`. Une réouverture crée atomiquement un nouvel identifiant de cycle, l’état et l’événement, avec des jalons propres ; conserver les étapes antérieures dans leur cycle. Deux cycles d’une même opportunité dans la période sont deux unités distinctes, explicitement étiquetées « cycles commerciaux ». Les demandes reçues avant contact constituent un indicateur séparé de traitement. Aucune ouverture WhatsApp ou simple clic ne devient un contact réussi.

À une date d’observation affichée :

- Contact → visite : cycles de la cohorte ayant une visite effectivement réalisée après le contact / cycles contactés de la cohorte.
- Visite → réservation : membres précédents ayant une réservation validée après leur première visite réalisée / membres ayant une visite réalisée.
- Contact → réservation : cycles ayant les trois jalons ordonnés / cycles contactés.
- Gagné : confirmation commerciale, affichée séparément des réservations demandées/validées.
- Délais : moyenne, médiane et taille d’échantillon des premiers jalons admissibles ; dates incohérentes exclues et signalées. Sans dénominateur : « — », jamais 0 % inventé.

Figer conseiller, commune, source, canal et type au début du cycle pour l’attribution des cohortes ; montrer séparément le responsable actuel pour la charge de travail. Valeurs manquantes => groupe « Non renseigné ». Sources de catalogue et canaux d’acquisition ont des filtres distincts. Les agrégations SQL ne téléchargent pas 5 000 dossiers pour compter ; le tableau présente le nombre de données non reliées et le taux de complétude.

Exports CSV détaillés et PDF de synthèse : mêmes filtres, dénominateurs, instant d’observation, groupe « Non renseigné » et règles d’accès que l’écran. Champs CSV neutralisés contre l’interprétation comme formule. Pas de coordonnées dans le PDF de synthèse ; export CRM détaillé disponible seulement aux admins.

### Alertes internes

Première livraison : file interne uniquement, actualisée à l’ouverture/retour sur l’écran et par action « Actualiser » ; aucun email, WhatsApp, push ou nouveau cron implicite.

| Alerte | Déclencheur initial, affiché et configurable |
|---|---|
| Demande sans réponse | 4 heures calendaires depuis réception, aucun contact humain consigné |
| Relance en retard | `next_action_at < maintenant`, cycle ouvert |
| Visite sans compte rendu | 2 heures après fin prévue ; durée par défaut 1 heure si absente, clairement indiquée |
| Prospect/opportunité non assigné | Immédiat pour un dossier ouvert |
| Réservation sans visite | Réservation sans visite réalisée précédente liée ; justification visible |
| Refus sans motif | Validation rejetée sans note ou perte commerciale sans motif ; distinguer les deux |

Le délai de 4 heures est une valeur de démarrage, pas une promesse client ni une mesure en heures ouvrées. Stocker la politique versionnée en base, modifiable par admin. Une clé `(type, entité, cycle, échéance)` identifie l’alerte ; résolution automatique quand la cause disparaît. Reporter exige une date, un acteur et une raison ; l’alerte revient après échéance si non résolue. L’acquittement ne clôt pas le dossier.

## Classification et langage visuel

Séparer **famille**, **type**, **meublé**, **transaction**, **périodicité** et **source**. « Résidence meublée » n’est pas une transaction. Ne pas inventer le type d’un bien à partir d’une photo ou convertir systématiquement « résidence » en appartement.

| Famille de recherche | Types visibles |
|---|---|
| Appartements et studios | Appartement, studio |
| Maisons et villas | Maison, villa |
| Terrains | Terrain |
| Bureaux et commerces | Bureau, commerce |
| Résidences et immeubles | Résidence meublée historique, immeuble lorsqu’explicite |
| Autres biens | Type absent ou non reconnu, libellé source conservé |

« Meublé » est un filtre transversal ; la résidence meublée historique le satisfait sans réécrire les données brutes. Les catégories de recherche sont versionnées et traduites FR/EN. Les anciennes URL `type_bien=...` continuent à fonctionner ; les variantes inconnues ne deviennent pas silencieusement « appartement ».

Navigation publique : « Annonces » mène au catalogue. Immédiatement sous le titre/recherche : Tout, Biens BOGBE’S, Offres des agences, Annonces web. « Vérifié » reste un badge et un filtre indépendant : publié par BOGBE’S n’implique pas vérifié. Les onglets conservent tous les autres filtres et remettent la pagination au début. Leurs compteurs appliquent les mêmes critères, sauf la source active ; un service indisponible affiche « indisponible », jamais un zéro fabriqué.

Ordre visuel : recherche → source → intention louer/acheter → famille/commune/budget → résultats. Mobile : familles lisibles, filtres secondaires dans un panneau avec résumé et bouton Appliquer. Compteur près des résultats, format français et mot « annonces », plutôt qu’un grand nombre isolé. Les sources représentent des annonces ; aucun compteur ne prétend compter des immeubles physiques distincts entre sources.

Fiche : titre/localisation, photos, prix avec périodicité, faits utiles, CTA et descriptif. CTA : « Échanger avec un conseiller » ; soutien : « Ce bien vous intéresse ? Vérifions sa disponibilité et préparons votre visite. » Aucun faux compte à rebours ni rareté inventée. Sur mobile, CTA fixé au-dessus de la navigation avec safe-area et espace réservé ; éviter le chevauchement du bouton flottant WhatsApp. Tous les liens de contact portent la référence et l’URL BOGBE’S. La vue admin propose en plus coordonnées originales, descriptif intégral et journal, sans les incorporer au HTML public mis en cache.

Typographie : texte principal 16 px minimum, secondaire 14 px, champs mobiles 16 px, interligne 1,45–1,6, paragraphes <= 75 caractères de largeur. Cibles interactives 44 × 44 px minimum. Contraste texte 4,5:1 et grand texte/interface 3:1 ; état actif visible sans se fier à la couleur seule. Le doré identifie l’action principale, vert la réussite, rouge les erreurs, ambre l’attention. Navigation clavier, focus, libellés, `aria-current`, dialogues et reduced-motion vérifiés. Ne pas animer l’apparition des résultats essentiels en les laissant invisibles avant hydratation.

## Budgets et cache

Objectifs de recette à mesurer, pas performances annoncées comme acquises :

| Mesure | Cible |
|---|---|
| Pagination | 24 annonces, maximum API 48 ; aucun plafond global silencieux |
| Recherche native | Debounce 300 ms, dernière requête seule appliquée, annulation précédente |
| Catalogue multisource | Lecture bornée par page/provider, aucun téléchargement de milliers de lignes pour la première page |
| Favoris | Une lecture groupée par session/liste, pas une requête par carte |
| Images | Première image visible <= 180 Ko lorsque la source permet un format adapté ; ratio et taille réservés |
| Web public | LCP <= 2,5 s, CLS <= 0,1 ; TTFB chaud <= 1 s visé |
| Interaction | Retour visuel <= 100 ms ; INP cible <= 200 ms mesuré si télémétrie disponible |
| Cache public serveur | Liste 30 s, stale 60 s ; compteurs 60 s ; communes 10 min |
| Cache privé | `no-store`, aucune donnée propriétaire/CRM en cache public |
| Cache natif public | Frais 10 min ; lecture hors ligne maximum 24 h ; 5 recherches/120 annonces maximum |

Recette web : cinq passages par route, version production, appareil/viewport et réseau identiques (profil mobile 1,6 Mb/s, RTT 150 ms, CPU ×4), médiane documentée. Le réseau source peut empêcher une cible : enregistrer la mesure et sa cause, sans masquer une régression. Mesurer les tailles JS avant/après ; aucun nouveau framework UI ni bibliothèque de graphique si l’existant suffit.

Le cache natif contient seulement les DTO publics, avec version de schéma. Afficher âge et mode hors ligne ; une annonce en cache n’atteste pas de sa disponibilité. À la reconnexion, revalider avant toute action. Déconnexion/changement de compte : vider états et favoris privés, brouillons sensibles en mémoire ; le catalogue public peut rester. Aucune mutation CRM/favori n’est mise en file hors ligne dans cette version.

## Définition de livraison

Chaque lot est terminé seulement avec modifications relues, tests ciblés verts, build/type-check pertinents, note des limites et commit ciblé. La production ajoute vérification de migrations/RLS, déploiement du bon projet, contrôle du domaine et parcours réel en lecture seule. L’archive native/OTA est un livrable distinct du site web.

La recette couvre accueil, catalogue par source, détail BOGBE’S/web/flash, contact, connexion et retour, favoris, visites/réservations, dashboard propriétaire et tous les modules admin. En environnement de test : deux admins, un prospect, un propriétaire, des identités ambiguës, annonces retirées, données incomplètes, réseau lent et panne source. Aucune demande réelle, réservation, invitation ou notification à un tiers n’est envoyée par les tests.
