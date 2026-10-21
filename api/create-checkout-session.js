// PATTEO — Stripe Checkout test-mode endpoint for Vercel.
// Set STRIPE_SECRET_KEY to a Stripe sk_test_ key in Vercel Environment Variables.
// Prices are defined server-side; never trust prices sent by the browser.
const prices = { xs:2390, s:2540, m:2690, l:2840, xl:2990 };
const colors = {gris:'Gris galet', bleu:'Bleu balade', jaune:'Jaune soleil'};
const dimensions = {xs:'30 × 50 cm',s:'40 × 60 cm',m:'45 × 70 cm',l:'50 × 80 cm',xl:'60 × 90 cm'};
export default async function handler(req,res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Méthode non autorisée'});
  const key=process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith('sk_test_')) return res.status(503).json({error:'Paiement test non configuré'});
  const cart=req.body?.cart;
  if (!Array.isArray(cart)||!cart.length||cart.length>15) return res.status(400).json({error:'Panier invalide'});
  const params=new URLSearchParams();
  params.set('mode','payment');
  params.set('locale','fr');
  params.set('success_url','https://patteo.vercel.app/commande/?paiement=succes&session_id={CHECKOUT_SESSION_ID}');
  params.set('cancel_url','https://patteo.vercel.app/commande/?paiement=annule');
  params.set('shipping_address_collection[allowed_countries][0]','FR');
  params.set('phone_number_collection[enabled]','true');
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
    const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/x-www-form-urlencoded'},body:params.toString()});
    const data=await response.json();
    if(!response.ok||!data.url) return res.status(502).json({error:'Impossible de créer la session Stripe'});
    return res.status(200).json({url:data.url});
  } catch { return res.status(502).json({error:'Service de paiement indisponible'}); }
}
