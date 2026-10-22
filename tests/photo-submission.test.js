import test from 'node:test';
import assert from 'node:assert/strict';
import photoSubmission, { REVIEW_INBOX } from '../api/photo-submission.js';

function responseRecorder() {
  return {
    statusCode: 200, body: null, headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]).toString('base64');
const validBody = overrides => ({ name: 'lea', review: 'Très pratique après les balades.', consent: true, ...overrides });

test('moderated customer contribution sends text and an optional checked photo to the review inbox', async () => {
  const res = responseRecorder();
  let sent;
  await photoSubmission({
    method: 'POST', headers: { host: 'patteo.vercel.app', origin: 'https://patteo.vercel.app', 'x-forwarded-for': 'photo-test-unique-1' },
    body: validBody({ photo: { type: 'image/jpeg', data: jpeg } }),
  }, res, {
    resendKey: 're_test_fixture', randomUUID: () => 'submission-fixture',
    sendEmail: async payload => { sent = JSON.parse(payload.body); return new Response(JSON.stringify({ id: 'email-fixture' })); },
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { received: true });
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.deepEqual(sent.to, [REVIEW_INBOX]);
  assert.equal(sent.attachments[0].filename, 'photo-client.jpg');
  assert.equal(Buffer.from(sent.attachments[0].content, 'base64').toString('hex'), 'ffd8ff00');
  assert.match(sent.text, /Rien n’est publié automatiquement/);
  assert.match(sent.html, /lea/);
});

test('photo contribution rejects non-image bytes, missing consent, and empty content', async t => {
  for (const [label, body] of [
    ['bad file signature', validBody({ photo: { type: 'image/jpeg', data: Buffer.from('not an image').toString('base64') } })],
    ['missing consent', validBody({ consent: false })],
    ['empty contribution', validBody({ review: '', photo: undefined })],
  ]) {
    await t.test(label, async () => {
      const res = responseRecorder();
      let sent = false;
      await photoSubmission({ method: 'POST', headers: { 'x-forwarded-for': `invalid-${label}` }, body }, res, {
        resendKey: 're_test_fixture', sendEmail: async () => { sent = true; },
      });
      assert.equal(res.statusCode, 400);
      assert.equal(sent, false);
    });
  }
});

test('photo contribution rejects cross-origin requests and throttles repeated submissions', async () => {
  const crossOrigin = responseRecorder();
  await photoSubmission({ method: 'POST', headers: { host: 'patteo.vercel.app', origin: 'https://attacker.example' }, body: validBody() }, crossOrigin, {});
  assert.equal(crossOrigin.statusCode, 403);

  const headers = { host: 'patteo.vercel.app', origin: 'https://patteo.vercel.app', 'x-forwarded-for': 'photo-test-unique-throttle' };
  const sendEmail = async () => new Response(JSON.stringify({ id: 'email-fixture' }));
  const first = responseRecorder();
  await photoSubmission({ method: 'POST', headers, body: validBody() }, first, { resendKey: 're_test_fixture', sendEmail });
  const second = responseRecorder();
  await photoSubmission({ method: 'POST', headers, body: validBody() }, second, { resendKey: 're_test_fixture', sendEmail });
  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 429);
});
