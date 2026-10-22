import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const files=['index.html','produit/index.html','aide/index.html','livraison/index.html','commande/index.html'];
for(const file of files){
  const html=await readFile(path.join(root,file),'utf8');
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,`${file}: one H1`);
  assert.match(html,/<html lang="fr">/);
  assert.match(html,/name="viewport"/);
  if(file==='commande/index.html')assert.match(html,/name="robots" content="noindex,follow/);
  else assert.match(html,/name="robots" content="index,follow/);
  for(const [,url] of html.matchAll(/(?:src|href)="(\/[^"#?]*)[^" ]*"/g)){
    const f=path.join(root,url.endsWith('/')?url+'index.html':url);
    const info=await stat(f);assert.ok(info.size>0,`Empty file ${f}`);
  }
  console.log(`OK ${file}: language, metadata, H1, local resources`);
}
for(const asset of ['hero.webp','gris.webp','bleu.webp','jaune.webp','logo.png'])assert.ok((await stat(path.join(root,'assets',asset))).size>1000);
const code=await readFile(path.join(root,'app.js'),'utf8');
assert.match(code,/checkoutEnabled: true/);
assert.match(code,/const META_PIXEL_ID = '2161618601394842'/);
assert.match(code,/patteo-marketing-consent-v1/);
assert.match(code,/data-cookie-choice="reject"/);
assert.match(code,/if\(!marketingAllowed\(\)\|\|window\.__patteoMetaInitialized\)return/);
assert.match(code,/trackMeta\('Purchase'/);
assert.match(code,/trackMeta\('AddToCart'/);
assert.match(code,/trackMeta\('InitiateCheckout'/);
assert.match(code,/trackMeta\('ViewContent'/);
assert.ok(!/sk_live_[A-Za-z0-9]{16,}/.test(code));
assert.match(await readFile(path.join(root,'robots.txt'),'utf8'),/Allow: \/[\s\S]*Sitemap:/);
assert.match(await readFile(path.join(root,'sitemap.xml'),'utf8'),/https:\/\/patteo\.vercel\.app\/produit\//);
console.log('OK assets, crawlable pages, sitemap, no embedded Stripe secret');
