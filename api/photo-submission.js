const REVIEW_INBOX = 'commandes@montpellier-ia.dev';
const MAX_IMAGE_BYTES = 2_500_000;
const recentSubmissions = new Map();

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function validImage(buffer, type) {
  if (type === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (type === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === 'image/webp') return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

export default async function handler(req, res, dependencies = {}) {
  res.setHeader?.('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const origin = req.headers?.origin;
  const host = req.headers?.host;
  if (origin && host) {
    try { if (new URL(origin).host !== host) return res.status(403).json({ error: 'Origine non autorisée' }); }
    catch { return res.status(403).json({ error: 'Origine non autorisée' }); }
  }

  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: 'Formulaire invalide' });
  if (typeof body.website === 'string' && body.website.trim()) return res.status(200).json({ received: true });

  const now = Date.now();
  for (const [ip, timestamp] of recentSubmissions) if (timestamp < now - 10 * 60_000) recentSubmissions.delete(ip);
  const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (recentSubmissions.has(ip) && recentSubmissions.get(ip) > now - 60_000) return res.status(429).json({ error: 'Une contribution vient déjà d’être envoyée. Réessayez dans une minute.' });

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const review = typeof body.review === 'string' ? body.review.trim() : '';
  if (name.length < 2 || name.length > 50 || /[<>\r\n]/.test(name)) return res.status(400).json({ error: 'Indiquez un prénom valide (2 à 50 caractères).' });
  if (review.length > 1200) return res.status(400).json({ error: 'Votre avis est trop long (1 200 caractères maximum).' });
  if (!review && !body.photo) return res.status(400).json({ error: 'Ajoutez un avis ou une photo.' });
  if (body.consent !== true) return res.status(400).json({ error: 'Le consentement à la vérification est nécessaire.' });

  let attachment;
  if (body.photo != null) {
    if (typeof body.photo !== 'object' || body.photo.type !== 'image/jpeg' || typeof body.photo.data !== 'string' || body.photo.data.length > Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 8 || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.photo.data)) {
      return res.status(400).json({ error: 'Photo invalide. Envoyez une image JPG, PNG ou WebP.' });
    }
    const image = Buffer.from(body.photo.data, 'base64');
    if (image.length > MAX_IMAGE_BYTES || !validImage(image, body.photo.type)) return res.status(400).json({ error: 'Photo invalide ou trop volumineuse.' });
    attachment = { filename: 'photo-client.jpg', content: image.toString('base64'), content_type: 'image/jpeg' };
  }

  const resendKey = dependencies.resendKey ?? process.env.RESEND_API_KEY;
  if (!resendKey?.startsWith('re_')) return res.status(503).json({ error: 'Le formulaire est momentanément indisponible.' });

  const id = (dependencies.randomUUID || (() => crypto.randomUUID()))();
  const html = `<h2>Contribution client à vérifier — ${id}</h2><p><strong>Prénom :</strong> ${escapeHtml(name)}</p><p><strong>Avis :</strong><br>${escapeHtml(review || '(aucun texte)')}</p><p>Consentement de vérification et publication : oui.</p><p>Rien n’est publié automatiquement. Examinez le contenu et ajoutez-le au site uniquement si vous l’approuvez.</p>`;
  const emailPayload = {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `patteo-photo-submission/${id}` },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'PATTEO <commandes@montpellier-ia.dev>',
      to: [REVIEW_INBOX],
      subject: `PATTEO · contribution à vérifier · ${id}`,
      html,
      text: `Contribution client à vérifier — ${id}\nPrénom : ${name}\nAvis : ${review || '(aucun texte)'}\nConsentement : oui.\nRien n’est publié automatiquement.`,
      ...(attachment ? { attachments: [attachment] } : {}),
    }),
  };
  try {
    const send = dependencies.sendEmail || (payload => fetch('https://api.resend.com/emails', payload));
    const response = await send(emailPayload);
    if (!response.ok) {
      console.error('PATTEO: Resend rejected a photo contribution.', response.status);
      return res.status(502).json({ error: 'Envoi impossible pour le moment. Réessayez plus tard.' });
    }
    const result = await response.json();
    if (!result?.id) return res.status(502).json({ error: 'Confirmation d’envoi indisponible. Réessayez plus tard.' });
    recentSubmissions.set(ip, now);
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('PATTEO: photo contribution delivery failed.', error?.name || 'provider error');
    return res.status(502).json({ error: 'Envoi impossible pour le moment. Réessayez plus tard.' });
  }
}

export { MAX_IMAGE_BYTES, REVIEW_INBOX, validImage };
