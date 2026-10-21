import { createHmac, timingSafeEqual } from 'node:crypto';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const euros = cents => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format((Number(cents)||0)/100);
const stripeHeaders = key => ({Authorization:'Bearer '+key,'Stripe-Version':'2026-08-26.dahlia'});
function verifySignature(payload, header, secret) {
  const pieces=Object.fromEntries(String(header||'').split(',').map(x=>x.split('=').map(y=>y.trim())).filter(x=>x.length===2));
  const timestamp=Number(pieces.t);
  if(!Number.isSafeInteger(timestamp)||Math.abs(Date.now()/1000-timestamp)>300)return false;
  const expected=createHmac('sha256',secret).update(timestamp+'.'+payload).digest('hex');
  return String(header).split(',').filter(x=>x.startsWith('v1=')).some(x=>{
    const candidate=x.slice(3);
    return /^[a-f0-9]{64}$/i.test(candidate)&&timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(candidate,'hex'));
  });
}
export default async function handler(req,res) {
  if(req.method!=='POST')return res.status(405).json({error:'Méthode non autorisée'});
  const webhookSecret=process.env.STRIPE_WEBHOOK_SECRET;
  const resendKey=process.env.RESEND_API_KEY;
  if(!webhookSecret)return res.status(503).json({error:'Webhook Stripe non configuré'});
  const chunks=[];
  for await(const chunk of req)chunks.push(Buffer.from(chunk));
  const payload=Buffer.concat(chunks).toString('utf8');
  if(!verifySignature(payload,req.headers['stripe-signature'],webhookSecret))return res.status(400).json({error:'Signature Stripe invalide'});
  let event;
  try{event=JSON.parse(payload);}catch{return res.status(400).json({error:'Événement invalide'});}
  if(!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type))return res.status(200).json({received:true});
  const session=event.data?.object;
  if(!session?.id||session.payment_status!=='paid')return res.status(200).json({received:true,unpaid:true});
  if(!resendKey){console.error('PATTEO: RESEND_API_KEY missing');return res.status(503).json({error:'Service email non configuré'});}
  const stripeKey=event.livemode?process.env.STRIPE_RESTRICTED_KEY_LIVE:process.env.STRIPE_SECRET_KEY;
  if(!stripeKey)return res.status(503).json({error:'Clé Stripe manquante'});
  const email=session.customer_details?.email||session.customer_email;
  if(!email){console.error('PATTEO: no customer email for session',session.id);return res.status(200).json({received:true,noEmail:true});}
  const itemsResponse=await fetch('https://api.stripe.com/v1/checkout/sessions/'+encodeURIComponent(session.id)+'/line_items?limit=100',{headers:stripeHeaders(stripeKey)});
  if(!itemsResponse.ok){console.error('PATTEO: Stripe line items request failed',itemsResponse.status);return res.status(502).json({error:'Articles indisponibles'});}
  const items=(await itemsResponse.json()).data||[];
  const rows=items.map(i=>'<tr><td style="padding:10px 0;border-bottom:1px solid #eee">'+escapeHtml(i.description||'Tapis PATTEO')+' × '+Number(i.quantity||1)+'</td><td style="text-align:right;border-bottom:1px solid #eee">'+euros(i.amount_total)+'</td></tr>').join('');
  const lines=items.map(i=>(i.description||'Tapis PATTEO')+' × '+Number(i.quantity||1)+' : '+euros(i.amount_total)).join('\n');
  const orderId=session.id;
  const html='<!doctype html><html lang="fr"><meta charset="utf-8"><body style="margin:0;background:#f5f5f0;font-family:Arial,sans-serif;color:#24332b"><div style="max-width:560px;margin:30px auto;background:white;border-radius:16px;overflow:hidden"><div style="background:#243d31;color:white;padding:28px;text-align:center"><h1>PATTEO</h1><p>Confirmation de commande</p></div><div style="padding:30px"><h2>Merci pour votre commande !</h2><p>Votre paiement a été confirmé.</p><p>Référence : <strong>'+escapeHtml(orderId)+'</strong></p><table style="width:100%;border-collapse:collapse">'+rows+'</table><p style="font-size:18px"><strong>Total payé : '+euros(session.amount_total)+'</strong></p><p>Nous vous informerons de la suite de votre commande.</p></div></div></body></html>';
  const from=process.env.RESEND_FROM_EMAIL||'PATTEO <commandes@montpellier-ia.dev>';
  const result=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+resendKey,'Content-Type':'application/json','Idempotency-Key':'patteo-confirmation-'+orderId},body:JSON.stringify({from,to:[email],subject:'PATTEO — Confirmation de votre commande',html,text:'PATTEO — Commande confirmée\nRéférence : '+orderId+'\n'+lines+'\nTotal payé : '+euros(session.amount_total)})});
  if(!result.ok){console.error('PATTEO: Resend failed',result.status,(await result.text()).slice(0,300));return res.status(502).json({error:'Envoi email refusé'});}
  return res.status(200).json({received:true,emailed:true});
}
