/**
 * crypto.randomUUID only exists on https or localhost. When the phone opens the
 * dev server over Wi-Fi it is plain http, so fall back to random bytes there.
 */
export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
