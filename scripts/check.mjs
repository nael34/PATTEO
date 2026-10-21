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
  assert.match(html,/noindex,nofollow/);
  for(const [,url] of html.matchAll(/(?:src|href)="(\/[^"#?]*)[^" ]*"/g)){
    const f=path.join(root,url.endsWith('/')?url+'index.html':url);
    const info=await stat(f);assert.ok(info.size>0,`Empty file ${f}`);
  }
  console.log(`OK ${file}: language, metadata, H1, local resources`);
}
for(const asset of ['hero.webp','gris.webp','bleu.webp','jaune.webp','logo.png'])assert.ok((await stat(path.join(root,'assets',asset))).size>1000);
const code=await readFile(path.join(root,'app.js'),'utf8');
assert.match(code,/checkoutEnabled: false/);
assert.ok(!code.includes('pk_live_')&&!code.includes('sk_live_'));
console.log('OK assets, preview checkout, no live Stripe keys');
