// Isolated preview-only read-only configuration check; never returns credentials.
export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });
  if (process.env.VERCEL_ENV !== 'preview') return res.status(404).json({ error: 'Introuvable' });

  const stripeTestMode = process.env.STRIPE_MODE === 'test';
  const stripeTestSecret = /^(?:sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY || '');
  const stripeTestPublic = /^pk_test_/.test(process.env.STRIPE_PUBLISHABLE_KEY || '');
  const metaTestCode = process.env.META_TEST_EVENT_CODE === 'TEST62187';
  const metaCapiToken = Boolean(process.env.META_CAPI_ACCESS_TOKEN);

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    environment: 'preview',
    stripeTestMode,
    stripeTestSecret,
    stripeTestPublic,
    metaTestCode,
    metaCapiToken,
    readyForTestCheckout: stripeTestMode && stripeTestSecret && stripeTestPublic,
    readyForTestPurchase: stripeTestMode && stripeTestSecret && stripeTestPublic && metaTestCode && metaCapiToken,
    testPurchaseMethod: 'confirmed_stripe_test_checkout_then_session_status_capi',
  });
}
