import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
const root = new URL('../dist/', import.meta.url);
const code = await readFile(new URL('app.js', root), 'utf8');
const pages = { 'index.html':'home', 'produit/index.html':'product', 'livraison/index.html':'delivery', 'aide/index.html':'help', 'commande/index.html':'checkout' };
for (const [file, page] of Object.entries(pages)) {
  const nodes = Object.fromEntries(['site-header','main','site-footer','overlays'].map(id=>[id,{innerHTML:'',children:[]}]));
  const context = { document:{body:{dataset:{page}},getElementById:id=>nodes[id]}, window:{__PATTEO_BUILD:true,location:{search:''}}, URLSearchParams, Intl, localStorage:{getItem:()=>null} };
  vm.runInNewContext(code,context,{timeout:2000});
  let html = await readFile(new URL(file, root),'utf8');
  html = html.replace(/<div id="site-header">[\s\S]*?<\/div>\s*(?=<main)/,`<div id="site-header">${nodes['site-header'].innerHTML}</div>\n`);
  html = html.replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main">${nodes.main.innerHTML}</main>`);
  html = html.replace(/<div id="site-footer">[\s\S]*?<\/div>\s*(?=<div id="overlays")/,`<div id="site-footer">${nodes['site-footer'].innerHTML}</div>\n`);
  await writeFile(new URL(file,root),html);
  console.log(`Prerendered ${file}`);
}
