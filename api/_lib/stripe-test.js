import Stripe from 'stripe';

export const STRIPE_API_VERSION = '2026-08-26.dahlia';
export const PRICES = Object.freeze({ l: 2490, xl: 2990 });
export const COLORS = Object.freeze({ gris: 'Gris classique (Silver Gray)', bleu: 'Snow Blue', rouge: 'Bright Red', brown: 'Brown', camel: 'Camel', champagne: 'Champagne', darkgray: 'Dark Gray', green: 'Glass Green' });
export const SUPPLIER_VARIANTS = Object.freeze({
  gris: Object.freeze({ l: Object.freeze({ sku: 'CJYD1640613105AZ', vid: '2609290756421616707' }), xl: Object.freeze({ sku: 'CJYD1640613107CX', vid: '2609290756421616708' }) }),
  bleu: Object.freeze({ l: Object.freeze({ sku: 'CJYD164061395QJ', vid: '2609290756421616701' }), xl: Object.freeze({ sku: 'CJYD164061397SH', vid: '2609290756421616702' }) }),
  rouge: Object.freeze({ l: Object.freeze({ sku: 'CJYD164061319SH', vid: '1603749659128901633' }), xl: Object.freeze({ sku: 'CJYD164061326ZA', vid: '1603749659141484544' }) }),
  brown: Object.freeze({ l: Object.freeze({ sku: 'CJYD164061316PK', vid: '1603749659124707329' }), xl: Object.freeze({ sku: 'CJYD164061323WD', vid: '1603749659133095938' }) }),
  camel: Object.freeze({ l: Object.freeze({ sku: 'CJYD164061315OL', vid: '1603749659124707328' }), xl: Object.freeze({ sku: 'CJYD164061322VE', vid: '1603749659133095937' }) }),
  champagne: Object.freeze({ l: Object.freeze({ sku: 'CJYD164061317QJ', vid: '1603749659124707330' }), xl: Object.freeze({ sku: 'CJYD164061324XC', vid: '1603749659137290240' }) }),
  darkgray: Object.freeze({ l: Object.freeze({ sku: 'CJYD164061314NM', vid: '1603749659120513026' }), xl: Object.freeze({ sku: 'CJYD164061321UF', vid: '1603749659133095936' }) }),
  green: Object.freeze({ l: Object.freeze({ sku: 'CJYD164061318RI', vid: '1603749659128901632' }), xl: Object.freeze({ sku: 'CJYD164061325YB', vid: '1603749659137290241' }) }),
});
export function getVariantPrice(color, size) {
  if (!Object.hasOwn(COLORS, color) || !Object.hasOwn(PRICES, size)) return null;
  if (['gris', 'bleu'].includes(color)) return size === 'l' ? 2090 : 2490;
  return PRICES[size];
}
export const DIMENSIONS = Object.freeze({ l: '50 × 80 cm', xl: '60 × 90 cm' });

// Each same-size pair of Silver Gray / Snow Blue gets one unit at half price.
// Quantities and variants are validated before this server-owned calculation.
export function priceCart(cart) {
  const discountLeft = Object.fromEntries(Object.keys(PRICES).map(size => [size,
    Math.floor(cart.filter(i => i.size === size && ['gris','bleu'].includes(i.color)).reduce((n,i) => n+i.qty,0)/2)]));
  const lines = [];
  for (const item of cart) {
    const regular = getVariantPrice(item.color,item.size);
    const discounted = ['gris','bleu'].includes(item.color) ? Math.min(item.qty,discountLeft[item.size]) : 0;
    discountLeft[item.size] -= discounted;
    if (item.qty > discounted) lines.push({...item,qty:item.qty-discounted,unitAmount:regular,duo:false});
    if (discounted) lines.push({...item,qty:discounted,unitAmount:regular/2,duo:true});
  }
  const subtotal = cart.reduce((n,i)=>n+getVariantPrice(i.color,i.size)*i.qty,0);
  const total = lines.reduce((n,i)=>n+i.unitAmount*i.qty,0);
  return {lines,subtotal,total,savings:subtotal-total};
}

export function getStripeConfig(env = process.env) {
  const mode = env.STRIPE_MODE;
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
