import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import createCheckout from '../api/create-checkout-session.js';
import sessionStatus from '../api/session-status.js';
import webhook, { confirmationEmail } from '../api/stripe-webhook.js';
import { sendMetaPurchase } from '../api/_lib/meta-capi.js';
import { formatCurrency, getStripeConfig, getStripeTestConfig, makeIntegrationIdentifier, makeOrderNumber, normalizeCart } from '../api/_lib/stripe-test.js';

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

const eventPayload = (type, livemode = false) => JSON.stringify({
  id: 'evt_test_pattee', object: 'event', api_version: '2026-08-26.dahlia',
  created: Math.floor(Date.now() / 1000), livemode, type,
  data: { object: { id: `cs_${livemode ? 'live' : 'test'}_pattee`, object: 'checkout.session', livemode } },
});

test('Stripe configuration strictly separates test and live key formats', () => {
  assert.match(getStripeTestConfig({ STRIPE_MODE: 'test', STRIPE_SECRET_KEY: 'sk_test_example', STRIPE_PUBLISHABLE_KEY: 'pk_test_example' }).stripe.constructor.name, /Stripe/);
  assert.match(getStripeConfig({ STRIPE_MODE: 'live', STRIPE_RESTRICTED_KEY_LIVE: 'rk_live_example', STRIPE_PUBLISHABLE_KEY_LIVE: 'pk_live_example' }).stripe.constructor.name, /Stripe/);
  assert.equal(getStripeTestConfig({ STRIPE_MODE: 'live', STRIPE_SECRET_KEY: 'sk_live_example', STRIPE_PUBLISHABLE_KEY: 'pk_live_example' }).error !== undefined, true);
  assert.equal(getStripeConfig({ STRIPE_MODE: 'live', STRIPE_RESTRICTED_KEY_LIVE: 'rk_test_example', STRIPE_PUBLISHABLE_KEY_LIVE: 'pk_live_example' }).error !== undefined, true);
  assert.equal(getStripeConfig({ STRIPE_MODE: 'live', STRIPE_RESTRICTED_KEY_LIVE: 'rk_live_example', STRIPE_PUBLISHABLE_KEY_LIVE: 'pk_test_example' }).error !== undefined, true);
  assert.equal(getStripeTestConfig({ STRIPE_MODE: 'test', STRIPE_SECRET_KEY: 'sk_live_example', STRIPE_PUBLISHABLE_KEY: 'pk_test_example' }).error !== undefined, true);
  assert.equal(getStripeTestConfig({ STRIPE_MODE: 'test', STRIPE_SECRET_KEY: 'sk_test_example', STRIPE_PUBLISHABLE_KEY: 'pk_live_example' }).error !== undefined, true);
  assert.equal(getStripeTestConfig({ STRIPE_SECRET_KEY: 'sk_test_example', STRIPE_PUBLISHABLE_KEY: 'pk_test_example' }).error !== undefined, true);
});

test('server-authoritative cart validation merges variants and rejects tampering', () => {
  assert.deepEqual(normalizeCart([{ color: 'gris', size: 'xs', qty: 2 }, { color: 'gris', size: 'xs', qty: 3 }]), [{ color: 'gris', size: 'xs', qty: 5 }]);
  assert.equal(normalizeCart([{ color: 'gris', size: 'xs', qty: 11 }]), null);
  assert.equal(normalizeCart([{ color: 'noir', size: 'xs', qty: 1 }]), null);
  assert.equal(normalizeCart([{ color: 'gris', size: 'xl', qty: 1, price: 1 }])[0].price, undefined);
  assert.equal(normalizeCart([]), null);
});

test('order and integration references are stable-format identifiers', () => {
  assert.equal(makeOrderNumber(new Date('2026-10-21T12:00:00Z'), () => 0), 'PT-20261021-AAAAAAAA');
  assert.equal(makeIntegrationIdentifier(() => 0), 'patteo-aaaaaaaa');
  assert.match(formatCurrency(2390, 'EUR'), /23,90/);
});

