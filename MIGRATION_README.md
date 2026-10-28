# Migration Patteo — reprise sur un autre PC

Ce dépôt contient le projet Patteo, les sources du site et de la publicité, les visuels, les tests, les fichiers de dépendances et le contexte pour reprendre le travail. Les clés secrètes, caches et `node_modules` ne sont pas publiés.

## Reprise rapide

1. Installer Git et **Node.js** sur le nouvel ordinateur. Version utilisée : **24.14.0**, également indiquée dans `.nvmrc` ; minimum déclaré : Node 20.
2. Récupérer le dépôt :

   ```sh
   git clone https://github.com/nael34/PATTEO.git
   cd PATTEO
   ```

3. Lire `AVANCEMENT_PROBLEMES_IDEES.txt` et `ENVIRONNEMENT_ET_ACCES.txt` pour reprendre le contexte. `REPRISE_NOUVEAU_PC.txt` contient aussi un message prêt à donner à l'assistant.
4. Installer les dépendances :

   ```sh
   npm ci
   ```

5. Si nécessaire pour les API ou une nouvelle génération vocale, copier `.env.example` vers `.env.local` et renseigner uniquement les variables utiles. Ne jamais publier `.env.local` dans Git. Aucune clé n'est nécessaire pour consulter le site statique ou réutiliser les voix déjà générées.
6. Lancer le site :

   ```sh
   npm run dev
   ```

   Puis ouvrir http://localhost:4187

7. Vérifier le projet :

   ```sh
   npm run check
   ```

Sous PowerShell, utiliser `npm.cmd` si `npm.ps1` est bloqué. Les lanceurs `DEMARRER_WINDOWS.cmd` et `DEMARRER_MAC_LINUX.sh` installent les dépendances si elles sont absentes, puis lancent le serveur.

`npm run dev` sert uniquement les pages statiques : les routes `/api` nécessitent l'environnement Vercel et les variables correspondantes.

Les sources vidéo, les WAV de narration et les sons sont inclus. Comme convenu, le MP4 final stocké uniquement dans iCloud n'est pas poussé. Les ressources des quatre skills vidéo locaux sont sauvegardées dans `OUTILS_VIDEO/` ; FFmpeg, ffprobe, le navigateur de rendu et les connexions aux comptes doivent être rétablis sur le nouvel OS.

## Ce qui est déjà fait

- Boutique Patteo avec accueil, fiche produit, variantes, panier persistant, FAQ et informations de livraison.
- Site statique pré-rendu dans `dist/`, avec serveur local `server.mjs`.
- Parcours de paiement Stripe et endpoints API présents ; les secrets restent dans les variables d'environnement/Vercel.
- Consentement Pixel Meta et préparation Conversions API documentés dans `README.md`.
- Assets visuels, prompts et projet vidéo Patteo inclus.
- Tests automatisés présents dans `tests/`.

## Points à reprendre / problèmes connus

- Les informations juridiques, CGV, retours, SAV, identité de l'entreprise et médiateur doivent être complétées et validées.
- Le prix, les coûts fournisseur, SKU, stock, dimensions, composition, entretien et délais de livraison doivent être confirmés.
- Les visuels actuels sont illustratifs/IA ; les remplacer par les photos réelles dès réception.
- Vérifier le domaine, Vercel, les variables de production, le webhook Stripe et la réception des e-mails Resend.
- Le jeton `META_CAPI_ACCESS_TOKEN` est nécessaire pour activer l'envoi serveur Meta en production.
- Faire un achat réel contrôlé avant toute campagne et vérifier Stripe, Resend et Meta Events Manager.
- Vérifier les offres, variantes, prix, disponibilité et livraison dans Merchant Center.

## Fichiers importants

- `AVANCEMENT_PROBLEMES_IDEES.txt` : avancement, problèmes rencontrés, idées et préférences.
- `ENVIRONNEMENT_ET_ACCES.txt` : versions, variables et comptes à reconnecter.
- `REPRISE_NOUVEAU_PC.txt` : récupération GitHub et message de reprise.
- `README.md` : état détaillé et checklist commerciale (certaines indications historiques sont précisées dans le résumé de migration).
- `VERIFICATION.md` : vérifications du parcours.
- `THIRD-PARTY.md` : provenance des éléments tiers.
- `IMAGE-PROMPTS.md` : prompts des visuels.
- `package.json` / `package-lock.json` : dépendances et scripts.
- `videos/patteo-promo/` : projet de vidéo promotionnelle et ses assets.

## Sécurité

Le dépôt ne contient pas `.env.local`, les jetons, les clés Stripe, les clés Meta ni les identifiants Vercel. Récupérer les accès dans les comptes existants sur le nouvel ordinateur et ne pas les écrire dans Git.
