import { createHash } from 'node:crypto';

export const META_PIXEL_ID = '2182463895952425';
export const META_GRAPH_API_VERSION = 'v25.0';

const sha256 = value => createHash('sha256').update(value).digest('hex');

export async function sendMetaPurchase({ session, items, accessToken, fetchImpl = fetch }) {
  const metadata = session.metadata || {};
  if (!accessToken || metadata.meta_marketing_consent !== 'granted' || !metadata.meta_event_id) {
    return { skipped: true };
  }

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
    console.error('PATTEO: Meta Conversions API rejected a paid Purchase event.', response.status);
    throw new Error('Meta Conversions API rejected Purchase event');
  }
  const result = await response.json();
  if (Number(result.events_received) < 1) {
    console.error('PATTEO: Meta Conversions API did not accept the paid Purchase event.');
    throw new Error('Meta Conversions API did not accept Purchase event');
  }
  return { eventId: metadata.meta_event_id, eventsReceived: Number(result.events_received) };
}
