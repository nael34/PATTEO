// PATTEO — Stripe Checkout endpoint for Vercel.
// Live checkout is enabled only when a matching pk_live_ key is configured.
// Prices are defined server-side; never trust prices sent by the browser.
const prices = { xs:2390, s:2540, m:2690, l:2840, xl:2990 };
const colors = {gris:'Gris galet', bleu:'Bleu balade', jaune:'Jaune soleil'};
const dimensions = {xs:'30 × 50 cm',s:'40 × 60 cm',m:'45 × 70 cm',l:'50 × 80 cm',xl:'60 × 90 cm'};
export default async function handler(req,res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Méthode non autorisée'});
  const livePublicKey=process.env.STRIPE_PUBLISHABLE_KEY_LIVE;
  const live=Boolean(livePublicKey?.startsWith('pk_live_'));
  const key=live?process.env.STRIPE_RESTRICTED_KEY_LIVE:process.env.STRIPE_SECRET_KEY;
  const publicKey=live?livePublicKey:process.env.STRIPE_PUBLISHABLE_KEY;
  if (!key || !publicKey || !(live?/^(sk_live_|rk_live_)/.test(key):key.startsWith('sk_test_')&&publicKey.startsWith('pk_test_'))) return res.status(503).json({error:'Configuration Stripe incomplète',diagnostic:{liveKeyPresent:!!key,publicKeyPresent:!!publicKey,liveKeyFormat:!!key&&/^(sk_live_|rk_live_)/.test(key),publicKeyFormat:!!publicKey&&publicKey.startsWith('pk_live_')}});
  const cart=req.body?.cart;
  if (!Array.isArray(cart)||!cart.length||cart.length>15) return res.status(400).json({error:'Panier invalide'});
  const params=new URLSearchParams();
  params.set('mode','payment');
  params.set('ui_mode','elements');
  params.set('locale','fr');
  params.set('return_url','https://patteo.vercel.app/commande/?session_id={CHECKOUT_SESSION_ID}');
  params.set('billing_address_collection','auto');
  for (let i=0;i<cart.length;i++){
    const item=cart[i];
    if (!item||!Object.hasOwn(prices,item.size)||!Object.hasOwn(colors,item.color)||!Number.isInteger(item.qty)||item.qty<1||item.qty>10) return res.status(400).json({error:'Article invalide'});
    const p='line_items['+i+']';
    params.set(p+'[price_data][currency]','eur');
    params.set(p+'[price_data][unit_amount]',String(prices[item.size]));
    params.set(p+'[price_data][product_data][name]','Tapis Patteo '+dimensions[item.size]+' — '+colors[item.color]);
    params.set(p+'[quantity]',String(item.qty));
  }
  try {
    const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/x-www-form-urlencoded','Stripe-Version':'2026-08-26.dahlia'},body:params.toString()});
    const data=await response.json();
    if(!response.ok||!data.client_secret) {console.error('Stripe Checkout session error',{status:response.status,code:data.error?.code,param:data.error?.param,message:data.error?.message});return res.status(502).json({error:'Création Stripe refusée',detail:data.error?.message||'Consultez les logs Vercel'}); }
    return res.status(200).json({clientSecret:data.client_secret,publishableKey:publicKey,live});
  } catch { return res.status(502).json({error:'Service de paiement indisponible'}); }
}
