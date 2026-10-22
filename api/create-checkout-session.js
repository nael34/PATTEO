import { COLORS, DIMENSIONS, PRICES, getStripeConfig, makeIntegrationIdentifier, makeOrderNumber, normalizeCart } from './_lib/stripe-test.js';

export default async function handler(req, res, dependencies = {}) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const config = (dependencies.getConfig || getStripeConfig)();
  if (config.error) return res.status(503).json({ error: 'Paiement indisponible', detail: config.error });

  const cart = normalizeCart(req.body?.cart);
  if (!cart) return res.status(400).json({ error: 'Panier invalide' });

  const orderNumber = makeOrderNumber();
  const marketingConsent = req.body?.marketingConsent === true;
  const metaEventId = `patteo_${orderNumber}`;
  const marketingMetadata = marketingConsent ? {
    meta_marketing_consent: 'granted',
    meta_event_id: metaEventId,
    meta_fbp: typeof req.body?.metaFbp === 'string' ? req.body.metaFbp.slice(0, 200) : '',
    meta_fbc: typeof req.body?.metaFbc === 'string' ? req.body.metaFbc.slice(0, 200) : '',
  } : {};
  try {
    const session = await config.stripe.checkout.sessions.create({
      mode: 'payment',
      ui_mode: 'elements',
      locale: 'fr',
      return_url: 'https://patteo.vercel.app/commande/?session_id={CHECKOUT_SESSION_ID}',
      billing_address_collection: 'auto',
      shipping_address_collection: { allowed_countries: ['FR'] },
      integration_identifier: makeIntegrationIdentifier(),
      metadata: { order_number: orderNumber, ...marketingMetadata },
      payment_intent_data: { metadata: { order_number: orderNumber } },
      line_items: cart.map(item => ({
        quantity: item.qty,
        price_data: {
          currency: 'eur',
          unit_amount: PRICES[item.size],
          product_data: { name: `Tapis Patteo ${DIMENSIONS[item.size]} — ${COLORS[item.color]}` },
        },
      })),
    });
    if (!session.client_secret || session.livemode !== (config.mode === 'live')) {
      console.error('PATTEO: Stripe returned a Checkout Session with an unexpected mode.');
      return res.status(502).json({ error: 'Session de paiement invalide' });
    }
    return res.status(200).json({ clientSecret: session.client_secret, publishableKey: config.publishableKey, mode: config.mode, metaEventId: marketingConsent ? metaEventId : null });
  } catch (error) {
    console.error('PATTEO: Checkout Session creation failed.', error?.type || 'Stripe error', error?.code || '');
    return res.status(502).json({ error: 'Création de la session de paiement impossible' });
  }
}
