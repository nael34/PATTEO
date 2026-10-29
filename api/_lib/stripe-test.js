import Stripe from 'stripe';

export const STRIPE_API_VERSION = '2026-08-26.dahlia';
export const PRICES = Object.freeze({ xs: 2390, s: 2540, m: 2690, l: 2840, xl: 2990 });
export const COLORS = Object.freeze({ gris: 'Gris galet', bleu: 'Bleu balade', jaune: 'Jaune soleil' });
export const DIMENSIONS = Object.freeze({ xs: '30 × 50 cm', s: '40 × 60 cm', m: '45 × 70 cm', l: '50 × 80 cm', xl: '60 × 90 cm' });

export function getStripeConfig(env = process.env) {
  const mode = env.STRIPE_MODE;
  if (env.VERCEL_ENV === 'preview' && mode === 'live') return { error: 'Le paiement réel est interdit sur une prévisualisation PATTEO.' };
  if (mode !== 'test' && mode !== 'live') return { error: 'STRIPE_MODE doit être exactement « test » ou « live ».' };
  const secretKey = mode === 'live' ? env.STRIPE_RESTRICTED_KEY_LIVE : env.STRIPE_SECRET_KEY;
  const publishableKey = mode === 'live' ? env.STRIPE_PUBLISHABLE_KEY_LIVE : env.STRIPE_PUBLISHABLE_KEY;
  const validSecret = mode === 'live'
    ? (secretKey?.startsWith('rk_live_') || secretKey?.startsWith('sk_live_'))
    : (secretKey?.startsWith('rk_test_') || secretKey?.startsWith('sk_test_'));
  const validPublishable = publishableKey?.startsWith(mode === 'live' ? 'pk_live_' : 'pk_test_');
  if (!validSecret || !validPublishable) return { error: `Les clés Stripe ${mode === 'live' ? 'live' : 'de test'} sont absentes ou invalides.` };
  return {
    stripe: new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION, maxNetworkRetries: 2, timeout: 15000 }),
    publishableKey,
    mode,
  };
}

export const getStripeTestConfig = (env = process.env) => {
  const config = getStripeConfig(env);
  return config.mode === 'test' ? config : { error: 'Cette opération nécessite une configuration Stripe de test.' };
};

export function normalizeCart(cart) {
  if (!Array.isArray(cart) || cart.length < 1 || cart.length > 15) return null;
  const normalized = new Map();
  for (const item of cart) {
    if (!item || !Object.hasOwn(PRICES, item.size) || !Object.hasOwn(COLORS, item.color) ||
        !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 10) return null;
    const key = `${item.color}:${item.size}`;
    const qty = (normalized.get(key)?.qty || 0) + item.qty;
    if (qty > 10) return null;
    normalized.set(key, { color: item.color, size: item.size, qty });
  }
  return [...normalized.values()];
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
export function makeIntegrationIdentifier(random = Math.random) {
  let suffix = '';
  for (let i = 0; i < 8; i++) suffix += LETTERS[Math.floor(random() * LETTERS.length)];
  return `patteo-${suffix}`;
}

export function makeOrderNumber(now = new Date(), random = Math.random) {
  const date = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
  const suffix = Array.from({ length: 8 }, () => LETTERS[Math.floor(random() * LETTERS.length)]).join('').toUpperCase();
  return `PT-${date}-${suffix}`;
}

export const formatCurrency = (cents, currency = 'EUR') => new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format((Number(cents) || 0) / 100);
export const formatEuro = cents => formatCurrency(cents, 'EUR');
