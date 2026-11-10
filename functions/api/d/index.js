// POST /api/d: store an encrypted blob under a new server-chosen code.
// Contract: Documentation/Drill-Library-and-Links.md, section 2c. Needs the KV namespace binding DRILLS.
// Nothing is logged: no bodies, codes, keys or IP addresses.
import {
  MAX_BLOB, MAX_CODE_TRIES, errorResponse, jsonResponse, makeCode, methodNotAllowed,
  putOptions, dayNumber, readBodyCapped, validateBlob,
} from '../_lib.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  // 415: only application/octet-stream (a parameter such as ;charset is ignored).
  const type = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/octet-stream') return errorResponse(415);

  // 411 without a Content-Length, 400 when it is not a plain number, 413 when it is over the cap.
  const lengthHeader = request.headers.get('Content-Length');
  if (lengthHeader === null) return errorResponse(411);
  if (!/^\d{1,15}$/.test(lengthHeader.trim())) return errorResponse(400);
  const declared = Number(lengthHeader.trim());
  if (declared > MAX_BLOB) return errorResponse(413);

  // The header can lie, so the cap is enforced while reading too.
  let read;
  try { read = await readBodyCapped(request.body, MAX_BLOB); } catch (e) { return errorResponse(400); }
  if (!read.ok) return errorResponse(413);
  const bytes = read.bytes;
  if (bytes.length !== declared) return errorResponse(400);
  if (!validateBlob(bytes)) return errorResponse(400);

  if (!env || !env.DRILLS) return errorResponse(503);
  try {
    for (let attempt = 0; attempt < MAX_CODE_TRIES; attempt++) {
      const code = makeCode();
      if (await env.DRILLS.get(code, { type: 'arrayBuffer' }) !== null) continue;   // already taken: draw again
      await env.DRILLS.put(code, bytes, putOptions(dayNumber(Date.now())));
      return jsonResponse(201, { code });
    }
  } catch (e) {
    return errorResponse(503);
  }
  return errorResponse(503);   // five collisions in a row
}

// Every other method: 405 with Allow (method-specific handlers take precedence over onRequest).
export async function onRequest() {
  return methodNotAllowed('POST');
}
