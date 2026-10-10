/** Only public, explicitly approved image origins can be fetched server-side. */
export const ALLOWED_IMAGE_HOSTS = new Set([
  'media.madridfemeninoxtra.com',
  'images.ctfassets.net',
  'downloads.ctfassets.net',
]);

export const MAX_PROXY_IMAGE_BYTES = 6 * 1024 * 1024;

export function permittedImageSource(input: string): URL | null {
  try {
    const url = new URL(input);
    if (
      url.protocol !== 'https:' ||
      !ALLOWED_IMAGE_HOSTS.has(url.hostname.toLowerCase()) ||
      url.port ||
      url.username ||
      url.password
    ) return null;
    return url;
  } catch {
    return null;
  }
}

export function permittedImageResponseType(value: string | null): boolean {
  if (!value) return false;
  return /^image\/(?:avif|gif|jpeg|png|webp)(?:\s*;|\s*$)/i.test(value);
}
