import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';
import checkout from '../api/create-checkout-session.js';
import { COLORS, PRICES, SUPPLIER_VARIANTS, getVariantPrice } from '../api/_lib/stripe-test.js';

test('all 16 supplier-backed variants agree between displayed cart prices and server-authoritative Stripe line items', async () => {
  const code = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  for (const color of Object.keys(COLORS)) {
    for (const size of Object.keys(PRICES)) {
      const nodes = Object.fromEntries(['site-header','main','site-footer','overlays'].map(id=>[id,{innerHTML:'',children:[]}]));
      const context = {document:{body:{dataset:{page:'checkout'}},getElementById:id=>nodes[id]},window:{__PATTEO_BUILD:true,location:{search:`?couleur=${color}&taille=${size}`}},URLSearchParams,Intl,localStorage:{getItem:()=>JSON.stringify([{color,size,qty:2}])}};
      vm.runInNewContext(code,context);
      const expected = getVariantPrice(color,size);
      assert.ok(nodes.main.innerHTML.includes(new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(expected*2/100)));
      await stat(new URL('../dist'+context.window.__PATTEO_CONFIG.colors[color].image,import.meta.url));
      await stat(new URL('../dist'+context.window.__PATTEO_CONFIG.colors[color].texture,import.meta.url));
      assert.notEqual(context.window.__PATTEO_CONFIG.colors[color].image,context.window.__PATTEO_CONFIG.colors[color].texture);
      let payload;
      const res={statusCode:200,status(n){this.statusCode=n;return this;},json(value){this.body=value;return this;}};
      await checkout({method:'POST',body:{cart:[{color,size,qty:2,price:1,unit_amount:1}]}},res,{getConfig:()=>({mode:'test',publishableKey:'pk_test_fixture',stripe:{checkout:{sessions:{create:async p=>{payload=p;return {livemode:false,client_secret:'test_fixture'};}}}}})});
      assert.equal(res.statusCode,200);
      assert.equal(payload.line_items[0].price_data.unit_amount,expected);
      assert.equal(payload.line_items[0].quantity,2);
      assert.equal(payload.line_items[0].price_data.product_data.metadata.cj_sku,SUPPLIER_VARIANTS[color][size].sku);
      if(size==='xl')assert.equal(expected,['gris','bleu'].includes(color)?2490:2990);
    }
  }
});

test('multicolor XL basket keeps distinct colors and exact totals', async () => {
  let payload;
  const res={status(n){this.statusCode=n;return this;},json(value){this.body=value;return this;}};
  await checkout({method:'POST',body:{cart:Object.keys(COLORS).map(color=>({color,size:'xl',qty:1}))}},res,{getConfig:()=>({mode:'test',publishableKey:'pk_test_fixture',stripe:{checkout:{sessions:{create:async p=>{payload=p;return {livemode:false,client_secret:'test_fixture'};}}}}})});
  assert.equal(payload.line_items.length,8);
  assert.equal(payload.line_items.reduce((n,i)=>n+i.price_data.unit_amount*i.quantity,0),22920);
});
