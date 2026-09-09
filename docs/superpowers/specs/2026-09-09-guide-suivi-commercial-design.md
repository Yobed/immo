# Guide de suivi commercial — conception

## Objectif

Remplacer le mode d’emploi court de `/admin/guide` par un guide opérationnel lisible sur téléphone. Un commercial doit pouvoir répondre à trois questions sans quitter le guide : d’où vient la demande, quelle action faire maintenant et quelle information enregistrer ensuite.

## Parcours couvert

Le guide suit une demande depuis quatre origines :

1. une demande de visite depuis la fiche d’un bien du site ;
2. une demande de contact depuis la fiche d’un bien ;
3. un message WhatsApp traité par Sapphire ;
4. une offre flash issue d’une source tierce.

Chaque cas conserve la référence du bien quand elle existe, la source, le téléphone et l’historique des actions. Les prospects ne sont jamais redirigés directement vers le propriétaire sans validation humaine.

## Structure de la page

La page reste accessible depuis `Admin → Guide` et commence par un résumé du flux :

`Nouveau → Contacté → Visite planifiée → Visite réalisée → Relance → Gagné / Perdu`.

Elle est organisée en sections courtes :

- **À retenir en 30 secondes** : les quatre champs à toujours renseigner (statut, conseiller, prochaine action, date) ;
- **1. Recevoir une demande** : reconnaître la source, ouvrir la bonne fiche, vérifier le bien et éviter les doublons ;
- **2. Laisser Sapphire qualifier** : ce que Sapphire collecte, ce qu’elle peut répondre et quand elle doit laisser la main à un conseiller ;
- **3. Prendre en charge** : assigner, contacter, renseigner la prochaine action et conserver la référence ;
- **4. Organiser une visite** : valider ou refuser, notifier les personnes concernées, puis enregistrer le compte rendu ;
- **5. Convertir ou relancer** : réservation après visite, relance datée, résultat gagné ou perdu avec motif ;
- **6. Scénarios d’exception** : demande sans réponse, absent, bien indisponible, numéro manquant, doublon, réservation sans visite et refus sans motif ;
- **Routine quotidienne** : contrôles du matin, mise à jour après chaque échange et contrôle du soir ;
- **Indicateurs** : lecture de Performance et contrôle de Qualité.

Chaque section utilise une carte avec quatre lignes fixes : **Déclencheur**, **Action**, **À enregistrer**, **Fin attendue**. Les liens vers `/admin/suivi`, `/admin/prospects`, `/admin/performance`, `/admin/prospects/qualite` et `/admin/prospects/doublons` sont placés au moment où ils sont utiles.

## Règles métier à expliciter

- Une demande reçue par WhatsApp n’est pas une visite validée : le conseiller doit confirmer le bien, la disponibilité et le créneau.
- WhatsApp Sapphire qualifie la conversation et crée une demande de visite lorsqu’un bien est confirmé. Le conseiller crée ou rattache ensuite manuellement la fiche dans `Prospects` si elle doit entrer dans le pipeline CRM. Une demande web de visite/contact reste d’abord dans `Suivi` ; si aucun prospect correspondant n’existe, le conseiller conserve la référence, le téléphone et la source dans la fiche de demande.
- Une offre flash reste rattachée à son identifiant `locaux_id` et à son numéro source (`flash_owner_phone`) : elle ne se traite pas comme un bien BOGBE'S avec `bien_id`. L’administrateur ouvre la demande contact flash et utilise le contact propriétaire réservé aux admins pour confirmer l’annonce.
- Sapphire peut qualifier et orienter, mais le conseiller valide la disponibilité et organise la visite.
- Pour une demande web, le propriétaire peut recevoir une demande de disponibilité pendant que la visite est `pending`. La notification de confirmation au visiteur part seulement après la validation admin ; un refus doit contenir un motif compréhensible.
- Après une visite, le compte rendu est obligatoire. Si la visite n’aboutit pas, le motif est obligatoire : prix, bien indisponible, propriétaire injoignable, prospect absent, documents incomplets ou autre.
- Une réservation contient le bien, mais l’application n’impose pas encore une clé vers la visite ou le prospect. Le conseiller vérifie donc manuellement le téléphone, le bien et la date, puis renseigne la référence de la visite dans la note ou l’activité CRM.
- Le statut, le responsable, la prochaine action et sa date sont des règles de travail à maintenir sur chaque dossier ; l’application bloque obligatoirement le motif pour `Perdu` et l’action/date pour `Relance`, mais ne bloque pas encore toutes les fiches incomplètes.
- Les coordonnées du propriétaire et des annonces flash sont actuellement réservées au rôle `admin` dans la console.

## Présentation mobile

La page utilise une colonne unique, des cartes espacées, des titres courts et des boutons d’au moins 44 px. Les scénarios d’exception sont repliables pour réduire la charge mentale, tandis que le flux principal reste visible dès l’ouverture.

## Validation

La page doit être vérifiée sur mobile et desktop. Les liens doivent ouvrir les modules concernés, le guide ne doit pas exposer de secret, et le build/type-check doivent rester verts.
