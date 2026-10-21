// Read-only payment status for PATTEO.
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Méthode non autorisée'});
  if(req.query.diagnostic==='1'||!req.query.session_id){
    const p=process.env.STRIPE_PUBLISHABLE_KEY_LIVE;
    const k=process.env.STRIPE_RESTRICTED_KEY_LIVE;
    return res.status(200).json({livePublicKeyValid:!!p?.startsWith('pk_live_'),liveServerKeyValid:!!k&&/^(sk_live_|rk_live_)/.test(k),livePublicKeyPresent:!!p,liveServerKeyPresent:!!k});
  }
  const id=req.query.session_id;
  if(typeof id!=='string'||!/^cs_(?:test_|live_)?[A-Za-z0-9_]+$/.test(id))return res.status(400).json({error:'Identifiant invalide'});
  const live=process.env.STRIPE_MODE!=='test' && Boolean(process.env.STRIPE_PUBLISHABLE_KEY_LIVE?.startsWith('pk_live_'));
  const key=live?process.env.STRIPE_RESTRICTED_KEY_LIVE:process.env.STRIPE_SECRET_KEY;
  if(!key || !(live?/^(sk_live_|rk_live_)/.test(key):key.startsWith('sk_test_')))return res.status(503).json({error:'Configuration Stripe incomplète'});
  try{
    const response=await fetch('https://api.stripe.com/v1/checkout/sessions/'+encodeURIComponent(id),{headers:{Authorization:'Bearer '+key,'Stripe-Version':'2026-08-26.dahlia'}});
    const data=await response.json();
    if(!response.ok)return res.status(502).json({error:'Session introuvable'});
    return res.status(200).json({status:data.status,payment_status:data.payment_status});
  }catch{return res.status(502).json({error:'Vérification indisponible'});}
}