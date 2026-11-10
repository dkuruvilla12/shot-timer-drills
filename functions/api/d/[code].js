// GET /api/d/:code: answer the stored blob. Contract: Documentation/Drill-Library-and-Links.md, section 2c.
// Unknown and expired codes give the same 404. Nothing is logged: no bodies, codes, keys or IP addresses.
import {
  baseHeaders, dayNumber, errorResponse, isValidCode, methodNotAllowed, needsRenewal, putOptions,
} from '../_lib.js';

export async function onRequestGet(context) {
  const { env, params } = context;
  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  if (!isValidCode(code)) return errorResponse(400);
  if (!env || !env.DRILLS) return errorResponse(503);

  let entry;
  try {
    entry = await env.DRILLS.getWithMetadata(code, { type: 'arrayBuffer' });
  } catch (e) {
    return errorResponse(503);
  }
  if (!entry || entry.value === null || entry.value === undefined) return errorResponse(404);

  // Sliding expiry: re-write with a fresh 366-day TTL at most once per 30 days, after the answer has gone out.
  const today = dayNumber(Date.now());
  if (needsRenewal(entry.metadata, today) && typeof context.waitUntil === 'function') {
    context.waitUntil(
      Promise.resolve().then(() => env.DRILLS.put(code, entry.value, putOptions(today))).catch(() => {})
    );
  }

  return new Response(entry.value, {
    status: 200,
    headers: baseHeaders({ 'Content-Type': 'application/octet-stream' }),
  });
}

export async function onRequest() {
  return methodNotAllowed('GET');
}
