# 🚀 Écosystème d'Automatisation n8n v3 (3.0.1) — BOGBE'S GROUPE

Ce répertoire contient les workflows de production n8n v3 optimisés pour piloter et sécuriser l'infrastructure immobilière.
Grâce à n8n v3, les exécutions bénéficient du nouveau moteur d'exécution interne haute performance (`N8N_RUNNERS_MODE=internal`), d'une gestion mémoire allégée et d'un contrôle strict des timeouts.

---

## 📦 Workflows Disponibles

### 1. `n8n-whatsapp-failover-hub.json`
* **Objectif :** Hub de relai d'urgence quand la passerelle Wasender est en panne, déconnectée ou expirée (erreur 402).
* **Déclencheur :** Webhook `POST /webhook/whatsapp-fallback`
* **Comportement :**
  * Reçoit les alertes de visites et messages clients bloqués.
  * Identifie si l'alerte est destinée aux administrateurs.
  * Prépare la transmission de secours (Telegram, Email, Meta WhatsApp Cloud API).
  * Acquitte immédiatement la plateforme avec confirmation de prise en charge.

### 2. `n8n-quittances-relances-auto.json`
* **Objectif :** Automatisation complète de la gestion locative (génération et recouvrement des loyers).
* **Déclencheurs :**
  * `0 8 1 * *` (Le 1er de chaque mois à 08h00 UTC) : Appelle `/api/quittances/cron-generer` pour initialiser les quittances de tous les baux actifs (`statut = 'signe'`).
  * `0 9 * * *` (Quotidien à 09h00 UTC) : Appelle `/api/quittances/cron-relances` pour envoyer les relances selon les jalons contractuels :
    * **J-3 :** Rappel préventif d'échéance.
    * **J-1 :** Rappel veille d'échéance.
    * **J+1 :** Constat de retard immédiat.
    * **J+7 :** Mise en demeure amiable avant pénalités.

### 3. `n8n-listing-enricher-ai.json`
* **Objectif :** Ingestion et extraction IA haute cadence des annonces immobilières postées dans les groupes WhatsApp ivoiriens.
* **Déclencheur :** Webhook `POST /webhook/wassender-immobilier`
* **Comportement :**
  * Filtre le bruit et les messages non-immobiliers.
  * Extrait les attributs clés (commune, quartier, prix FCFA, type de bien, téléphone démarcheur) via Groq LLaMA 3.3 70B ou Google Gemini Flash.
  * Insère directement dans la table `locaux` de Supabase FRESH (`https://fzccugmyoglemjwidqrl.supabase.co`).

---

## 🛠️ Comment Importer ces Workflows dans n8n

1. Ouvre ton interface n8n : **https://kassio1-n8n-free.hf.space**
2. Clique sur **Workflows** > **Import from File...**
3. Sélectionne l'un des fichiers `.json` de ce répertoire.
4. Active le workflow avec le bouton bascule en haut à droite (**Active**).
