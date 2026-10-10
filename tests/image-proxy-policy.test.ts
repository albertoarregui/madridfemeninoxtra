import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_PROXY_IMAGE_BYTES, permittedImageResponseType, permittedImageSource } from '../src/lib/image-proxy-policy';

test('proxy only fetches approved public HTTPS image origins', () => {
  for (const host of ['media.madridfemeninoxtra.com', 'images.ctfassets.net', 'downloads.ctfassets.net']) {
    assert.equal(permittedImageSource(`https://${host}/test.webp`)?.hostname, host);
  }
  for (const invalid of [
    'http://media.madridfemeninoxtra.com/file.webp',
    'http://localhost:3000/admin',
    'https://localhost/admin',
    'https://127.0.0.1/private',
    'https://media.madridfemeninoxtra.com.attacker.example/a',
    'https://evilmedia.madridfemeninoxtra.com/a',
    'https://example.com/a',
    'https://user:password@media.madridfemeninoxtra.com/a',
    'https://media.madridfemeninoxtra.com:8443/a',
    'file:///etc/passwd',
    '//media.madridfemeninoxtra.com/a',
  ]) assert.equal(permittedImageSource(invalid), null, invalid);
});

test('proxy rejects non-images and enforces a size ceiling', () => {
  assert.equal(permittedImageResponseType('image/webp'), true);
  assert.equal(permittedImageResponseType('image/jpeg; charset=binary'), true);
  assert.equal(permittedImageResponseType('text/html'), false);
  assert.equal(permittedImageResponseType('application/json'), false);
  assert.equal(MAX_PROXY_IMAGE_BYTES, 6 * 1024 * 1024);
});
