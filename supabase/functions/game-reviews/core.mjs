// No request bodies, answers, IP addresses, or database errors are logged here.
export const GAME_IDS = Object.freeze([
  'chinese-first-words', 'chinese-picture-match', 'chinese-word-builder',
  'bilingual-memory', 'word-bridge', 'sentence-match',
  'addition_game', 'multiplication_game', 'shape_sorter_math', 'vocabulary_quiz',
  'chinese_character_quiz', 'chinese_game1', 'circuit-lab', 'english-ruins',
  'french-market', 'math-orbit', 'math1', 'math10', 'math234', 'math567',
  'math8', 'math9', 'math_addition_subtraction', 'math_chinese', 'math_english', 'math_visual_game'
]);
const MAX_BODY_BYTES = 4096;
const ORIGIN = 'https://caozixiong.github.io';
const encoder = new TextEncoder();
const normalAnswer = value => value.normalize('NFKC').trim().toLowerCase();

export async function answersMatch(answer, expected, cryptoImpl = crypto) {
  if (typeof answer !== 'string' || !answer.trim() || answer.length > 120 || !expected?.trim()) return false;
  const hashes = await Promise.all([answer, expected].map(value => cryptoImpl.subtle.digest('SHA-256', encoder.encode(normalAnswer(value)))));
  const a = new Uint8Array(hashes[0]), b = new Uint8Array(hashes[1]);
  let different = 0;
  for (let i = 0; i < a.length; i += 1) different |= a[i] ^ b[i];
  return different === 0;
}

async function boundedJSON(request) {
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) throw new Error('size');
  if (!request.body) throw new Error('body');
  const reader = request.body.getReader();
  const chunks = []; let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) { await reader.cancel(); throw new Error('size'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const data = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(data));
}

// Gateway headers are only a best-effort abuse signal, never authentication.
// The shared global cap still applies if a caller can alter an IP header.
function networkSignal(request) {
  return (request.headers.get('x-forwarded-for') || '').split(',')[0].trim().slice(0, 128) || 'unknown';
}

export function createReviewHandler({ env, fetchImpl = fetch, cryptoImpl = crypto, now = () => new Date() }) {
  function apiKey(modern, legacy) {
    try { const parsed = JSON.parse(env(modern) || '{}'); if (typeof parsed.default === 'string') return parsed.default; } catch { /* fail closed or use supplied legacy key */ }
    return env(legacy) || '';
  }
  const databaseURL = env('SUPABASE_URL') || '';
  const adminKey = apiKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');
  const readKey = apiKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY');
  const gateAnswer = env('REVIEW_GATE_ANSWER') || '';
  // Derive a domain-separated in-memory HMAC key from an existing high-entropy
  // server key. No additional user secret or persistent credential is created.
  const rateSecret = adminKey;
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(databaseURL) && adminKey && readKey && gateAnswer.trim() && rateSecret.length >= 32;
  let hmacKey;

  async function bucket(signal) {
    hmacKey ||= (async () => {
      const material = await cryptoImpl.subtle.importKey('raw', encoder.encode(rateSecret), 'HKDF', false, ['deriveKey']);
      return cryptoImpl.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: encoder.encode('kris-reviews-rate-v1'), info: encoder.encode(databaseURL) }, material, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['sign']);
    })();
    const data = encoder.encode(`${now().toISOString().slice(0, 10)}|${signal}`);
    return Array.from(new Uint8Array(await cryptoImpl.subtle.sign('HMAC', await hmacKey, data)), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  async function database(path, { key = adminKey, method = 'GET', body } = {}) {
    const headers = { apikey: key, 'Content-Type': 'application/json' };
    if (!key.startsWith('sb_')) headers.Authorization = `Bearer ${key}`;
    if (method === 'POST' && !path.startsWith('rpc/')) headers.Prefer = 'return=minimal';
    const response = await fetchImpl(`${databaseURL}/rest/v1/${path}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error('database unavailable');
    return response.status === 204 || response.headers.get('content-length') === '0' ? null : response.text().then(text => text ? JSON.parse(text) : null);
  }
  async function allow(scope, signal) {
    const result = await database('rpc/consume_review_limit', { method: 'POST', body: { p_bucket: await bucket(signal), p_scope: scope } });
    // Unexpected RPC responses must never remove the limit.
    return result === true;
  }

  return async function handle(request) {
    const origin = request.headers.get('origin');
    const cors = origin === ORIGIN ? { 'Access-Control-Allow-Origin': ORIGIN, Vary: 'Origin' } : {};
    const reply = (status, data, extra = {}) => new Response(JSON.stringify(data), { status, headers: {
      ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra
    } });
    if (request.method === 'OPTIONS') {
      if (origin !== ORIGIN) return reply(403, { code: 'origin' });
      return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Max-Age': '600' } });
    }
    if (origin && origin !== ORIGIN) return reply(403, { code: 'origin' });
    if (!['GET', 'POST'].includes(request.method)) return reply(405, { code: 'method' }, { Allow: 'GET, POST, OPTIONS' });
    if (!configured) return reply(503, { code: 'unavailable' });
    try {
      if (request.method === 'GET') {
        const game = new URL(request.url).searchParams.get('game');
        if (!GAME_IDS.includes(game)) return reply(400, { code: 'game' });
        // Use the public key deliberately: the approved-only RLS policy applies,
        // even if a future edit accidentally omits a status filter here.
        const rows = await database(`game_reviews?select=body,created_on&game_id=eq.${encodeURIComponent(game)}&order=created_on.desc&limit=50`, { key: readKey });
        if (!Array.isArray(rows)) throw new Error('invalid list');
        const reviews = rows.filter(row => typeof row.body === 'string' && typeof row.created_on === 'string').map(row => ({ body: row.body.slice(0, 500), date: row.created_on.slice(0, 10) }));
        return reply(200, { reviews });
      }
      if (origin !== ORIGIN) return reply(403, { code: 'origin' });
      if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) return reply(415, { code: 'content_type' });
      const signal = networkSignal(request);
      // Both gates are database-atomic, shared across function instances. The
      // global gate provides a bounded fallback against spoofed IP headers.
      if (!await allow('global', 'all-visitors') || !await allow('attempts', signal)) return reply(429, { code: 'rate_limited' }, { 'Retry-After': '600' });
      let data;
      try { data = await boundedJSON(request); } catch { return reply(400, { code: 'request' }); }
      if (!data || typeof data !== 'object' || Array.isArray(data) || !GAME_IDS.includes(data.game) || !['verify', 'submit'].includes(data.action)) return reply(400, { code: 'request' });
      if (!await answersMatch(data.answer, gateAnswer, cryptoImpl)) return reply(403, { code: 'answer' });
      if (data.action === 'verify') return reply(200, { ok: true });
      // Recheck the answer on EVERY submit; no client-side unlocked flag is trusted.
      if (typeof data.body !== 'string') return reply(400, { code: 'review' });
      const body = data.body.trim();
      if (!body || body.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(body)) return reply(400, { code: 'review' });
      if (!await allow('submissions', signal)) return reply(429, { code: 'rate_limited' }, { 'Retry-After': '3600' });
      // status comes from the database default; service_role cannot insert or
      // update that column. Unknown input keys are never copied to the row.
      await database('game_reviews', { method: 'POST', body: { game_id: data.game, body } });
      return reply(202, { ok: true, status: 'pending' });
    } catch {
      // Do not echo provider errors, secrets, input, or request URLs.
      return reply(503, { code: 'unavailable' });
    }
  };
}
