import { formatCurrency, getStripeConfig } from './_lib/stripe-test.js';
import { getMetaTestEventCode, sendMetaPurchase } from './_lib/meta-capi.js';

export const config = { api: { bodyParser: false } };

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function confirmationEmail(session, items) {
  const orderNumber = session.metadata?.order_number || `PT-${session.id.slice(-10).toUpperCase()}`;
  const currency = String(session.currency || 'eur').toUpperCase();
  const total = formatCurrency(session.amount_total, currency);
  const site = 'https://patteo.vercel.app';
  const test = session.livemode === false;
  const rows = items.map(item => {
    const name = escapeHtml(item.description || 'Article Patteo');
    const quantity = Math.max(1, Number(item.quantity || 1));
    const unit = formatCurrency(Math.round(Number(item.amount_subtotal || 0) / quantity), currency);
    const subtotal = formatCurrency(item.amount_total, currency);
    return `<tr><td style="padding:20px 0;border-bottom:1px solid #e4e4dc;color:#173e50;font-size:14px;line-height:1.6"><strong style="font-size:15px">${name}</strong><br><span style="color:#66777b">${quantity} × ${unit}</span></td><td align="right" style="padding:20px 0;border-bottom:1px solid #e4e4dc;color:#173e50;font-weight:bold;white-space:nowrap">${subtotal}</td></tr>`;
  }).join('') + '<tr><td colspan="2" style="padding:20px 0 4px;color:#50616a;font-size:13px;line-height:1.7"><strong>Livraison</strong><br>Préparation : 1 à 3 jours. Acheminement : 8 à 18 jours après expédition.</td></tr>';
  const textRows = items.map(item => `${item.description || 'Article Patteo'} — ${item.quantity || 1} × ${formatCurrency(Math.round(Number(item.amount_subtotal || 0) / Number(item.quantity || 1)), currency)} : ${formatCurrency(item.amount_total, currency)}`).join('\n') + '\n\nLivraison : préparation sous 1 à 3 jours, puis acheminement sous 8 à 18 jours après expédition.';
  const heading = test ? 'Votre commande test est confirmée' : 'Votre commande est confirmée';
  return {
    orderNumber,
    subject: `PATTEO 🐾 Merci pour votre commande · ${orderNumber}`,
    html: `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Votre commande PATTEO</title></head><body style="margin:0;padding:0;background:#faf8f2;font-family:Arial,Helvetica,sans-serif;color:#173e50"><div style="display:none;font-size:1px;color:#faf8f2;line-height:1px;max-height:0;opacity:0;overflow:hidden">Votre tapis PATTEO arrive bientôt dans votre quotidien. Merci pour votre confiance !</div><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f2"><tr><td align="center" style="padding:28px 12px 45px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px"><tr><td align="center" style="padding:14px 10px 26px"><a href="${site}" style="text-decoration:none"><img src="${site}/assets/logo.png" width="168" alt="PATTEO" style="display:block;width:168px;max-width:100%;height:auto;border:0"></a><p style="font-size:12px;letter-spacing:1px;color:#50616a;margin:14px 0 0">LES BALADES DEHORS. LE BONHEUR DEDANS.</p></td></tr><tr><td style="background:#fffefa;border-radius:20px;overflow:hidden"><img src="${site}/assets/hero.webp" width="600" alt="L'univers PATTEO : des balades heureuses et une maison accueillante" style="display:block;width:100%;height:auto;border:0"><div style="padding:34px 32px 8px"><p style="margin:0 0 14px;color:#7a816f;font-size:11px;letter-spacing:2px;font-weight:bold">UN PETIT MOT DE PATTEO 🐾</p><h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:36px;line-height:1.16;font-weight:normal;color:#173e50">Merci pour votre confiance !</h1><p style="margin:0 0 26px;color:#50616a;font-size:15px;line-height:1.85">Les meilleures balades laissent de beaux souvenirs, pas forcément des traces à la maison. On est ravis que PATTEO fasse partie de votre quotidien.</p><div style="background:#e3e8d9;border-radius:12px;padding:20px 22px"><p style="margin:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:1.5px;color:#50616a">✓ ${heading.toUpperCase()}</p><p style="margin:0;color:#173e50;font-size:15px;line-height:1.65">${test ? 'Votre paiement de démonstration a été validé. Aucun débit réel.' : 'Votre paiement a bien été reçu. Nous préparons votre commande avec soin.'}</p></div></div><div style="padding:22px 32px 32px"><p style="font-size:11px;font-weight:bold;letter-spacing:1.5px;color:#66777b;margin:0 0 8px">VOTRE RÉCAPITULATIF</p><p style="margin:0 0 10px;font-size:15px;color:#173e50">Commande <strong>${escapeHtml(orderNumber)}</strong></p><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">${rows}<tr><td style="padding:23px 0 8px;font-size:17px;font-weight:bold">Total</td><td align="right" style="padding:23px 0 8px;font-size:21px;font-weight:bold;white-space:nowrap">${total}</td></tr></table></div><div style="background:#dfebee;padding:27px 32px"><h2 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;margin:0 0 10px">À très vite pour de nouvelles balades.</h2><p style="font-size:14px;line-height:1.8;color:#50616a;margin:0 0 20px">Une question sur votre commande ? Notre équipe est là pour vous aider.</p><a href="${site}/aide/" style="display:inline-block;background:#173e50;color:#fffefa;text-decoration:none;border-radius:7px;padding:13px 23px;font-size:13px;font-weight:bold">Nous contacter →</a></div></td></tr><tr><td align="center" style="padding:25px 15px"><p style="font-size:12px;color:#50616a;line-height:1.8;margin:0 0 8px">PATTEO · Des pattes heureuses. Une maison accueillante.</p><a href="${site}" style="font-size:12px;color:#173e50;text-decoration:underline">Découvrir PATTEO</a><p style="font-size:11px;color:#7c8988;margin:14px 0 0">Ce message concerne votre commande ${escapeHtml(orderNumber)}.</p></td></tr></table></td></tr></table></body></html>`,
    text: `PATTEO — ${heading}\nMerci pour votre confiance !\nCommande : ${orderNumber}\n\n${textRows}\n\nTotal : ${total}\n\n${test ? 'Paiement de test validé, aucun débit réel.' : 'Votre paiement a bien été reçu.'}\nUne question ? ${site}/aide/\n`,
  };
}

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export default async function handler(req, res, dependencies = {}) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const getConfig = dependencies.getConfig || getStripeConfig;
  const configResult = getConfig();
  if (configResult.error) return res.status(503).json({ error: 'Webhook indisponible' });
  const secret = configResult.mode === 'live' ? process.env.STRIPE_WEBHOOK_SECRET_LIVE : process.env.STRIPE_WEBHOOK_SECRET;
  const resendKey = process.env.RESEND_API_KEY;
  const metaAccessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!secret?.startsWith('whsec_')) return res.status(503).json({ error: 'Signature webhook non configurée' });

  let event;
  try {
    const payload = await readRawBody(req);
    event = configResult.stripe.webhooks.constructEvent(payload, req.headers['stripe-signature'], secret, 300);
  } catch {
    return res.status(400).json({ error: 'Signature Stripe invalide' });
  }

  if (event.livemode !== (configResult.mode === 'live')) return res.status(200).json({ received: true, ignored: 'mode mismatch' });
  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
    return res.status(200).json({ received: true, ignored: 'event type' });
  }

  const sessionId = event.data?.object?.id;
  if (typeof sessionId !== 'string' || !new RegExp(`^cs_${configResult.mode === 'live' ? 'live' : 'test'}_[A-Za-z0-9_]+$`).test(sessionId)) {
    return res.status(400).json({ error: 'Session invalide' });
  }
  try {
    const stripe = configResult.stripe;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.livemode !== (configResult.mode === 'live') || session.status !== 'complete' || session.payment_status !== 'paid') {
      return res.status(200).json({ received: true, ignored: 'payment not paid' });
    }
    const testEventCode = getMetaTestEventCode(configResult.mode);
    const metaModeAllowed = configResult.mode === 'live' ||
      (testEventCode && session.metadata?.meta_test_event_code === testEventCode);
    const shouldSendMeta = !!metaModeAllowed && !!metaAccessToken &&
      session.metadata?.meta_marketing_consent === 'granted' && !!session.metadata?.meta_event_id && !session.metadata?.meta_capi_sent_at;
    const shouldSendEmail = !session.metadata?.confirmation_email_sent_at && !session.metadata?.confirmation_email_skipped;
    if (!shouldSendMeta && !shouldSendEmail) return res.status(200).json({ received: true, duplicate: true });

    const { data: items } = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
    if (shouldSendMeta) {
      const sendMeta = dependencies.sendMetaPurchase || sendMetaPurchase;
      const metaResult = await sendMeta({ session, items, accessToken: metaAccessToken, testEventCode, fetchImpl: dependencies.fetchMeta || fetch });
      if (metaResult?.skipped) throw new Error('Meta purchase unexpectedly skipped');
      session.metadata = { ...session.metadata, meta_capi_sent_at: new Date().toISOString() };
      await stripe.checkout.sessions.update(session.id, { metadata: session.metadata });
    }

    let emailed = false;
    if (shouldSendEmail) {
      const recipient = session.customer_details?.email || session.customer_email;
      if (!recipient) {
        console.error('PATTEO: paid session has no customer email.', session.id);
        session.metadata = { ...session.metadata, confirmation_email_skipped: 'missing_customer_email' };
      } else {
        if (!resendKey?.startsWith('re_')) return res.status(503).json({ error: 'Service e-mail non configuré' });
        const email = confirmationEmail(session, items);
        const send = dependencies.sendEmail || (async payload => fetch('https://api.resend.com/emails', payload));
        const response = await send({
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `patteo-confirmation/${session.id}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'PATTEO <commandes@montpellier-ia.dev>',
            to: [recipient],
            subject: email.subject,
            html: email.html,
            text: email.text,
          }),
        });
        if (!response.ok) {
          console.error('PATTEO: Resend rejected confirmation email.', response.status);
          return res.status(502).json({ error: 'Envoi de la confirmation impossible' });
        }
        let resendResult;
        try { resendResult = await response.json(); } catch { resendResult = {}; }
        if (!resendResult.id) {
          console.error('PATTEO: Resend response did not contain an email ID.');
          return res.status(502).json({ error: 'Confirmation e-mail non vérifiable' });
        }
        session.metadata = {
          ...session.metadata,
          confirmation_email_sent_at: new Date().toISOString(),
          confirmation_email_id: resendResult.id,
        };
        emailed = true;
      }
      await stripe.checkout.sessions.update(session.id, { metadata: session.metadata });
    }
    return res.status(200).json({ received: true, emailed, metaSent: shouldSendMeta });
  } catch (error) {
    console.error('PATTEO: paid webhook processing failed.', error?.type || 'provider error', error?.code || '');
    return res.status(502).json({ error: 'Traitement de la commande à réessayer' });
  }
}

export { confirmationEmail };
