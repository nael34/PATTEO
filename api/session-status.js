import { formatCurrency, getStripeConfig } from './_lib/stripe-test.js';

export default async function handler(req, res, dependencies = {}) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });
  const id = req.query?.session_id;
  if (typeof id !== 'string' || !/^cs_(?:test|live)_[A-Za-z0-9_]+$/.test(id)) return res.status(400).json({ error: 'Identifiant de session invalide' });
  const config = (dependencies.getConfig || getStripeConfig)();
  if (config.error) return res.status(503).json({ error: 'Vérification du paiement indisponible' });
  if (!id.startsWith(config.mode === 'live' ? 'cs_live_' : 'cs_test_')) return res.status(404).json({ error: 'Session introuvable' });

  try {
    const session = await config.stripe.checkout.sessions.retrieve(id);
    if (session.livemode !== (config.mode === 'live')) return res.status(404).json({ error: 'Session introuvable' });
    if (session.payment_status !== 'paid' || session.status !== 'complete') {
      return res.status(200).json({ state: session.status === 'open' ? 'unpaid' : 'processing' });
    }

    const result = await config.stripe.checkout.sessions.listLineItems(id, { limit: 100 });
    const currency = (session.currency || 'eur').toUpperCase();
    const items = result.data.map(line => {
      const quantity = Math.max(1, Number(line.quantity || 1));
      const subtotal = Number(line.amount_subtotal ?? line.amount_total ?? 0);
      const unitAmount = Math.round(subtotal / quantity);
      const amountTotal = Number(line.amount_total || 0);
      return {
        name: String(line.description || 'Article Patteo').slice(0, 160),
        quantity,
        unitAmount,
        unitLabel: formatCurrency(unitAmount, currency),
        amountTotal,
        totalLabel: formatCurrency(amountTotal, currency),
      };
    });
    return res.status(200).json({
      state: 'paid',
      mode: config.mode,
      orderNumber: session.metadata?.order_number || `PT-${id.slice(-10).toUpperCase()}`,
      currency,
      currencyLabel: currency,
      total: Number(session.amount_total || 0),
      totalLabel: formatCurrency(session.amount_total, currency),
      items,
    });
  } catch (error) {
    console.error('PATTEO: Checkout Session verification failed.', error?.type || 'Stripe error', error?.code || '');
    return res.status(502).json({ error: 'Stripe ne peut pas confirmer le paiement pour le moment' });
  }
}
