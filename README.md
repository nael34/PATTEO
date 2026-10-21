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

- Site public et indexable ; `robots.txt`, sitemap et URL canoniques configurés. La page de commande reste exclue de l’index.
- Stripe est en mode live uniquement en production ; les environnements preview et development restent en mode test. Les clés sont des variables Vercel, jamais enregistrées dans le dépôt.
- Le webhook Stripe live est configuré pour `checkout.session.completed` et `checkout.session.async_payment_succeeded`. L’e-mail de confirmation Resend ne part qu’après relecture et validation du paiement payé dans Stripe.
- Le pré-rendu expose un événement `purchase` sans données personnelles et dédupliqué par numéro de commande. Aucun tag Google Ads n’est actif : l’identifiant de conversion et le consentement/confidentialité restent à finaliser.
- Le gros plan IA `dist/assets/texture-macro.jpg` illustre la chenille grise dans la galerie et dans la section « Tout est dans la texture ». Il ne constitue pas une photographie de microscopie ni une vérification de la composition textile.
- Aucune clé, aucun compte Stripe ni projet Vercel de PinkPrint n’a été utilisé.
- Pas de faux avis, compteurs de clients, disponibilité inventée ou promotion fictive.
- Les visuels IA sont illustratifs. Le produit et les teintes exactes restent à rapprocher des variantes fournisseur avant diffusion publicitaire.
- Le paiement collecte les coordonnées et l’adresse de livraison via Stripe ; la confirmation passe par Resend. Les textes de confidentialité, CGV et retours doivent être complétés et validés avant les campagnes.

## À valider avant campagnes publicitaires

1. Prix TTC définitif, coûts et conditions fournisseur pour chaque couleur, SKU, stock, dimensions, composition et consignes d’entretien.
2. Conditions de livraison, de retour, adresse SAV, identité juridique, mentions légales, CGV et confidentialité. Les dialogues actuels disent explicitement que ces informations ne sont pas encore complètes.
3. Domaine de marque, disponibilité du nom et hébergement commercial choisis.
4. Effectuer un achat réel contrôlé avec un client, puis confirmer la réception du mail de commande. Ne jamais considérer une simple page de retour comme une preuve de paiement.
5. Fournir l’identifiant/label de conversion Google Ads, finaliser le consentement et activer le tag uniquement après validation de la politique de confidentialité.
6. Finaliser les mentions légales, CGV, retours, médiateur et informations d’entreprise avec le client. Remplacer les visuels IA par les photos réelles dès réception.
7. Vérifier les offres, variantes, prix, disponibilité et livraison dans Merchant Center avant toute campagne Shopping/PMax.

Le design privilégie un prix visible, la livraison près du bouton d’achat, une fiche dédiée avec variantes sélectionnables et une navigation mobile simple. Cela ne garantit ni conversion ni acceptation publicitaire.

Références officielles consultées :
- https://support.google.com/merchants/answer/4752265?hl=fr
- https://support.google.com/merchants/answer/9158778?hl=fr
