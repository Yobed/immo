# 📱 Passerelle WhatsApp Autonome — BOGBE'S GROUPE (0 FCFA/mois)

Cette passerelle remplace intégralement le service tiers payant **Wasender** sans nécessiter d'abonnement mensuel. Elle est basée sur le moteur open-source **Baileys** (le même moteur utilisé par Wasender et Evolution API).

---

## 🌟 Fonctionnalités

* **100% Gratuit à vie :** Pas d'abonnement (0 $ / 0 FCFA).
* **Interface Web intégrée :** Affiche un QR code dynamique prêt à être scanné depuis votre téléphone.
* **Compatibilité totale avec votre plateforme BOGBE'S :**
  * `POST /send-message` : Envoi de messages texte, images, documents, vocaux.
  * `GET /status` : Surveillance temps réel de la connexion.
  * Relai entrant vers `https://www.bogbesgroup.com/api/whatsapp/webhook` (Sapphire IA).
  * Relai des groupes vers `https://kassio1-n8n-free.hf.space/webhook/wassender-immobilier` (Scraping d'annonces).

---

## 🚀 Déploiement Gratuit en 2 Minutes sur Hugging Face Spaces

Exactement comme vous avez déployé votre instance n8n gratuite :

1. Rendez-vous sur **[Hugging Face Spaces](https://huggingface.co/new-space)**.
2. Nommez votre Space (ex: `whatsapp-gateway` ou `wa-bogbes`).
3. Choisissez **Docker** comme SDK (Blank).
4. Définissez la visibilité sur **Public** (ou Private).
5. Dans votre nouveau Space, ajoutez les 3 fichiers de ce dossier :
   * `Dockerfile`
   * `package.json`
   * `server.js`
6. Ajoutez dans les **Settings** > **Variables and secrets** de votre Space :
   * Variable : `API_KEY` = `votre_cle_secrete_immo_2026`
   * Variable : `WEBHOOK_URL` = `https://www.bogbesgroup.com/api/whatsapp/webhook`
   * Variable : `N8N_SCRAPER_URL` = `https://kassio1-n8n-free.hf.space/webhook/wassender-immobilier`
7. Dès que le conteneur passe en **Running** :
   * Ouvrez l'URL de votre Space (ex: `https://kassio1-whatsapp-gateway.hf.space`).
   * Ouvrez WhatsApp sur votre téléphone > **Appareils connectés** > **Connecter un appareil**.
   * Scannez le QR Code à l'écran.
   * L'écran affiche immédiatement : **✅ WhatsApp opérationnel (+225...)**.

---

## 🔗 Connexion avec votre application Web Next.js

Une fois votre passerelle déployée :

1. Dans votre fichier `apps/web/.env.local` (ou sur Vercel) :
   ```env
   # Remplace l'API payante Wasender par votre passerelle gratuite :
   WHATSAPP_GATEWAY_URL="https://votre-space-nom.hf.space"
   WHATSAPP_API_KEY="votre_cle_secrete_immo_2026"
   ```
2. C'est tout ! Votre plateforme bascule automatiquement sur votre passerelle gratuite, sans aucune modification de code.
