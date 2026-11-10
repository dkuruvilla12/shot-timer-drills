// Shared, pure logic for the short-link API (Documentation/Drill-Library-and-Links.md, section 2c).
// No Cloudflare bindings in here, so it can be tested with plain Request objects and an in-memory KV.
// This file exports no onRequest* handler, so Pages creates no route for it.

export const ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';   // 32 characters: lowercase Crockford base32
export const CODE_LENGTH = 8;
export const CODE_RE = /^[0-9a-hjkmnp-tv-z]{8}$/;
export const MIN_BLOB = 30;
export const MAX_BLOB = 65536;
export const BLOB_VERSION = 0x01;
export const TTL_SECONDS = 366 * 86400;        // a blob expires 366 days after it was last opened
export const RENEW_AFTER_DAYS = 30;            // a GET re-writes the entry at most once per 30 days
export const MAX_CODE_TRIES = 5;
const DAY_MS = 86400000;

// Error bodies are generic on purpose: nothing about the request is echoed back.
const MESSAGES = {
  400: 'Bad request.',
  404: 'Not found.',
  405: 'Method not allowed.',
  411: 'Length required.',
  413: 'Payload too large.',
  415: 'Unsupported media type.',
  503: 'Service unavailable.',
};

// No cookies and no CORS headers are ever set. Responses are never cached.
export function baseHeaders(extra) {
  return Object.assign({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, extra || {});
}

export function jsonResponse(status, body, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: baseHeaders(Object.assign({ 'Content-Type': 'application/json' }, extraHeaders || {})),
  });
}

export function errorResponse(status, extraHeaders) {
  return jsonResponse(status, { error: MESSAGES[status] || 'Error.' }, extraHeaders);
}

export function methodNotAllowed(allow) {
  return errorResponse(405, { Allow: allow });
}

// A blob is valid when its length is 30...65,536 bytes and its first byte is 0x01 (version).
export function validateBlob(bytes) {
  return bytes instanceof Uint8Array && bytes.length >= MIN_BLOB && bytes.length <= MAX_BLOB && bytes[0] === BLOB_VERSION;
}

export function isValidCode(code) {
  return typeof code === 'string' && CODE_RE.test(code);
}

// 8 characters of ALPHABET. 32 divides 256, so `byte & 31` is uniform (no modulo bias).
export function makeCode(randomFill) {
  const fill = randomFill || ((a) => crypto.getRandomValues(a));
  const bytes = fill(new Uint8Array(CODE_LENGTH));
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[bytes[i] & 31];
  return code;
}

// Days since the Unix epoch.
export function dayNumber(nowMs) {
  return Math.floor(nowMs / DAY_MS);
}

// True when the entry has not been touched for 30 days (or has no usable `touched` metadata).
export function needsRenewal(metadata, today) {
  const touched = metadata && metadata.touched;
  if (typeof touched !== 'number' || !isFinite(touched)) return true;
  return today - touched >= RENEW_AFTER_DAYS;
}

export function putOptions(today) {
  return { expirationTtl: TTL_SECONDS, metadata: { touched: today } };
}

// Reads at most `cap` bytes. Resolves { ok: true, bytes } or { ok: false, tooLarge: true } as soon as more than `cap`
// bytes have arrived, cancelling the stream, so a client that lies about Content-Length cannot make this buffer more.
export async function readBodyCapped(body, cap) {
  if (!body) return { ok: true, bytes: new Uint8Array(0) };
  const reader = body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const r = await reader.read();
    if (r.done) break;
    total += r.value.length;
    if (total > cap) {
      try { await reader.cancel(); } catch (e) { /* ignore */ }
      return { ok: false, tooLarge: true };
    }
    chunks.push(r.value);
  }
  const bytes = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) { bytes.set(c, at); at += c.length; }
  return { ok: true, bytes };
}
