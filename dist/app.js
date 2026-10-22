(() => {
  'use strict';
  const SHOP = {
    price: 29.90, checkoutEnabled: true,
    sizes: { xs: {label:'XS', dimensions:'30 × 50 cm', price:23.90}, s:{label:'S', dimensions:'40 × 60 cm', price:25.40}, m:{label:'M', dimensions:'45 × 70 cm', price:26.90}, l:{label:'L', dimensions:'50 × 80 cm', price:28.40}, xl:{label:'XL', dimensions:'60 × 90 cm', price:29.90} },
    colors: {
      gris: { label: 'Gris galet', hex: '#9a9b96', image: '/assets/gris.webp', texture:'/assets/texture-macro.jpg' },
      bleu: { label: 'Bleu balade', hex: '#7696ae', image: '/assets/bleu.webp', texture:'/assets/texture-bleu.png' },
      jaune: { label: 'Jaune soleil', hex: '#d9b650', image: '/assets/jaune.webp', texture:'/assets/texture-jaune.png' }
    }
  };
  const paths = {
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>', bag:'<path d="M6 7h12l2 14H4L6 7Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>', plus:'<path d="M5 12h14M12 5v14"/>', minus:'<path d="M5 12h14"/>',
    truck:'<path d="M3 5h11v12H3zM14 10h4l3 4v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    drop:'<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M8 15a4 4 0 0 0 4 4"/>',
    wash:'<rect x="3" y="2" width="18" height="20" rx="2"/><path d="M3 7h18M6 4.5h1M9 4.5h1"/><circle cx="12" cy="14" r="5"/><path d="M7 14c3-3 5 3 10 0"/>',
    home:'<path d="m3 10 9-7 9 7v11H3V10Z"/><path d="M9 21v-8h6v8"/>', check:'<path d="m5 12 4 4L19 6"/>',
    ruler:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 6v5M12 6v3M17 6v5"/>', menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    zoom:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6M10 7v6"/>',
    shield:'<path d="m12 2 8 3v6c0 6-8 11-8 11S4 17 4 11V5l8-3Z"/><path d="m8 11 3 3 5-6"/>',
    paw:'<ellipse cx="5" cy="8" rx="2" ry="3"/><ellipse cx="10" cy="4" rx="2" ry="3"/><ellipse cx="16" cy="5" rx="2" ry="3"/><ellipse cx="21" cy="10" rx="2" ry="3"/><path d="M5 18c0-4 5-8 8-8s8 5 8 8c0 5-5 3-8 2-3 1-8 3-8-2Z"/>'
  };
  const icon = n => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[n]}</svg>`;
  const euro = n => new Intl.NumberFormat('fr-FR', {style:'currency',currency:'EUR'}).format(n);
  const page = document.body.dataset.page || 'home';
  const params = new URLSearchParams(window.location.search);
  let color = Object.hasOwn(SHOP.colors,params.get('couleur')) ? params.get('couleur') : 'gris';
  let qty = 1, size = Object.hasOwn(SHOP.sizes,params.get('taille')) ? params.get('taille') : 'xl', cart = [];
  const cleanCart = d => Array.isArray(d) ? d.filter(i => i && Object.hasOwn(SHOP.colors,i.color) && Number.isInteger(i.qty) && i.qty > 0).map(i=>({color:i.color,size:Object.hasOwn(SHOP.sizes,i.size)?i.size:'xl',qty:Math.min(i.qty,10)})).reduce((out,v)=>{const old=out.find(x=>x.color===v.color&&x.size===v.size);if(old)old.qty=Math.min(10,old.qty+v.qty);else out.push(v);return out;},[]) : [];
  try {cart=cleanCart(JSON.parse(localStorage.getItem('patteo-cart-v1')||'[]'));} catch {}
  const count = () => cart.reduce((n,i)=>n+i.qty,0);
  const total = () => cart.reduce((n,i)=>n+i.qty*SHOP.sizes[i.size].price,0);
  const selectedPrice = () => SHOP.sizes[size].price;
  const selectedDimensions = () => SHOP.sizes[size].dimensions;
  const logo = '<img class="logo-image" src="/assets/logo.png" alt="Patteo" width="168" height="38">';
  const button = (text,href='/produit/') => `<a class="button button-dark" href="${href}">${text}${icon('arrow')}</a>`;
  const paymentBadges = () => `<div class="payment-reassurance" aria-label="Paiement sécurisé par Stripe"><p class="payment-heading">${icon('shield')}<span>Paiement sécurisé par Stripe</span></p><ul class="payment-badges" aria-label="PayPal, Apple Pay, Google Pay, Cartes Bancaires, Visa et Mastercard">${[['paypal','PayPal'],['apple_pay','Apple Pay'],['google_pay','Google Pay'],['cartes_bancaires','Cartes Bancaires'],['visa','Visa'],['master','Mastercard']].map(([id,name])=>`<li><img src="/assets/payments/${id}.svg" alt="${name}" width="48" height="30" loading="lazy"></li>`).join('')}</ul></div>`;
  const productGallery = () => `<div class="product-gallery"><div class="main-product-photo"><span class="product-tag">LE PETIT RITUEL DU RETOUR</span><button class="photo-zoom" data-zoom aria-label="Agrandir la photo du tapis"><img id="main-product-image" data-product-image src="${SHOP.colors[color].image}" alt="Tapis Patteo ${SHOP.colors[color].label}, aperçu produit — illustration IA" width="1100" height="1100" fetchpriority="high"><span>${icon('zoom')}</span></button></div><div class="gallery-thumbs" aria-label="Photos du produit"><button data-gallery="product" class="active" aria-label="Voir le tapis ${SHOP.colors[color].label}" aria-pressed="true"><img data-product-image src="${SHOP.colors[color].image}" alt="" width="100" height="100"></button><button data-gallery="texture" aria-label="Voir le gros plan chenille ${SHOP.colors[color].label}" aria-pressed="false"><img src="${SHOP.colors[color].texture}" alt="" width="100" height="100"></button><button data-gallery="lifestyle" aria-label="Voir le tapis dans une entrée" aria-pressed="false"><img src="/assets/hero.webp" alt="" width="100" height="100"></button><p>La douceur,<br>de plus près.</p></div><p class="image-disclaimer">Visuels de mise en scène créés avec l’IA à partir des références du produit.</p></div>`;
  const textureSection = () => `<section class="texture-section container" id="texture"><figure class="texture-photo"><img src="/assets/texture-macro.jpg" alt="Gros plan des fines fibres et des mèches chenille du tapis gris Patteo — illustration IA" width="1536" height="1024" loading="lazy"><figcaption>LA CHENILLE, VUE DE PRÈS</figcaption></figure><div class="texture-copy"><span class="eyebrow">LE DÉTAIL QUI CHANGE LE RETOUR</span><h2>Tout est dans<br><em>la texture.</em></h2><p>Des petites mèches de chenille, des fibres tout en douceur. Une texture moelleuse qui accueille les pattes et aide à retenir l’humidité au contact.</p><div class="texture-details"><span>${icon('zoom')} Fines fibres textiles</span><span>${icon('paw')} Chenille douce au toucher</span><span>${icon('wash')} Entretien en machine selon l’étiquette</span></div><p class="texture-caption">Gros plan illustratif créé avec l’IA, en coloris gris.</p></div></section>`;
  const swatches = () => `<div class="swatches" role="group" aria-label="Choisir la couleur">${Object.entries(SHOP.colors).map(([id,c])=>`<button class="swatch ${color===id?'selected':''}" style="--swatch:${c.hex}" data-color="${id}" aria-label="${c.label}" aria-pressed="${color===id}" title="${c.label}"><span></span>${icon('check')}</button>`).join('')}</div>`;
  const header = () => `<div class="announcement"><span>${icon('truck')} Livraison comprise en France métropolitaine</span><span class="announcement-right">Des pattes heureuses. Une maison accueillante.</span></div><header class="header"><div class="nav-wrap"><a class="brand" href="/" aria-label="Patteo — Accueil">${logo}</a><nav class="desktop-nav" aria-label="Navigation principale"><a href="/produit/" ${page==='product'?'aria-current="page"':''}>Le tapis</a><a href="/#notre-idee">L’esprit Patteo</a><a href="/aide/">Vos questions</a></nav><div class="nav-actions"><a class="nav-shop" href="/produit/">Trouver ma couleur ${icon('arrow')}</a><button class="cart-toggle icon-button" data-open-cart aria-label="Ouvrir le panier, ${count()} article(s)">${icon('bag')}<span class="cart-count">${count()}</span></button><button class="menu-toggle icon-button" data-menu aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="mobile-nav">${icon('menu')}</button></div></div><nav class="mobile-nav" id="mobile-nav" hidden aria-label="Navigation mobile"><a href="/produit/">Le tapis</a><a href="/#notre-idee">L’esprit Patteo</a><a href="/aide/">Vos questions</a><a href="/livraison/">Livraison & entretien</a></nav></header>`;
  const footer = () => `<footer class="footer"><div class="footer-top container"><div class="footer-brand"><a href="/" aria-label="Patteo — Accueil">${logo}</a><p>Pour les balades qui font du bien.<br>Et les retours à la maison aussi.</p></div><div><h3>La collection</h3>${Object.entries(SHOP.colors).map(([id,c])=>`<a href="/produit/?couleur=${id}">${c.label}</a>`).join('')}</div><div><h3>On vous accompagne</h3><a href="/aide/">Questions fréquentes</a><a href="/livraison/">Livraison & entretien</a><button class="text-button" data-legal="returns">Retours</button></div><div class="footer-note">${icon('paw')}<p>Leur petit coin.<br>Votre grand bonheur.</p></div></div><div class="footer-bottom container"><span>© ${new Date().getFullYear()} Patteo</span><div><button class="text-button" data-legal="legal">Mentions légales</button><button class="text-button" data-legal="privacy">Confidentialité</button><button class="text-button" data-legal="terms">Conditions de vente</button></div><span class="preview-tag">Commande PATTEO · paiement sécurisé</span></div></footer>`;
  const questions = [
    ['Comment utiliser le tapis au retour de balade ?','Placez-le à l’intérieur, devant la porte, sur un sol propre et sec. Invitez votre chien à y faire une petite pause : la chenille aide à retenir l’humidité et les saletés au contact des pattes. Si elles sont très boueuses, essuyez-les aussi avec une serviette.'],
    ['Quelles tailles sont disponibles ?','Cinq formats sont proposés : XS (30 × 50 cm), S (40 × 60 cm), M (45 × 70 cm), L (50 × 80 cm) et XL (60 × 90 cm). Le prix varie selon le format choisi. Mesurez votre entrée et le passage sous la porte avant de choisir.'],
    ['Peut-il passer en machine ?','Le fournisseur indique que le tapis est lavable en machine. Suivez les consignes figurant sur l’étiquette reçue et laissez-le sécher complètement avant de le remettre au sol. La température et les conditions de séchage doivent être vérifiées sur cette étiquette.'],
    ['Quels sont les délais de livraison ?','La livraison est comprise en France métropolitaine. La préparation prend 1 à 3 jours, puis l’acheminement prend 8 à 18 jours après expédition depuis la Chine.'],
    ['Les couleurs changent-elles le prix ?','Non, les coloris gris, bleu et jaune ont le même prix pour une taille donnée. Le tarif dépend uniquement du format choisi, de 23,90 € en XS à 29,90 € en XL, livraison comprise. Les visuels ont été créés avec l’IA ; la teinte perçue peut varier selon l’écran.']
  ];
  const faq = (limit=6) => `<div class="faq-list">${questions.slice(0,limit).map(([q,a])=>`<details><summary>${q}<span>${icon('plus')}</span></summary><div class="faq-answer"><p>${a}</p></div></details>`).join('')}</div>`;
  const strip = () => `<div class="trust-strip">${[['drop','Chenille absorbante'],['wash','Lavable en machine'],['ruler','5 formats disponibles'],['truck','Livraison comprise']].map(([i,t])=>`<div>${icon(i)}<span>${t}</span></div>`).join('')}</div>`;
  const photoWall = () => {
    const moments = [
      {src:'/assets/patteo-gris-detail.jpg',alt:'Gros plan du tapis chenille gris',caption:'La chenille grise, vue de près.'},
      {src:'/assets/patteo-gris-entree.jpg',alt:'Tapis chenille gris installé dans une pièce de vie',caption:'Une place dans la maison.'},
      {src:'/assets/patteo-jaune.jpg',alt:'Tapis chenille jaune posé au sol',caption:'La touche jaune soleil.'},
      {src:'/assets/patteo-chien.jpg',alt:'Chien installé sur un tapis chenille gris',caption:'Un coin tranquille après la balade.'},
      {src:'/assets/patteo-gris-porte.jpg',alt:'Tapis chenille gris placé devant une porte',caption:'Juste devant la porte.'},
      {src:'/assets/patteo-colis.jpg',alt:'Tapis chenille gris dans son emballage',caption:'Le tapis, à la réception.'}
    ];
    const columns = [moments.slice(0,2),moments.slice(2,4),moments.slice(4,6)];
    const cards = items => [...items,...items].map((item,index)=>`<button class="photo-review-card" type="button" data-wall-photo="${item.src}" data-wall-alt="${item.alt}" data-wall-caption="${item.caption}" aria-label="Agrandir la photo : ${item.caption}"><img src="${item.src}" alt="${item.alt}" ${index>0?'loading="lazy"':''}><span>${item.caption}</span></button>`).join('');
    return `<section class="photo-review-section" id="avis" aria-labelledby="photo-review-title"><div class="container"><div class="photo-review-heading"><span class="eyebrow">PATTEO</span><h2 id="photo-review-title">Photos du tapis</h2><p>Découvrez les détails et les coloris.</p></div><div class="photo-review-wall" aria-label="Galerie de photos du tapis PATTEO">${columns.map((items,index)=>`<div class="photo-review-column ${index===1?'photo-review-column-slower':''} ${index===2?'photo-review-column-last':''}"><div class="photo-review-track">${cards(items)}</div></div>`).join('')}</div><form class="review-submit" id="review-submit"><h3>Vous avez reçu votre tapis ?</h3><p>Partagez votre avis, avec une photo si vous le souhaitez. Rien ne sera publié sans vérification.</p><label>Votre prénom<input name="name" type="text" maxlength="50" autocomplete="given-name" required></label><label>Votre avis <span>(facultatif)</span><textarea name="review" rows="3" maxlength="1200" placeholder="Votre expérience en quelques mots…"></textarea></label><label class="review-photo-label">Une photo <span>(facultatif · JPG, PNG ou WebP, 5 Mo max.)</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp"></label><label class="review-consent"><input name="consent" type="checkbox" required><span>J’autorise PATTEO à examiner ma contribution et, si elle est retenue, à publier mon prénom, mon avis et ma photo. Je peux demander son retrait à commandes@montpellier-ia.dev.</span></label><div class="review-honey" aria-hidden="true"><label>Ne pas remplir<input name="website" tabindex="-1" autocomplete="off"></label></div><button class="button button-dark" type="submit">Envoyer pour vérification ${icon('arrow')}</button><p class="review-submit-status" role="status" aria-live="polite"></p></form></div></section>`;
  };
  const picker = (compact=false) => `<div class="picker"><div class="color-label">Couleur <strong data-color-label>${SHOP.colors[color].label}</strong></div>${swatches()}<div class="size-choice">${icon('ruler')}<label for="size-select">Format</label><select id="size-select" data-size>${Object.entries(SHOP.sizes).map(([id,s])=>`<option value="${id}" ${size===id?'selected':''}>${s.label} · ${s.dimensions} · ${euro(s.price)}</option>`).join('')}</select></div>${compact?'':`<div class="purchase-row"><div class="quantity" aria-label="Quantité"><button data-qty="-1" aria-label="Réduire la quantité">${icon('minus')}</button><output id="quantity-value" aria-live="polite">${qty}</output><button data-qty="1" aria-label="Augmenter la quantité">${icon('plus')}</button></div><button class="button button-dark add-button" data-add>Ajouter au panier ${icon('arrow')}</button></div><p class="purchase-note">${icon('truck')} Livraison comprise · aucun supplément à l’étape suivante</p>${paymentBadges()}`}</div>`;
  const home = () => `<section class="hero container"><div class="hero-copy"><span class="eyebrow">${icon('paw')} LE BON RÉFLEXE APRÈS LA BALADE</span><h1>Les balades dehors.<br>Le bonheur <em>dedans.</em></h1><p>Des pattes mouillées, des moments heureux.<br>Un tapis tout doux pour garder les traces<br class="desktop-only"> de balade à l’entrée.</p>${button('Découvrir le tapis')}<div class="hero-meta"><span>${euro(SHOP.price)}</span><i></i><span>Livraison comprise</span></div></div><div class="hero-visual"><img src="/assets/hero.webp" width="1536" height="1024" fetchpriority="high" alt="Un golden retriever sur un tapis gris dans une entrée lumineuse — mise en scène IA"><div class="hero-sticker">${icon('paw')}<span>Bienvenue<br>les pattes.</span></div><div class="image-caption"><span class="small-dot"></span>Leur nouvelle pause préférée.</div></div></section><section class="container" aria-label="Les essentiels">${strip()}</section>
  <section class="intro-section container" id="notre-idee"><div class="section-heading"><span class="eyebrow">LA VIE AVEC EUX, TOUT SIMPLEMENT</span><h2>Oui aux grandes balades.<br><em>Un peu moins aux petites traces.</em></h2><p>On aime leurs aventures. On aime aussi rentrer chez soi.<br>Patteo fait le lien, tout doucement.</p></div><div class="benefit-grid">${[['drop','blue','L’humidité reste à l’entrée.','La texture chenille aide à retenir l’eau et les saletés au contact des pattes.'],['paw','yellow','Une pause tout en douceur.','Une surface moelleuse pour prendre le temps de rentrer. Quatre pattes bienvenues.'],['wash','green','Et on recommence demain.','Un tapis lavable en machine, à entretenir selon les indications de son étiquette.']].map(([i,c,h,p],n)=>`<article><div class="benefit-symbol ${c}">${icon(i)}</div><span class="step-number">0${n+1}</span><h3>${h}</h3><p>${p}</p></article>`).join('')}</div></section>
  <section class="collection-section" id="collection"><div class="container collection-grid"><div class="collection-image"><span class="image-label">LE TAPIS PATTEO</span><img data-product-image src="${SHOP.colors[color].image}" width="1100" height="1100" loading="lazy" alt="Tapis Patteo ${SHOP.colors[color].label}, illustration IA"><div class="color-dots"><span></span><span></span><span></span></div></div><div class="collection-copy"><span class="eyebrow">UNE PLACE POUR LEURS PATTES</span><h2>Petit tapis.<br><em>Grand allié.</em></h2><p>Le compagnon des jours de pluie, des retours du parc et des « encore cinq minutes dehors ».</p><div class="price-line"><strong>${euro(SHOP.price)}</strong><span>Livraison comprise</span></div>${picker(true)}<a class="button button-dark" data-product-link href="/produit/?couleur=${color}">Choisir mon tapis ${icon('arrow')}</a><p class="subtle-note">Trois couleurs. Le même petit bonheur.</p></div></div></section>
  <section class="ritual-section container"><div class="ritual-copy"><span class="eyebrow">LE RITUEL DU RETOUR</span><h2>Un petit arrêt.<br><em>Et la vie reprend.</em></h2><ol class="ritual-steps">${[['On le pose.','À l’intérieur, devant la porte, sur un sol propre et sec.'],['On fait une pause.','Quelques instants sur la chenille. Une caresse, tant qu’à faire.'],['On profite.','Moins de traces à suivre. Plus de moments à partager.']].map(([h,p],i)=>`<li><span>${i+1}</span><div><h3>${h}</h3><p>${p}</p></div></li>`).join('')}</ol><a class="inline-link" href="/produit/">Faire une place à Patteo ${icon('arrow')}</a></div><div class="ritual-photo"><img src="/assets/hero.webp" alt="Un retour de balade au calme — mise en scène IA" width="1536" height="1024" loading="lazy"><div class="photo-note">Le bonheur,<br><em>c’est de rentrer ensemble.</em></div></div></section>
  <section class="faq-section container"><div class="faq-intro"><span class="eyebrow">ON VOUS RÉPOND</span><h2>Avant de lui<br><em>faire une place.</em></h2><p>Les petites questions qui comptent.</p><a class="inline-link" href="/aide/">Toutes vos questions ${icon('arrow')}</a></div>${faq(4)}</section><section class="closing-banner"><div class="container"><span class="closing-paw">${icon('paw')}</span><div><span class="eyebrow">LA PROCHAINE BALADE N’ATTEND QUE VOUS</span><h2>Pour des retours <em>tout doux.</em></h2></div>${button('Je choisis ma couleur')}</div></section>`;
  const product = () => `<div class="container breadcrumb"><a href="/">Accueil</a><span>/</span><span>Le tapis Patteo</span></div><section class="product-layout container">${productGallery()}<div class="product-info"><span class="eyebrow">POUR LES PATTES. ET POUR LA MAISON.</span><h1>Le tapis <em>Patteo.</em></h1><p class="product-subtitle">Le bon réflexe après la balade.</p><p class="product-description">Un tapis chenille tout doux qui aide à retenir l’humidité et les saletés des pattes. Pour garder les bons souvenirs de la promenade, un peu moins ses traces.</p><div class="price-line"><strong>${euro(SHOP.price)}</strong><span>Livraison comprise</span></div><ul class="product-benefits"><li>${icon('check')}Texture chenille absorbante</li><li>${icon('check')}Base antidérapante sur sol propre et sec</li><li>${icon('check')}Lavable en machine selon l’étiquette</li></ul>${picker()}<div class="shipping-card">${icon('truck')}<div><strong>Livraison comprise.</strong><p>Préparation : 1 à 3 jours.<br>Acheminement : 8 à 18 jours après expédition.</p><a href="/livraison/">Voir les informations de livraison</a></div></div><div class="product-accordions"><details><summary>Dimensions & contenu ${icon('plus')}</summary><p>Un tapis rectangulaire de 60 × 90 cm. Couleur sélectionnée : <span data-color-label>${SHOP.colors[color].label}</span>. Le colis contient un tapis, sans autre accessoire. Mesurez l’espace disponible et le passage sous votre porte.</p></details><details><summary>Utilisation & entretien ${icon('plus')}</summary><p>Installez le tapis à l’intérieur, sur un sol propre et sec. Suivez les consignes de lavage de l’étiquette et laissez sécher complètement avant réutilisation. Si les pattes sont très sales, un essuyage complémentaire reste nécessaire.</p></details></div><a class="review-jump" href="#avis">Voir les avis et photos <span aria-hidden="true">↓</span></a></div></section>
  <section class="container product-trust">${strip()}</section>${textureSection()}${photoWall()}<section class="product-story container"><div class="story-heading"><span class="eyebrow">BIEN PENSÉ POUR LE QUOTIDIEN</span><h2>Ils rapportent de la joie.<br><em>Parfois un peu de pluie aussi.</em></h2></div><div class="story-grid"><div class="story-image"><img src="/assets/hero.webp" alt="Un chien profite de son tapis à l’entrée — mise en scène IA" width="1536" height="1024" loading="lazy"></div><div class="story-details">${[['drop','Une texture qui fait sa part.','Les fibres chenille retiennent une partie de l’humidité et des saletés au contact des pattes.'],['home','Une vraie place dans votre entrée.','Trois coloris pour s’intégrer à votre intérieur, sans transformer la maison en vestiaire.'],['wash','Prêt pour les prochains retours.','Un entretien en machine selon l’étiquette, puis un séchage complet. Et le rituel reprend.']].map(([i,h,p])=>`<article>${icon(i)}<div><h3>${h}</h3><p>${p}</p></div></article>`).join('')}</div></div></section><section class="faq-section container"><div class="faq-intro"><span class="eyebrow">LES RÉPONSES, SANS DÉTOUR</span><h2>Tout simplement<br><em>Patteo.</em></h2></div>${faq()}</section><div class="mobile-buybar"><div><strong>Le tapis Patteo</strong><span>${euro(SHOP.price)} · <span data-color-label>${SHOP.colors[color].label}</span></span></div><button class="button button-dark" data-add>Ajouter ${icon('bag')}</button></div>`;
  const delivery = () => `<section class="info-hero container"><span class="eyebrow">LES INFORMATIONS UTILES</span><h1>De chez nous<br><em>à votre entrée.</em></h1><p>Les délais de livraison, le contenu du colis et les gestes d’entretien, au même endroit.</p></section><section class="information-grid container"><article class="info-card">${icon('truck')}<h2>La livraison</h2><dl>${[['Destination','France métropolitaine'],['Frais de livraison','Compris dans le prix affiché'],['Préparation avant expédition','1 à 3 jours'],['Acheminement après expédition','8 à 18 jours'],['Origine d’expédition','Chine']].map(([t,d])=>`<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl></article><article class="info-card">${icon('wash')}<h2>Les petits soins</h2><ol><li>Retirez régulièrement les saletés accumulées.</li><li>Lavez en suivant les indications de l’étiquette.</li><li>Laissez le tapis sécher complètement.</li><li>Replacez-le sur un sol propre et sec.</li></ol><p class="small-print">Ne présumez pas d’une température de lavage ou d’une compatibilité avec le sèche-linge : consultez l’étiquette reçue.</p></article></section><section class="soft-callout container"><h2>Un doute sur le format ?</h2><p>Le tapis mesure 60 × 90 cm. Pensez à mesurer votre entrée et le passage sous la porte.</p>${button('Voir le tapis')}</section>`;
  const help = () => `<section class="info-hero container"><span class="eyebrow">CHAQUE DÉTAIL COMPTE</span><h1>Une question ?<br><em>On vous guide.</em></h1><p>Tout ce qu’il faut savoir pour faire une place à Patteo.</p></section><section class="help-faq container">${faq()}</section><section class="soft-callout container"><h2>Besoin des informations de livraison ?</h2><p>Origine, délais et entretien : tout est expliqué.</p>${button('Livraison & entretien','/livraison/')}</section>`;
  const cartLines = () => cart.map(i=>`<article class="cart-item"><a href="/produit/?couleur=${i.color}&taille=${i.size}"><img src="${SHOP.colors[i.color].image}" alt="Tapis ${SHOP.colors[i.color].label}" width="96" height="96"></a><div class="cart-item-info"><a href="/produit/?couleur=${i.color}&taille=${i.size}"><h3>Le tapis Patteo</h3></a><p>${SHOP.colors[i.color].label} · ${SHOP.sizes[i.size].label}, ${SHOP.sizes[i.size].dimensions}</p><div class="cart-item-bottom"><div class="quantity small"><button data-cart-qty="${i.color}:${i.size}" data-delta="-1" aria-label="Retirer un tapis ${SHOP.colors[i.color]} ${SHOP.sizes[i.size].label}">${icon('minus')}</button><span>${i.qty}</span><button data-cart-qty="${i.color}:${i.size}" data-delta="1" aria-label="Ajouter un tapis ${SHOP.colors[i.color]} ${SHOP.sizes[i.size].label}" ${i.qty>=10?'disabled':''}>${icon('plus')}</button></div><strong>${euro(i.qty*SHOP.sizes[i.size].price)}</strong></div><button class="remove-item" data-remove="${i.color}:${i.size}">Retirer</button></div></article>`).join('');
  const emptyCart = () => `<div class="empty-cart">${icon('bag')}<h3>Une place à prendre.</h3><p>Votre panier attend son premier tapis.</p>${button('Découvrir Patteo')}</div>`;
  const checkout = () => `<section class="checkout container"><a class="inline-link" href="/produit/">← Continuer la découverte</a><div class="checkout-heading"><span class="eyebrow">VOTRE PETIT COIN DE DOUCEUR</span><h1>Finaliser <em>votre commande.</em></h1></div><div class="checkout-grid patteo-checkout-layout"><div class="patteo-checkout-main"><section class="patteo-order-items"><h2>Votre panier</h2><div id="checkout-items">${cart.length?cartLines():emptyCart()}</div></section><section id="patteo-payment" class="patteo-payment-card"><h2>Livraison et paiement</h2><p class="small-print">Paiement sécurisé par carte bancaire et autres moyens proposés par Stripe.</p><div id="patteo-payment-status" role="status"></div><form id="patteo-payment-form" hidden><h3>1. Vos coordonnées</h3><div id="patteo-contact"></div><h3>2. Adresse de livraison</h3><div id="patteo-shipping"></div><h3>3. Moyen de paiement</h3><div id="patteo-currency-selector"></div><div id="patteo-payment-element"></div><button class="button button-dark" id="patteo-pay-button" type="submit">Payer ${euro(total())} </button><p id="patteo-payment-error" role="alert"></p></form></section></div><aside class="checkout-summary"><h2>Récapitulatif</h2><div><span>Articles</span><strong data-checkout-subtotal>${euro(total())}</strong></div><div><span>Livraison</span><span>Comprise</span></div><div class="checkout-total"><span>Total</span><strong data-checkout-total>${euro(total())}</strong></div><div class="launch-notice">${icon('shield')}<h3>Paiement sécurisé</h3><p>Le paiement est traité de façon sécurisée par Stripe. Le montant final est affiché avant validation.</p></div>${paymentBadges()}</aside></div></section>`;
  const overlays = () => `<dialog class="cart-dialog" id="cart-dialog" aria-labelledby="cart-title"><div class="cart-dialog-header"><h2 id="cart-title">Votre panier <span class="cart-count">${count()}</span></h2><button class="icon-button" data-close="cart-dialog" aria-label="Fermer le panier">${icon('close')}</button></div><div class="cart-top-note">${icon('truck')} La livraison est comprise. Tout simplement.</div><div id="cart-items" class="cart-items">${cart.length?cartLines():emptyCart()}</div><div class="cart-dialog-bottom" ${cart.length?'':'hidden'}><div class="cart-subtotal"><span>Sous-total</span><strong data-cart-total>${euro(total())}</strong></div><p>Livraison comprise en France métropolitaine.</p>${button('Voir ma sélection','/commande/')}${paymentBadges()}<button class="text-button continue-shopping" data-close="cart-dialog">Continuer ma visite</button><span class="cart-preview-note">Votre panier est prêt pour le paiement sécurisé.</span></div></dialog><dialog class="image-dialog" id="image-dialog" aria-label="Photo agrandie du tapis"><button class="icon-button dialog-close" data-close="image-dialog" aria-label="Fermer la photo">${icon('close')}</button><img id="zoom-image" src="${SHOP.colors[color].image}" alt="Photo du tapis agrandie"><p id="zoom-caption" class="image-dialog-caption" hidden></p></dialog><dialog class="legal-dialog" id="legal-dialog" aria-labelledby="legal-title"><button class="icon-button dialog-close" data-close="legal-dialog" aria-label="Fermer les informations">${icon('close')}</button><div id="legal-content"></div></dialog><div class="toast" id="toast" role="status" aria-live="polite"></div>`;
  const renders={home,product,delivery,help,checkout};
  document.getElementById('site-header').innerHTML=header();
  const main=document.getElementById('main');
  if(window.__PATTEO_BUILD || !main.children.length || page==='checkout' || params.has('couleur')) main.innerHTML=(renders[page]||home)();
  if(!window.__PATTEO_BUILD && page==='home' && !main.querySelector('.photo-review-section')) main.querySelector('#notre-idee')?.insertAdjacentHTML('beforebegin',photoWall());
  if(!window.__PATTEO_BUILD && page==='product'){
    main.querySelector('.product-subtitle')?.remove();
    main.querySelector('.purchase-note')?.remove();
  }
  if(!window.__PATTEO_BUILD && window.location.hash==='#avis') requestAnimationFrame(()=>document.getElementById('avis')?.scrollIntoView({behavior:'smooth',block:'start'}));
  document.getElementById('site-footer').innerHTML=footer();
  document.getElementById('overlays').innerHTML=overlays();
  if(window.__PATTEO_BUILD){window.__PATTEO_CONFIG=SHOP;return;}
  function announce(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('visible');clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>el.classList.remove('visible'),3000);}
  function saveCart(){try{localStorage.setItem('patteo-cart-v1',JSON.stringify(cart));}catch{}renderCart();}
  function renderCart(){
    document.querySelectorAll('.cart-count').forEach(el=>el.textContent=count());
    document.querySelectorAll('[data-open-cart]').forEach(el=>el.setAttribute('aria-label',`Ouvrir le panier, ${count()} article(s)`));
    document.getElementById('cart-items').innerHTML=cart.length?cartLines():emptyCart();
    document.querySelector('.cart-dialog-bottom').hidden=!cart.length;
    document.querySelector('[data-cart-total]').textContent=euro(total());
    if(page==='checkout'){document.getElementById('checkout-items').innerHTML=cart.length?cartLines():emptyCart();document.querySelector('[data-checkout-subtotal]').textContent=euro(total());document.querySelector('[data-checkout-total]').textContent=euro(total());const payButton=document.querySelector('[data-stripe-checkout]');if(payButton)payButton.disabled=!cart.length;}
  }
  function setGallery(view){
    document.querySelectorAll('[data-gallery]').forEach(el=>{el.classList.toggle('active',el.dataset.gallery===view);el.setAttribute('aria-pressed',el.dataset.gallery===view);});
    const img=document.getElementById('main-product-image');if(!img)return;
    img.src=view==='texture'?SHOP.colors[color].texture:view==='lifestyle'?'/assets/hero.webp':SHOP.colors[color].image;
    img.alt=view==='texture'?'Gros plan de la texture chenille grise du tapis Patteo — illustration IA':view==='lifestyle'?'Tapis dans une entrée avec un chien, mise en scène IA':`Tapis Patteo ${SHOP.colors[color].label}, 60 × 90 cm, illustration IA`;
    document.querySelector('.main-product-photo').classList.toggle('show-texture',view==='texture');
    document.querySelector('.product-tag').textContent=view==='texture'?`LA TEXTURE DE PRÈS · ${SHOP.colors[color].label.toUpperCase()}`:'LE PETIT RITUEL DU RETOUR';
  }
  function setColor(id){
    if(!Object.hasOwn(SHOP.colors,id))return;color=id;
    document.querySelectorAll('[data-color]').forEach(el=>{el.classList.toggle('selected',el.dataset.color===color);el.setAttribute('aria-pressed',el.dataset.color===color);});
    document.querySelectorAll('[data-color-label]').forEach(el=>el.textContent=SHOP.colors[color].label);
    document.querySelectorAll('[data-product-image]').forEach(el=>{el.src=SHOP.colors[color].image;el.alt=`Tapis Patteo ${SHOP.colors[color].label}, mise en scène IA`;});
    const textureThumb=document.querySelector('[data-gallery="texture"] img');if(textureThumb)textureThumb.src=SHOP.colors[color].texture;
    document.querySelectorAll('[data-product-link]').forEach(el=>el.href=`/produit/?couleur=${color}&taille=${size}`);
    if(page==='product'){const url=new URL(location.href);url.searchParams.set('couleur',color);history.replaceState(null,'',url);setGallery('product');}
  }
  function addToCart(){const i=cart.find(i=>i.color===color&&i.size===size);if((i?.qty||0)+qty>10){announce('Maximum 10 tapis par taille et coloris.');return;}if(i)i.qty+=qty;else cart.push({color,size,qty});saveCart();document.getElementById('cart-dialog').showModal();}
  const legal={
    legal:['Mentions légales','Les informations légales de PATTEO sont à compléter avant toute campagne ou commande.','L’identité juridique du vendeur, ses coordonnées, ses références d’immatriculation et les informations d’hébergement doivent être renseignées. Ces éléments restent à valider avec le vendeur.'],
    privacy:['Confidentialité','Les informations complètes sur les données personnelles et leur traitement doivent être finalisées.','Le panier est conservé localement. Lors du paiement, les coordonnées et l’adresse de livraison sont transmises à Stripe pour traiter la commande ; un e-mail de confirmation est envoyé via Resend après paiement réussi. Si vous envoyez un avis ou une photo, votre prénom, votre texte et l’image (réduite et débarrassée de ses métadonnées par le navigateur) sont transmis à Resend et à notre boîte de réception pour examen ; rien n’est publié automatiquement. Pour demander le retrait d’une contribution, écrivez à commandes@montpellier-ia.dev. Aucun traceur publicitaire n’est activé pour le moment. La politique de confidentialité doit être validée avant les campagnes.'],
    returns:['Retours','Les modalités de retour doivent être définies et publiées avant la vente.','L’adresse de retour, les modalités, les frais éventuels, les délais et le médiateur de la consommation restent à préciser avec le vendeur. Les conditions du fournisseur ne constituent pas automatiquement celles de la boutique.'],
    terms:['Conditions de vente','Le paiement en ligne est activé ; les conditions contractuelles de vente restent à finaliser.','Les conditions de vente, les informations fiscales, les délais de livraison, les garanties et les retours doivent être validés et publiés avant toute campagne commerciale.']
  };
  document.addEventListener('click',event=>{
    const el=event.target.closest('button,a');if(!el)return;

    if(el.hasAttribute('data-open-cart'))document.getElementById('cart-dialog').showModal();
    if(el.dataset.close)document.getElementById(el.dataset.close).close();
    if(el.dataset.color)setColor(el.dataset.color);
    if(el.hasAttribute('data-add'))addToCart();
    if(el.dataset.qty){qty=Math.min(10,Math.max(1,qty+Number(el.dataset.qty)));document.getElementById('quantity-value').value=qty;}
    if(el.dataset.cartQty){const [itemColor,itemSize]=el.dataset.cartQty.split(':');const i=cart.find(i=>i.color===itemColor&&i.size===itemSize);if(!i)return;i.qty=Math.min(10,Math.max(0,i.qty+Number(el.dataset.delta)));cart=cart.filter(i=>i.qty>0);saveCart();}
    if(el.dataset.remove){const [itemColor,itemSize]=el.dataset.remove.split(':');cart=cart.filter(i=>i.color!==itemColor||i.size!==itemSize);saveCart();announce('Article retiré du panier.');}
    if(el.dataset.gallery)setGallery(el.dataset.gallery);
    if(el.hasAttribute('data-zoom')){const img=document.getElementById('main-product-image'),z=document.getElementById('zoom-image'),caption=document.getElementById('zoom-caption');z.src=img.src;z.alt=img.alt;caption.hidden=true;document.getElementById('image-dialog').showModal();}
    if(el.hasAttribute('data-wall-photo')){const z=document.getElementById('zoom-image'),caption=document.getElementById('zoom-caption');z.src=el.dataset.wallPhoto;z.alt=el.dataset.wallAlt;caption.textContent=el.dataset.wallCaption;caption.hidden=false;document.getElementById('image-dialog').showModal();}
    if(el.hasAttribute('data-menu')){const nav=document.getElementById('mobile-nav');nav.hidden=!nav.hidden;el.setAttribute('aria-expanded',!nav.hidden);el.setAttribute('aria-label',nav.hidden?'Ouvrir le menu':'Fermer le menu');}
    if(el.dataset.legal){const [h,p,b]=legal[el.dataset.legal];document.getElementById('legal-content').innerHTML=`<span class="eyebrow">INFORMATIONS PATTEO</span><h2 id="legal-title">${h}</h2><p><strong>${p}</strong></p><p>${b}</p>`;document.getElementById('legal-dialog').showModal();}
    if(el.closest('#mobile-nav')){document.getElementById('mobile-nav').hidden=true;document.querySelector('[data-menu]').setAttribute('aria-expanded','false');}
  });
  function updateVariant(){document.querySelectorAll('.price-line strong, [data-current-price]').forEach(el=>el.textContent=euro(selectedPrice()));const heroPrice=document.querySelector('.hero-meta span');if(heroPrice)heroPrice.textContent=`À partir de ${euro(SHOP.sizes.xs.price)}`;document.querySelectorAll('.mobile-buybar span').forEach(el=>{if(el.querySelector('[data-color-label]'))el.firstChild.textContent=`${euro(selectedPrice())} · `;});document.querySelectorAll('[data-current-size]').forEach(el=>el.textContent=selectedDimensions());document.querySelectorAll('[data-size-label]').forEach(el=>el.textContent=`${SHOP.sizes[size].label} · ${selectedDimensions()}`);const detail=document.querySelector('.product-accordions details p');if(detail)detail.innerHTML=`Un tapis rectangulaire de ${selectedDimensions()}. Couleur sélectionnée : <span data-color-label>${SHOP.colors[color].label}</span>. Le colis contient un tapis, sans autre accessoire. Mesurez l’espace disponible et le passage sous votre porte.`;document.querySelectorAll('[data-product-link]').forEach(el=>el.href=`/produit/?couleur=${color}&taille=${size}`);}
  document.addEventListener('change',event=>{if(event.target.matches('[data-size]')){size=event.target.value;updateVariant();const url=new URL(location.href);url.searchParams.set('taille',size);history.replaceState(null,'',url);}});
  const reviewForm=document.getElementById('review-submit');
  if(reviewForm){
    const fileInput=reviewForm.elements.photo,status=reviewForm.querySelector('.review-submit-status');
    fileInput.addEventListener('change',()=>{const file=fileInput.files[0];if(file&&file.size>5*1024*1024){fileInput.value='';status.textContent='Cette photo dépasse 5 Mo. Choisissez une image plus légère.';}});
    reviewForm.addEventListener('submit',async event=>{
      event.preventDefault();if(!reviewForm.reportValidity())return;
      const button=reviewForm.querySelector('button[type="submit"]');button.disabled=true;status.textContent='Préparation de votre contribution…';
      try{
        let photo=null;const file=fileInput.files[0];
        if(file){
          if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Format refusé. Choisissez une photo JPG, PNG ou WebP.');
          const image=await createImageBitmap(file);const scale=Math.min(1,1600/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.close();
          const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.82));if(!blob||blob.size>2.5*1024*1024)throw Error('Cette photo est trop lourde. Essayez une image plus petite.');
          photo={name:'photo.jpg',type:'image/jpeg',data:await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Lecture de la photo impossible.'));reader.readAsDataURL(blob);})};
        }
        const response=await fetch('/api/photo-submission',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:reviewForm.elements.name.value,review:reviewForm.elements.review.value,consent:reviewForm.elements.consent.checked,website:reviewForm.elements.website.value,photo})});
        const result=await response.json();if(!response.ok)throw Error(result.error||'Envoi impossible. Réessayez plus tard.');
        reviewForm.reset();status.textContent='Merci ! Votre contribution a été envoyée à PATTEO et sera examinée avant toute publication.';
      }catch(error){status.textContent=error.message||'Envoi impossible. Réessayez plus tard.';}
      finally{button.disabled=false;}
    });
  }
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
  window.addEventListener('storage',e=>{if(e.key==='patteo-cart-v1'){try{cart=cleanCart(JSON.parse(e.newValue||'[]'));}catch{cart=[];}renderCart();}});
  // Stripe Elements: the payment form stays on PATTEO; sensitive card data goes to Stripe.
  if(page==='checkout'){
    const status=document.getElementById('patteo-payment-status');
    const form=document.getElementById('patteo-payment-form');
    const error=document.getElementById('patteo-payment-error');
    let activeCheckout=null;
    const loadStripe=()=>new Promise((resolve,reject)=>{
      if(window.Stripe)return resolve(window.Stripe);
      const script=document.createElement('script');script.src='https://js.stripe.com/endive/stripe.js';script.onload=()=>resolve(window.Stripe);script.onerror=()=>reject(new Error('Stripe ne peut pas être chargé'));document.head.appendChild(script);
    });
    const sessionId=params.get('session_id');
    const renderConfirmation=data=>{
      const main=document.getElementById('main');
      main.innerHTML='<section class="patteo-confirmation container"><div class="patteo-confirmation-card"><div class="patteo-confirmation-mark" aria-hidden="true">✓</div><p class="eyebrow">PAIEMENT CONFIRMÉ</p><h1>Merci pour votre commande.</h1><p class="patteo-confirmation-intro">Stripe a confirmé le paiement de votre commande.</p><p class="patteo-order-reference">Référence de commande <strong id="patteo-order-number"></strong></p><h2>Récapitulatif</h2><div id="patteo-confirmation-items" class="patteo-confirmation-items"></div><div class="patteo-confirmation-total"><span>Total payé</span><strong id="patteo-confirmation-total"></strong></div><p class="small-print">Un e-mail de confirmation sera envoyé à l’adresse saisie lors du paiement.</p><a class="button button-dark" href="/">Retour à Patteo</a></div></section>';
      if(data.mode==='test')document.querySelector('.patteo-confirmation-intro').textContent='Paiement de test confirmé par Stripe. Aucun montant réel n’a été prélevé.';
      document.getElementById('patteo-order-number').textContent=data.orderNumber;
      document.getElementById('patteo-confirmation-total').textContent=data.totalLabel;
      const list=document.getElementById('patteo-confirmation-items');
      for(const item of data.items){const row=document.createElement('div');row.className='patteo-confirmation-item';const description=document.createElement('div');const title=document.createElement('strong');title.textContent=item.name;const quantity=document.createElement('span');quantity.textContent=`${item.quantity} × ${item.unitLabel}`;const lineTotal=document.createElement('strong');lineTotal.textContent=item.totalLabel;description.append(title,quantity);row.append(description,lineTotal);list.append(row);}
      if(data.mode==='live'&&data.orderNumber){
        const conversionKey=`patteo-conversion-sent/${data.orderNumber}`;
        let alreadySent=false;try{alreadySent=sessionStorage.getItem(conversionKey)==='1';}catch{}
        if(!alreadySent){
          window.dataLayer=window.dataLayer||[];
          window.dataLayer.push({event:'purchase',ecommerce:{transaction_id:data.orderNumber,value:data.total/100,currency:data.currency,items:data.items.map(item=>({item_name:item.name,quantity:item.quantity,price:item.unitAmount/100}))}});
          try{sessionStorage.setItem(conversionKey,'1');}catch{}
        }
      }
      cart=[];try{localStorage.removeItem('patteo-cart-v1');}catch{}document.querySelectorAll('.cart-count').forEach(el=>el.textContent='0');
    };
    const showRetry=(message,allowRetry)=>{status.textContent=message;if(allowRetry){const link=document.createElement('a');link.className='inline-link';link.href='/commande/';link.textContent='Reprendre le paiement';status.append(document.createElement('br'),link);}};
    const verifyPayment=async()=>{
      status.textContent='Nous vérifions le paiement directement auprès de Stripe…';
      try{
        for(let attempt=0;attempt<5;attempt++){
          const response=await fetch('/api/session-status?session_id='+encodeURIComponent(sessionId),{cache:'no-store'});
          const data=await response.json();
          if(!response.ok)throw Error(data.error||'Vérification indisponible');
          if(data.state==='paid'){renderConfirmation(data);return;}
          if(data.state==='unpaid'){showRetry('Stripe ne confirme pas de paiement pour cette session. Aucune commande n’est indiquée comme payée.',true);return;}
          if(attempt<4)await new Promise(resolve=>setTimeout(resolve,1500));
        }
        showRetry('Le paiement est encore en cours de vérification. Cette page ne confirme pas la commande tant que Stripe ne l’a pas marquée comme payée.',false);
        const retry=document.createElement('button');retry.className='text-button';retry.type='button';retry.textContent='Vérifier à nouveau';retry.addEventListener('click',verifyPayment);status.append(document.createElement('br'),retry);
      }catch(error){showRetry(error.message||'Impossible de vérifier le paiement auprès de Stripe. Ne repassez pas commande avant d’avoir contrôlé votre espace Stripe.',false);}
    };
    if(sessionId)verifyPayment();
    else if(cart.length){
      status.textContent='Chargement du paiement sécurisé…';
      (async()=>{
        const response=await fetch('/api/create-checkout-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cart})});
        const data=await response.json();
        if(!response.ok||!data.clientSecret)throw Error(data.detail||data.error||'Paiement indisponible');
        const Stripe=await loadStripe();
        if(!Stripe)throw Error('Stripe indisponible');
        if(!['test','live'].includes(data.mode)||!data.publishableKey?.startsWith(data.mode==='live'?'pk_live_':'pk_test_'))throw Error('La configuration du paiement est invalide. Aucun paiement ne sera lancé.');
        const stripe=Stripe(data.publishableKey);
        activeCheckout=stripe.initCheckoutElementsSdk({clientSecret:data.clientSecret,adaptivePricing:{allowed:true},elementsOptions:{appearance:{theme:'stripe',variables:{colorPrimary:'#173e50',borderRadius:'12px'}}}});
        const loaded=await activeCheckout.loadActions();
        if(loaded.type!=='success')throw Error(loaded.error?.message||'Initialisation Stripe impossible');
        const stripeTotal=loaded.actions.getSession()?.total?.total?.amount;
        const payButton=document.getElementById('patteo-pay-button');
        const modeLabel=data.mode==='test'?' (test)':'';
        if(stripeTotal)payButton.textContent='Payer '+stripeTotal+modeLabel;
        activeCheckout.on('change',session=>{if(session?.total?.total?.amount)payButton.textContent='Payer '+session.total.total.amount+modeLabel;payButton.disabled=!session.canConfirm;});
        activeCheckout.createContactDetailsElement().mount('#patteo-contact');
        activeCheckout.createShippingAddressElement().mount('#patteo-shipping');
        activeCheckout.createCurrencySelectorElement().mount('#patteo-currency-selector');
        activeCheckout.createPaymentElement().mount('#patteo-payment-element');
        status.textContent=data.mode==='test'?'Paiement de test uniquement — aucun prélèvement réel.':'Paiement sécurisé prêt. Vérifiez vos coordonnées avant de confirmer.';
        form.hidden=false;
      })().catch(e=>{status.textContent=e.message||'Impossible de charger le paiement';});
      form.addEventListener('submit',async e=>{
        e.preventDefault();if(!activeCheckout)return;
        const btn=document.getElementById('patteo-pay-button');btn.disabled=true;error.textContent='';
        try{const result=await activeCheckout.loadActions();if(result.type!=='success')throw Error(result.error?.message||'Paiement indisponible');const outcome=await result.actions.confirm();if(outcome.type==='error')throw Error(outcome.error.message);}catch(err){error.textContent=err.message||'Paiement impossible';}finally{btn.disabled=false;}
      });
    }else status.textContent='Ajoutez un tapis au panier pour accéder au paiement.';
  }
  renderCart();updateVariant();
  window.Patteo=Object.freeze({price:SHOP.price,checkoutEnabled:SHOP.checkoutEnabled,colors:Object.keys(SHOP.colors)});
})();
