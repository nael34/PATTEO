# Mise à jour de lancement

## Réalisé
- Huit photos générées avec imagegen à partir de dist/assets/gris.webp : cadrage et tapis conservés, seule la couleur change, aucun texte ni badge. Prompt : photographie e-commerce photoréaliste du tapis chenille existant, même forme, épaisseur, texture, perspective, éclairage doux et fond crème ; déclinaisons Silver Gray, Snow Blue, Bright Red, Brown, Camel, Champagne, Dark Gray, Glass Green.
- Fichiers WebP 1100 × 1100 dans dist/assets/variants/ (156–190 Ko chacun), planche de contrôle review-contact-sheet.jpg.
- Encadré OFFRE DE LANCEMENT avant la galerie, prix dynamique HTML, mention Prix de lancement. 39,90 € explicitement présenté comme futur prix après lancement selon réponse utilisateur.
- Huit couleurs à miniatures, calcul couleur/taille dans le panier et les événements Meta. XL gris/bleu 2490 centimes, six autres 2990 centimes côté serveur. Montants envoyés par le client ignorés.
- Catalogue et frais vérifiés via le MCP CJ officiel pour le produit `1603749659003072512`, destination France, ligne CJPacket Ordinary I (8–18 jours).
- Deux formats communs aux huit couleurs retenus : L 50 × 80 cm et XL 60 × 90 cm. Les autres tailles du fournisseur ne sont pas disponibles dans les huit couleurs ; 70 × 140 cm a été écarté car son coût livré monte à 47,38 $ sur six couleurs.
- Grille calculée selon le ratio validé : L à 20,90 € pour Gris classique/Snow Blue et 24,90 € pour les six autres ; XL à 24,90 € pour Gris classique/Snow Blue et 29,90 € pour les six autres.
- Les SKU et VID CJ des 16 variantes vendables sont centralisés côté serveur et transmis comme métadonnées produit Stripe.
- Changements récents dist/app.js de origin/main e204a66 conservés (consentement et Vercel Analytics), garde ajoutée pour le prérendu.
- Tests complémentaires de parité des 16 variantes fournisseur et panier multicouleurs ajoutés.

## Coûts fournisseur vérifiés
- L 50 × 80 cm : 10,62 $ livré pour Gris classique/Snow Blue ; 14,10 $ pour les six autres.
- XL 60 × 90 cm : 12,79 $ livré pour Gris classique/Snow Blue ; 17,18 $ pour Bright Red, Brown, Camel, Champagne et Grass Green. Le direct CJ renvoie 20,68 $ pour Dark Gray à cause d'un poids déclaré supérieur ; le prix XL demandé reste néanmoins exactement 29,90 €.
- Le rapport demandé sert de référence commerciale ; les prix sont arrondis au palier élégant en `,90 €` le plus proche.

## Contrôles restants avant publication
- Vérifier toutes les anciennes mentions de prix et métadonnées, les tailles et la migration des anciens paniers.
- Contrôle navigateur mobile (encart, prix, miniatures, panier) et desktop.
- Tester réellement un paiement Stripe en environnement test isolé sans changer de secrets ni basculer la production.
- Publier code et huit images sur GitHub en préservant les changements récents ; déployer sur Vercel puis vérifier la production.
- Aucun secret/API key modifié.

Le dépôt local diverge historiquement de main : HEAD d4b0bd8, distant e204a66 ; ne pas réinitialiser les changements utilisateur, les vidéos et les fichiers de maintenance. Les correctifs webhook/meta présents localement correspondent aux corrections déjà publiées, hors fins de ligne.
