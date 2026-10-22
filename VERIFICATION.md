# Vérification — 21 octobre 2026

## Publication live — commit `aab8cf0`

- Production Vercel prête et liée à la branche `main`; preview/development gardent Stripe test.
- Production Stripe live activée avec webhook signé configuré. Un panier vide renvoie HTTP 400 avant la création d’une session (contrôle sans paiement) ; webhook avec signature invalide renvoie HTTP 400, sans appeler Resend.
- Les confirmations Resend ne sont envoyées qu’après validation Stripe d’une session payée. Les tests locaux couvrent test et live simulés ; aucun débit réel ni e-mail de commande client n’a été simulé.
- `robots.txt`, sitemap, robots meta, URL canonique et images Open Graph vérifiés sur le site public (HTTP 200). La page commande reste `noindex`.
- `npm run check` : 14 tests réussis. Aucun tag Google Ads n’est actif ; l’événement `purchase` est prêt dans `dataLayer`, mais son identifiant/label et la validation du consentement restent à fournir.
- À terminer avec le client avant les publicités : informations légales/CGV/retours/médiateur, contrôle réel du parcours avec un client, photos authentiques et identifiant de conversion Google Ads.

## Mise à jour badges et gros plan

- Badges SVG locaux : PayPal, Apple Pay, Google Pay, Cartes Bancaires, Visa et Mastercard. Le paiement Stripe est activé ; le libellé public indique désormais « Paiement sécurisé par Stripe ».
- Présence dans la fiche produit, le tiroir panier et le récapitulatif.
- Gros plan IA de la chenille grise dans la galerie, agrandissable avec le mécanisme existant, et dans une section dédiée.
- Pré-rendu, syntaxe JavaScript, ressources locales et vérification des différences réussis après l’ajout.
- Pas de nouvelle vérification interactive dans le navigateur : outil de contrôle du navigateur indisponible dans cette session. Les observations mobiles ci-dessous concernent la version précédente.

## Vérifié

- Cinq pages pré-rendues, chacune avec titre principal, langue française et métadonnées mobiles.
- Toutes les ressources locales référencées existent ; quatre images optimisées et logo chargent.
- JavaScript et serveur Node : contrôles de syntaxe réussis.
- Navigation accueil → fiche produit → panier → récapitulatif.
- Sélection bleue, quantité deux : 59,80 €. Retour à un article : 29,90 €.
- Persistance du panier après navigation et rechargement.
- Panier multicolore : une variante bleue et une jaune, total 59,80 €.
- Suppression des articles et retour au panier vide.
- Menu mobile et ouverture d’une réponse de la FAQ.
- Écrans 390 × 844 et 1440 × 900 : aucun débordement horizontal observé.
- Photos affichées correctement après correction de leur hauteur mobile.
- Aucune erreur JavaScript détectée pendant le parcours testé.

## Limites connues avant lancement

- Aucun paiement réel, collecte d’adresse, traitement de commande ou connexion fournisseur.
- CGV, coordonnées professionnelles, politique de retour et données fiscales à compléter.
- Prix de départ proposé à valider avec les coûts de chaque variante.
- Visuels IA de mise en scène, non preuve de performance ou de conformité.
- Aperçu privé non indexé : aucune campagne PMax ou Meta lancée.
