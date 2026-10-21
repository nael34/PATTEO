// Read-only payment status for PATTEO's test-mode return page.
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Méthode non autorisée'});
  const id=req.query.session_id;
  if(typeof id!=='string'||!/^cs_test_[A-Za-z0-9_]+$/.test(id))return res.status(400).json({error:'Identifiant invalide'});
  const key=process.env.STRIPE_SECRET_KEY;
  if(!key?.startsWith('sk_test_'))return res.status(503).json({error:'Paiement test non configuré'});
  try{
    const response=await fetch('https://api.stripe.com/v1/checkout/sessions/'+encodeURIComponent(id),{headers:{Authorization:'Bearer '+key,'Stripe-Version':'2026-08-26.dahlia'}});
    const data=await response.json();
    if(!response.ok)return res.status(502).json({error:'Session introuvable'});
    return res.status(200).json({status:data.status,payment_status:data.payment_status});
  }catch{return res.status(502).json({error:'Vérification indisponible'});}
}