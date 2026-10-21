import { formatCurrency, getStripeTestConfig } from './_lib/stripe-test.js';

export const config = { api: { bodyParser: false } };

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function confirmationEmail(session, items) {
  const orderNumber = session.metadata?.order_number || `PT-${session.id.slice(-10).toUpperCase()}`;
  const currency = String(session.currency || 'eur').toUpperCase();
  const total = formatCurrency(session.amount_total, currency);
  const rows = items.map(item => {
    const name = escapeHtml(item.description || 'Article Patteo');
    const quantity = Number(item.quantity || 1);
    const unit = formatCurrency(Math.round(Number(item.amount_subtotal || 0) / quantity), currency);
    const subtotal = formatCurrency(item.amount_total, currency);
    return `<tr><td style="padding:12px 0;border-bottom:1px solid #e5e9e4"><strong>${name}</strong><br><span style="color:#687570">${quantity} × ${unit}</span></td><td style="padding:12px 0;text-align:right;border-bottom:1px solid #e5e9e4">${subtotal}</td></tr>`;
  }).join('');
  const textRows = items.map(item => `${item.description || 'Article Patteo'} — ${item.quantity || 1} × ${formatCurrency(Math.round(Number(item.amount_subtotal || 0) / Number(item.quantity || 1)), currency)} : ${formatCurrency(item.amount_total, currency)}`).join('\n');
  return {
    orderNumber,
    subject: `PATTEO — commande confirmée ${orderNumber}`,
    html: `<!doctype html><html lang="fr"><meta charset="utf-8"><body style="margin:0;background:#f4f5f1;font-family:Arial,sans-serif;color:#213b44"><main style="max-width:600px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden"><header style="background:#173e50;color:#fff;padding:30px;text-align:center"><div style="font-size:25px;font-weight:700;letter-spacing:3px">PATTEO</div><p style="margin:10px 0 0;color:#e4ede7">Le bonheur de rentrer ensemble</p></header><section style="padding:32px"><p style="color:#60766e;font-size:12px;letter-spacing:1px;text-transform:uppercase">Commande confirmée</p><h1 style="font-size:26px;margin:8px 0 12px">Merci pour votre commande !</h1><p>Votre paiement test a été confirmé. Voici le récapitulatif de votre commande.</p><p style="margin:24px 0;padding:14px;background:#eef2ec;border-radius:10px">Référence : <strong>${escapeHtml(orderNumber)}</strong></p><table style="width:100%;border-collapse:collapse">${rows}</table><p style="display:flex;justify-content:space-between;padding-top:18px;font-size:18px"><strong>Total</strong><strong>${total}</strong></p><p style="color:#687570;font-size:13px;line-height:1.7">Nous vous tiendrons informé(e) de la suite de votre commande. Pour toute question, répondez à cet e-mail.</p></section></main></body></html>`,
    text: `PATTEO — Commande confirmée\nRéférence : ${orderNumber}\n\n${textRows}\n\nTotal : ${total}\n\nVotre paiement test a été confirmé.`,
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
  const getConfig = dependencies.getConfig || getStripeTestConfig;
  const configResult = getConfig();
  if (configResult.error) return res.status(503).json({ error: 'Webhook de test indisponible' });
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const resendKey = process.env.RESEND_API_KEY;
  if (!secret?.startsWith('whsec_')) return res.status(503).json({ error: 'Signature webhook non configurée' });

  let event;
  try {
    const payload = await readRawBody(req);
    event = configResult.stripe.webhooks.constructEvent(payload, req.headers['stripe-signature'], secret, 300);
  } catch {
    return res.status(400).json({ error: 'Signature Stripe invalide' });
  }

  if (event.livemode !== false) return res.status(200).json({ received: true, ignored: 'non-test event' });
  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
    return res.status(200).json({ received: true, ignored: 'event type' });
  }

  const sessionId = event.data?.object?.id;
  if (typeof sessionId !== 'string' || !/^cs_test_[A-Za-z0-9_]+$/.test(sessionId)) {
    return res.status(400).json({ error: 'Session test invalide' });
  }
  try {
    const stripe = configResult.stripe;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.livemode !== false || session.status !== 'complete' || session.payment_status !== 'paid') {
      return res.status(200).json({ received: true, ignored: 'payment not paid' });
    }
    if (session.metadata?.confirmation_email_sent_at) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    const recipient = session.customer_details?.email || session.customer_email;
    if (!recipient) {
      console.error('PATTEO: paid test session has no customer email.', session.id);
      return res.status(200).json({ received: true, emailSkipped: 'missing customer email' });
    }
    if (!resendKey?.startsWith('re_')) return res.status(503).json({ error: 'Service e-mail non configuré' });
    const { data: items } = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
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

    await stripe.checkout.sessions.update(session.id, {
      metadata: {
        ...session.metadata,
        confirmation_email_sent_at: new Date().toISOString(),
        confirmation_email_id: resendResult.id,
      },
    });
    return res.status(200).json({ received: true, emailed: true });
  } catch (error) {
    console.error('PATTEO: paid test webhook processing failed.', error?.type || 'provider error', error?.code || '');
    return res.status(502).json({ error: 'Traitement de la commande à réessayer' });
  }
}

export { confirmationEmail };
