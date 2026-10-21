import { COLORS, DIMENSIONS, PRICES, getStripeTestConfig, makeIntegrationIdentifier, makeOrderNumber, normalizeCart } from './_lib/stripe-test.js';

export default async function handler(req, res, dependencies = {}) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const config = (dependencies.getConfig || getStripeTestConfig)();
  if (config.error) return res.status(503).json({ error: 'Paiement de test indisponible', detail: config.error });

  const cart = normalizeCart(req.body?.cart);
  if (!cart) return res.status(400).json({ error: 'Panier invalide' });

  const orderNumber = makeOrderNumber();
  try {
    const session = await config.stripe.checkout.sessions.create({
      mode: 'payment',
      ui_mode: 'elements',
      locale: 'fr',
      return_url: 'https://patteo.vercel.app/commande/?session_id={CHECKOUT_SESSION_ID}',
      billing_address_collection: 'auto',
      shipping_address_collection: { allowed_countries: ['FR'] },
      integration_identifier: makeIntegrationIdentifier(),
      metadata: { order_number: orderNumber },
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
    if (!session.client_secret || session.livemode !== false) {
      console.error('PATTEO: Stripe returned an invalid test Checkout Session.');
      return res.status(502).json({ error: 'Session de paiement test invalide' });
    }
    return res.status(200).json({ clientSecret: session.client_secret, publishableKey: config.publishableKey });
  } catch (error) {
    console.error('PATTEO: Checkout Session creation failed.', error?.type || 'Stripe error', error?.code || '');
    return res.status(502).json({ error: 'Création de la session de paiement impossible' });
  }
}
