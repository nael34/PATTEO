import { createHash } from 'node:crypto';

export const META_PIXEL_ID = '2182463895952425';
export const META_GRAPH_API_VERSION = 'v25.0';

const sha256 = value => createHash('sha256').update(value).digest('hex');

export function getMetaTestEventCode(mode, env = process.env) {
  const code = env.META_TEST_EVENT_CODE;
  return mode === 'test' && typeof code === 'string' && /^TEST[A-Z0-9_-]{1,80}$/.test(code) ? code : null;
}

export async function sendMetaPurchase({ session, items, accessToken, testEventCode = null, fetchImpl = fetch }) {
  const metadata = session.metadata || {};
  if (!accessToken || metadata.meta_marketing_consent !== 'granted' || !metadata.meta_event_id) {
    return { skipped: true };
  }
  // Test payments must never be reported as production purchases.
  if (session.livemode === false && (!testEventCode || metadata.meta_test_event_code !== testEventCode)) return { skipped: true };
  if (testEventCode && (session.livemode !== false || !/^TEST[A-Z0-9_-]{1,80}$/.test(testEventCode))) throw new Error('Invalid Meta test purchase configuration');

  const email = String(session.customer_details?.email || session.customer_email || '').trim().toLowerCase();
  const userData = {};
  if (email) userData.em = [sha256(email)];
  if (metadata.meta_fbp) userData.fbp = metadata.meta_fbp;
  if (metadata.meta_fbc) userData.fbc = metadata.meta_fbc;
  if (metadata.meta_client_ip_address) userData.client_ip_address = metadata.meta_client_ip_address;
  if (metadata.meta_client_user_agent) userData.client_user_agent = metadata.meta_client_user_agent;

  const contents = items.map(item => ({
    id: String(item.description || 'Article Patteo').slice(0, 160),
    quantity: Math.max(1, Number(item.quantity || 1)),
    item_price: Math.round(Number(item.amount_subtotal || 0) / Math.max(1, Number(item.quantity || 1))) / 100,
  }));
  const payload = {
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: metadata.meta_event_id,
      action_source: 'website',
      event_source_url: 'https://patteo.vercel.app/commande/',
      user_data: userData,
      custom_data: {
        currency: String(session.currency || 'eur').toUpperCase(),
        value: Number(session.amount_total || 0) / 100,
        order_id: String(metadata.order_number || session.id),
        content_type: 'product',
        content_ids: contents.map(item => item.id),
        contents,
        num_items: contents.reduce((count, item) => count + item.quantity, 0),
      },
    }],
  };

  const url = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(accessToken)}`;
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let failure;
    try { failure = (await response.json())?.error; } catch {}
    // Log only numeric provider codes, never tokens, payloads or customer data.
    console.error('PATTEO: Meta Conversions API rejected a paid Purchase event.', response.status,
      'code', Number(failure?.code) || 0, 'subcode', Number(failure?.error_subcode) || 0);
    throw new Error('Meta Conversions API rejected Purchase event');
  }
  const result = await response.json();
  if (!(Number(result.events_received) >= 1)) {
    console.error('PATTEO: Meta Conversions API did not accept the paid Purchase event.');
    throw new Error('Meta Conversions API did not accept Purchase event');
  }
  return { eventId: metadata.meta_event_id, eventsReceived: Number(result.events_received) };
}
