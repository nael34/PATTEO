# Patteo

Boutique française autonome, séparée de PinkPrint. Accueil, fiche produit, trois couleurs, panier persistant, récapitulatif, FAQ et informations de livraison. Logo et quatre images créés avec l’outil de génération d’images intégré ; prompts dans `IMAGE-PROMPTS.md`, fichiers optimisés dans `dist/assets/`.

## Développement

```sh
npm run dev
node scripts/render.mjs
npm run check
```

Pas de dépendance à installer. Node 20+ suffit. Le serveur local utilise le port 4187. `dist` est un site statique portable, également déployable sur Vercel. `app.js` contient les textes, le prix de départ proposé (29,90 €), les variantes et les interactions ; le script de pré-rendu inscrit le contenu dans le HTML pour un premier affichage immédiat.

## État réel

- Aperçu privé, non indexable ; aucune campagne publicitaire active.
- Paiement non connecté : aucun achat ni prélèvement possible. Le panier reste dans le navigateur.
- Aucune clé, aucun compte Stripe ni projet Vercel de PinkPrint n’a été utilisé.
- Pas de faux avis, compteurs de clients, disponibilité inventée ou promotion fictive.
- Les visuels IA sont illustratifs. Le produit et les teintes exactes restent à rapprocher des variantes fournisseur avant diffusion publicitaire.
- Aucun traceur publicitaire ni collecte de coordonnées.

## À valider avant ouverture / Performance Max

1. Prix TTC définitif, coûts et conditions fournisseur pour chaque couleur, SKU, stock, dimensions, composition et consignes d’entretien.
2. Conditions de livraison, de retour, adresse SAV, identité juridique, mentions légales, CGV et confidentialité. Les dialogues actuels disent explicitement que ces informations ne sont pas encore complètes.
3. Domaine de marque, disponibilité du nom et hébergement commercial choisis.
4. Stripe Checkout côté serveur, prix autorisés côté serveur, webhooks signés et idempotents, confirmation fiable des commandes. Ne jamais considérer une simple page de retour comme une preuve de paiement.
5. Mesure des conversions après consentement adapté, flux Merchant Center cohérent avec chaque variante, prix, disponibilité et livraison.
6. Lever `noindex` et le blocage `robots.txt` seulement après validation, tests de paiement et ouverture publique. Ajouter alors les offres structurées, sitemap et URL canoniques du domaine final.

Le design privilégie un prix visible, la livraison près du bouton d’achat, une fiche dédiée avec variantes sélectionnables et une navigation mobile simple. Cela ne garantit ni conversion ni acceptation publicitaire.

Références officielles consultées :
- https://support.google.com/merchants/answer/4752265?hl=fr
- https://support.google.com/merchants/answer/9158778?hl=fr