test('checkout creates a test-only session with server prices and order metadata', async () => {
  let created;
  const res = responseRecorder();
  await createCheckout({ method: 'POST', body: { cart: [{ color: 'jaune', size: 'xs', qty: 2 }] } }, res, {
    getConfig: () => ({ mode: 'test', publishableKey: 'pk_test_fixture', stripe: { checkout: { sessions: { create: async value => { created = value; return { id: 'cs_test_pattee', livemode: false, client_secret: 'cs_test_secret' }; } } } } }),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.publishableKey, 'pk_test_fixture');
  assert.equal(created.mode, 'payment');
  assert.equal(created.ui_mode, 'elements');
  assert.equal(created.line_items[0].price_data.unit_amount, 2390);
  assert.equal(created.line_items[0].quantity, 2);
  assert.match(created.integration_identifier, /^patteo-[a-z]{8}$/);
  assert.match(created.metadata.order_number, /^PT-2026\d{4}-[A-Z]{8}$/);
  assert.equal(created.metadata.meta_marketing_consent, undefined);
  assert.equal(res.body.metaEventId, null);
  assert.equal(created.shipping_address_collection.allowed_countries.includes('FR'), true);
});

test('checkout saves Meta matching data only after marketing consent', async () => {
  let created;
  const res = responseRecorder();
  await createCheckout({
    method: 'POST',
    headers: { 'x-forwarded-for': '203.0.113.42, 10.0.0.1', 'user-agent': 'Patteo-Test-Browser/1.0' },
    body: { cart: [{ color: 'gris', size: 'xs', qty: 1 }], marketingConsent: true, metaFbp: 'fbp-fixture', metaFbc: 'fbc-fixture' },
  }, res, {
    getConfig: () => ({ mode: 'test', publishableKey: 'pk_test_fixture', stripe: { checkout: { sessions: { create: async value => { created = value; return { id: 'cs_test_pattee', livemode: false, client_secret: 'cs_test_secret' }; } } } } }),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(created.metadata.meta_marketing_consent, 'granted');
  assert.equal(created.metadata.meta_client_ip_address, '203.0.113.42');
  assert.equal(created.metadata.meta_client_user_agent, 'Patteo-Test-Browser/1.0');
  assert.equal(created.metadata.meta_fbp, 'fbp-fixture');
  assert.equal(created.metadata.meta_fbc, 'fbc-fixture');
});

test('checkout rejects invalid cart before calling Stripe', async () => {
  let called = false;
  const res = responseRecorder();
  await createCheckout({ method: 'POST', body: { cart: [{ color: 'gris', size: 'xs', qty: 20 }] } }, res, {
    getConfig: () => ({ stripe: { checkout: { sessions: { create: async () => { called = true; } } } } }),
  });
  assert.equal(res.statusCode, 400);
  assert.equal(called, false);
});

test('checkout refuses any Checkout Session returned as live', async () => {
  const res = responseRecorder();
  await createCheckout({ method: 'POST', body: { cart: [{ color: 'gris', size: 'xl', qty: 1 }] } }, res, {
    getConfig: () => ({ publishableKey: 'pk_test_fixture', stripe: { checkout: { sessions: { create: async () => ({ id: 'cs_live_fixture', livemode: true, client_secret: 'should-not-escape' }) } } } }),
  });
  assert.equal(res.statusCode, 502);
  assert.equal(res.body.clientSecret, undefined);
});

test('return page reports unpaid sessions without line items or success data', async () => {
  let listItemsCalled = false;
  const res = responseRecorder();
  await sessionStatus({ method: 'GET', query: { session_id: 'cs_test_pattee' } }, res, {
    getConfig: () => ({ stripe: { checkout: { sessions: {
      retrieve: async () => ({ id: 'cs_test_pattee', livemode: false, status: 'open', payment_status: 'unpaid' }),
      listLineItems: async () => { listItemsCalled = true; return { data: [] }; },
    } } } }),
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { state: 'unpaid' });
  assert.equal(listItemsCalled, false);
});

test('return page builds a detailed recap only from a paid test session', async () => {
  const res = responseRecorder();
  await sessionStatus({ method: 'GET', query: { session_id: 'cs_test_pattee' } }, res, {
    getConfig: () => ({ stripe: { checkout: { sessions: {
      retrieve: async () => ({ id: 'cs_test_pattee', livemode: false, status: 'complete', payment_status: 'paid', amount_total: 7620, currency: 'eur', metadata: { order_number: 'PT-20261021-ABCDEFGH' } }),
      listLineItems: async () => ({ data: [
        { description: 'Tapis Patteo 30 × 50 cm — Gris galet', quantity: 2, amount_subtotal: 4780, amount_total: 4780 },
        { description: 'Tapis Patteo 50 × 80 cm — Bleu balade', quantity: 1, amount_subtotal: 2840, amount_total: 2840 },
      ] }),
    } } } }),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.state, 'paid');
  assert.equal(res.body.orderNumber, 'PT-20261021-ABCDEFGH');
  assert.equal(res.body.total, 7620);
  assert.equal(res.body.items.length, 2);
  assert.equal(res.body.items[0].quantity, 2);
  assert.equal(res.body.items[0].unitAmount, 2390);
  assert.equal(res.body.items[0].amountTotal, 4780);
  assert.match(res.body.items[1].unitLabel, /28,40/);
});

test('return page rejects live Checkout Session IDs in test mode', async () => {
  const res = responseRecorder();
  await sessionStatus({ method: 'GET', query: { session_id: 'cs_live_not_allowed' } }, res, { getConfig: () => ({ mode: 'test' }) });
  assert.equal(res.statusCode, 404);
});

test('return page refuses a live object even when passed a test-shaped session ID', async () => {
  const res = responseRecorder();
  await sessionStatus({ method: 'GET', query: { session_id: 'cs_test_fixture' } }, res, {
    getConfig: () => ({ stripe: { checkout: { sessions: { retrieve: async () => ({ id: 'cs_test_fixture', livemode: true, status: 'complete', payment_status: 'paid' }) } } } }),
  });
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.state, undefined);
});

test('webhook never emails failed/expired flows and is idempotent for paid sessions', async () => {
  const keys = ['STRIPE_MODE', 'STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  Object.assign(process.env, { STRIPE_MODE: 'test', STRIPE_SECRET_KEY: 'sk_test_fixture', STRIPE_PUBLISHABLE_KEY: 'pk_test_fixture', STRIPE_WEBHOOK_SECRET: 'whsec_fixture', RESEND_API_KEY: 're_fixture', RESEND_FROM_EMAIL: 'PATTEO <orders@example.test>' });
  const stripe = new Stripe('sk_test_fixture');
  const session = { id: 'cs_test_pattee', livemode: false, status: 'complete', payment_status: 'paid', amount_total: 2390, currency: 'eur', customer_details: { email: 'buyer@example.test' }, metadata: { order_number: 'PT-20261021-ABCDEFGH' } };
  let sent = 0;
  let resendStatus = 500;
  let retrieved = 0;
  stripe.checkout.sessions.retrieve = async () => { retrieved++; return session; };
  stripe.checkout.sessions.listLineItems = async () => ({ data: [{ description: 'Tapis Patteo XS — <Gris>', quantity: 1, amount_subtotal: 2390, amount_total: 2390 }] });
  stripe.checkout.sessions.update = async (_id, values) => { session.metadata = values.metadata; return session; };
  const getConfig = () => ({ stripe });
  const call = async type => {
    const payload = eventPayload(type);
    const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });
    const res = responseRecorder();
    await webhook({ method: 'POST', headers: { 'stripe-signature': signature }, body: Buffer.from(payload) }, res, {
      getConfig,
      sendEmail: async options => { sent++; assert.match(options.headers['Idempotency-Key'], /^patteo-confirmation\/cs_test_/); return new Response(JSON.stringify({ id: 'email_fixture' }), { status: resendStatus }); },
    });
    return res;
  };
  try {
    const failed = await call('checkout.session.async_payment_failed');
    assert.equal(failed.statusCode, 200);
    assert.equal(sent, 0);
    session.payment_status = 'unpaid';
    const unpaid = await call('checkout.session.completed');
    assert.equal(unpaid.statusCode, 200);
    assert.equal(unpaid.body.ignored, 'payment not paid');
    assert.equal(sent, 0);
    session.payment_status = 'paid';
    const retryable = await call('checkout.session.completed');
    assert.equal(retryable.statusCode, 502);
    assert.equal(session.metadata.confirmation_email_sent_at, undefined);
    assert.equal(sent, 1);
    resendStatus = 200;
    const first = await call('checkout.session.completed');
    assert.equal(first.statusCode, 200);
    assert.equal(first.body.emailed, true);
    assert.equal(sent, 2);
    assert.ok(session.metadata.confirmation_email_sent_at);
    const duplicate = await call('checkout.session.completed');
    assert.equal(duplicate.body.duplicate, true);
    assert.equal(sent, 2);
    assert.equal(retrieved, 4);
  } finally {
    for (const key of keys) previous[key] === undefined ? delete process.env[key] : process.env[key] = previous[key];
  }
});

test('webhook rejects invalid signatures before touching Stripe or Resend', async () => {
  const oldMode = process.env.STRIPE_MODE;
  const oldWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_MODE = 'test';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fixture';
  const stripe = new Stripe('sk_test_fixture');
  let touched = false;
  const payload = eventPayload('checkout.session.completed');
  const res = responseRecorder();
  try {
    await webhook({
      method: 'POST',
      headers: { 'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=${'0'.repeat(64)}` },
      body: Buffer.from(payload),
    }, res, {
      getConfig: () => ({ stripe }),
      sendEmail: async () => { touched = true; },
    });
    assert.equal(res.statusCode, 400);
    assert.equal(touched, false);
  } finally {
    oldMode === undefined ? delete process.env.STRIPE_MODE : process.env.STRIPE_MODE = oldMode;
    oldWebhookSecret === undefined ? delete process.env.STRIPE_WEBHOOK_SECRET : process.env.STRIPE_WEBHOOK_SECRET = oldWebhookSecret;
  }
});

test('live webhook sends a real-order confirmation only for a Stripe-paid live session', async () => {
  const keys = ['STRIPE_MODE', 'STRIPE_WEBHOOK_SECRET_LIVE', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  Object.assign(process.env, { STRIPE_MODE: 'live', STRIPE_WEBHOOK_SECRET_LIVE: 'whsec_live_fixture', RESEND_API_KEY: 're_fixture', RESEND_FROM_EMAIL: 'PATTEO <orders@example.test>' });
  const stripe = new Stripe('sk_test_fixture');
  const session = { id: 'cs_live_pattee', livemode: true, status: 'complete', payment_status: 'paid', amount_total: 2390, currency: 'eur', customer_details: { email: 'buyer@example.test' }, metadata: { order_number: 'PT-20261021-ABCDEFGH' } };
  stripe.checkout.sessions.retrieve = async () => session;
  stripe.checkout.sessions.listLineItems = async () => ({ data: [{ description: 'Tapis Patteo XS', quantity: 1, amount_subtotal: 2390, amount_total: 2390 }] });
  stripe.checkout.sessions.update = async () => session;
  let sent = 0;
  const payload = eventPayload('checkout.session.completed', true);
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET_LIVE });
  const res = responseRecorder();
  try {
    await webhook({ method: 'POST', headers: { 'stripe-signature': signature }, body: Buffer.from(payload) }, res, {
      getConfig: () => ({ mode: 'live', stripe }),
      sendEmail: async options => { sent++; assert.match(options.headers['Idempotency-Key'], /^patteo-confirmation\/cs_live_/); assert.match(JSON.parse(options.body).text, /Votre paiement a bien été reçu/); return new Response(JSON.stringify({ id: 'email_live_fixture' }), { status: 200 }); },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.emailed, true);
    assert.equal(sent, 1);
  } finally {
    for (const key of keys) previous[key] === undefined ? delete process.env[key] : process.env[key] = previous[key];
  }
});

test('Meta CAPI Purchase is consent-gated, deduplicated and sent only once for a live paid order', async () => {
  const keys = ['STRIPE_MODE', 'STRIPE_WEBHOOK_SECRET_LIVE', 'RESEND_API_KEY', 'META_CAPI_ACCESS_TOKEN'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  Object.assign(process.env, { STRIPE_MODE: 'live', STRIPE_WEBHOOK_SECRET_LIVE: 'whsec_live_fixture', RESEND_API_KEY: 're_fixture', META_CAPI_ACCESS_TOKEN: 'EAA_fixture' });
  const stripe = new Stripe('sk_test_fixture');
  const session = {
    id: 'cs_live_pattee', livemode: true, status: 'complete', payment_status: 'paid',
    amount_total: 4780, currency: 'eur', customer_details: { email: ' Buyer@Example.Test ' },
    metadata: { order_number: 'PT-20261021-ABCDEFGH', meta_marketing_consent: 'granted', meta_event_id: 'patteo_PT-20261021-ABCDEFGH', meta_fbp: 'fb.1.123.abc', meta_fbc: 'fb.1.123.click' },
  };
  const items = [{ description: 'Tapis Patteo XS — Gris galet', quantity: 2, amount_subtotal: 4780, amount_total: 4780 }];
  stripe.checkout.sessions.retrieve = async () => session;
  stripe.checkout.sessions.listLineItems = async () => ({ data: items });
  stripe.checkout.sessions.update = async (_id, values) => { session.metadata = values.metadata; return session; };
  let metaCalls = 0;
  let emailCalls = 0;
  const payload = eventPayload('checkout.session.completed', true);
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET_LIVE });
  const invoke = async () => {
    const res = responseRecorder();
    await webhook({ method: 'POST', headers: { 'stripe-signature': signature }, body: Buffer.from(payload) }, res, {
      getConfig: () => ({ mode: 'live', stripe }),
      sendMetaPurchase: async args => {
        metaCalls++;
        assert.equal(args.session.metadata.meta_event_id, 'patteo_PT-20261021-ABCDEFGH');
        assert.equal(args.accessToken, 'EAA_fixture');
        return { eventsReceived: 1 };
      },
      sendEmail: async () => { emailCalls++; return new Response(JSON.stringify({ id: 'email_fixture' }), { status: 200 }); },
    });
    return res;
  };
  try {
    const first = await invoke();
    assert.equal(first.statusCode, 200);
    assert.equal(first.body.metaSent, true);
    assert.ok(session.metadata.meta_capi_sent_at);
    const duplicate = await invoke();
    assert.equal(duplicate.body.duplicate, true);
    assert.equal(metaCalls, 1);
    assert.equal(emailCalls, 1);
  } finally {
    for (const key of keys) previous[key] === undefined ? delete process.env[key] : process.env[key] = previous[key];
  }
});

test('Meta CAPI Purchase hashes email and includes shared Pixel/CAPI event ID', async () => {
  let request;
  const result = await sendMetaPurchase({
    session: {
      id: 'cs_live_order', amount_total: 2840, currency: 'eur', customer_details: { email: 'Buyer@Example.Test' },
      metadata: { order_number: 'PT-20261021-ABCDEFGH', meta_marketing_consent: 'granted', meta_event_id: 'purchase-shared-id', meta_fbp: 'fbp-fixture', meta_fbc: 'fbc-fixture', meta_client_ip_address: '203.0.113.42', meta_client_user_agent: 'Patteo-Test-Browser/1.0' },
    },
    items: [{ description: 'Tapis Patteo L — Bleu balade', quantity: 1, amount_subtotal: 2840 }],
    accessToken: 'EAA_fixture',
    fetchImpl: async (url, options) => {
      request = { url, payload: JSON.parse(options.body) };
      return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
    },
  });
  assert.equal(result.eventsReceived, 1);
  const event = request.payload.data[0];
  assert.equal(event.event_name, 'Purchase');
  assert.equal(event.event_id, 'purchase-shared-id');
  assert.equal(event.user_data.em[0], 'f979a1713bf697bbbf1fc65fa352d2bb2376ee4ddf41d3bb07f9fb8f6126d1db');
  assert.equal(event.user_data.fbp, 'fbp-fixture');
  assert.equal(event.user_data.fbc, 'fbc-fixture');
  assert.equal(event.user_data.client_ip_address, '203.0.113.42');
  assert.equal(event.user_data.client_user_agent, 'Patteo-Test-Browser/1.0');
  assert.equal(event.custom_data.value, 28.4);
  assert.match(request.url, /2182463895952425\/events\?/);
});

test('Meta CAPI never transmits a purchase without an explicit saved marketing consent', async () => {
  let sent = false;
  const result = await sendMetaPurchase({
    session: { id: 'cs_live_no_consent', metadata: { order_number: 'PT-20261021-NOCONSENT', meta_marketing_consent: 'denied', meta_event_id: 'purchase-denied' } },
    items: [],
    accessToken: 'EAA_fixture',
    fetchImpl: async () => { sent = true; return new Response('{}'); },
  });
  assert.deepEqual(result, { skipped: true });
  assert.equal(sent, false);
});

test('confirmation email escapes item names and includes order and totals', () => {
  const email = confirmationEmail({ id: 'cs_test_id', amount_total: 2390, metadata: { order_number: 'PT-20261021-ABCDEFGH' } }, [
    { description: '<script>alert(1)</script>', quantity: 1, amount_subtotal: 2390, amount_total: 2390 },
  ]);
  assert.match(email.html, /PT-20261021-ABCDEFGH/);
  assert.doesNotMatch(email.html, /<script>/);
  assert.match(email.html, /&lt;script&gt;/);
  assert.match(email.text, /23,90/);
  assert.match(email.html, /Préparation : 1 à 3 jours\. Acheminement : 8 à 18 jours après expédition\./);
  assert.match(email.text, /8 à 18 jours après expédition/);
});
