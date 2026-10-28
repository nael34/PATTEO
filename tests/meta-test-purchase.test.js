import test from 'node:test';
import assert from 'node:assert/strict';
import { getMetaTestEventCode, sendMetaPurchase } from '../api/_lib/meta-capi.js';
import webhook from '../api/stripe-webhook.js';

test('Meta test purchase requires a matching session marker and never sends a test code in live mode', async () => {
  assert.equal(getMetaTestEventCode('live', { META_TEST_EVENT_CODE: 'TEST123' }), null);
  assert.equal(getMetaTestEventCode('test', { META_TEST_EVENT_CODE: 'invalid' }), null);
  assert.equal(getMetaTestEventCode('test', { META_TEST_EVENT_CODE: 'TEST123' }), 'TEST123');
  const session = { id: 'cs_test_fixture', livemode: false, amount_total: 2390, currency: 'eur',
    metadata: { meta_marketing_consent: 'granted', meta_event_id: 'test-purchase', meta_test_event_code: 'TEST123' } };
  let sent = 0;
  const fetchImpl = async (_url, options) => {
    sent++;
    const payload = JSON.parse(options.body);
    assert.equal(payload.test_event_code, 'TEST123');
    assert.equal(payload.data[0].event_name, 'Purchase');
    assert.equal(payload.data[0].event_id, 'test-purchase');
    return new Response('{"events_received":1}');
  };
  assert.deepEqual(await sendMetaPurchase({ session, items: [], accessToken: 'fixture', fetchImpl }), { skipped: true });
  assert.deepEqual(await sendMetaPurchase({ session, items: [], accessToken: 'fixture', testEventCode: 'TEST456', fetchImpl }), { skipped: true });
  await sendMetaPurchase({ session, items: [], accessToken: 'fixture', testEventCode: 'TEST123', fetchImpl });
  assert.equal(sent, 1);
  await assert.rejects(sendMetaPurchase({ session: { ...session, livemode: true }, items: [], accessToken: 'fixture', testEventCode: 'TEST123', fetchImpl }));
  await assert.rejects(sendMetaPurchase({ session, items: [], accessToken: 'fixture', testEventCode: 'TEST123', fetchImpl: async () => new Response('{}') }));
});

test('paid test webhook emits only explicitly marked test events, skips unpaid sessions, and deduplicates retries', async () => {
  const envKeys = ['META_TEST_EVENT_CODE', 'META_CAPI_ACCESS_TOKEN', 'STRIPE_WEBHOOK_SECRET'];
  const previous = Object.fromEntries(envKeys.map(k => [k, process.env[k]]));
  Object.assign(process.env, { META_TEST_EVENT_CODE: 'TEST123', META_CAPI_ACCESS_TOKEN: 'fixture', STRIPE_WEBHOOK_SECRET: 'whsec_fixture' });
  try {
    for (const scenario of [
      { marker: undefined, paid: true, expected: 0 },
      { marker: 'TEST456', paid: true, expected: 0 },
      { marker: 'TEST123', paid: false, expected: 0 },
      { marker: 'TEST123', paid: true, expected: 1 },
    ]) {
      let calls = 0;
      const session = { id: 'cs_test_fixture', livemode: false, status: 'complete', payment_status: scenario.paid ? 'paid' : 'unpaid',
        metadata: { confirmation_email_sent_at: 'fixture', meta_marketing_consent: 'granted', meta_event_id: 'test-event', meta_test_event_code: scenario.marker } };
      const stripe = { webhooks: { constructEvent: () => ({ type: 'checkout.session.completed', livemode: false, data: { object: { id: session.id } } }) },
        checkout: { sessions: { retrieve: async () => session, listLineItems: async () => ({ data: [] }), update: async (_id, values) => { session.metadata = values.metadata; } } } };
      const invoke = async () => {
        const res = { status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } };
        await webhook({ method: 'POST', headers: {}, body: Buffer.from('fixture') }, res, { getConfig: () => ({ mode: 'test', stripe }),
          sendMetaPurchase: async args => { calls++; assert.equal(args.testEventCode, 'TEST123'); return { eventsReceived: 1 }; } });
        assert.equal(res.statusCode, 200);
      };
      await invoke();
      await invoke();
      assert.equal(calls, scenario.expected);
    }
  } finally {
    for (const k of envKeys) previous[k] === undefined ? delete process.env[k] : process.env[k] = previous[k];
  }
});
