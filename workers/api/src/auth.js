/**
 * JWT Auth Module — Cloudflare Workers compatible
 * Uses Web Crypto API (no Node.js crypto)
 */

const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' };

async function getKey(secret) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(secret), ALGORITHM, false, ['sign', 'verify']);
}

function base64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Sign a JWT token
 */
export async function signJwt(payload, secret, expiresInHours = 24) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: now, exp: now + expiresInHours * 3600 };

  const enc = new TextEncoder();
  const headerB64 = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(enc.encode(JSON.stringify(claims)));
  const data = `${headerB64}.${payloadB64}`;

  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));

  return `${data}.${base64url(sig)}`;
}

/**
 * Verify a JWT token, returns payload or null
 */
export async function verifyJwt(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const data = `${headerB64}.${payloadB64}`;

    const key = await getKey(secret);
    const enc = new TextEncoder();
    const sigBytes = base64urlDecode(sigB64);

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(data));
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64)));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Hash password using SHA-256 + salt (Workers-compatible, no bcrypt)
 */
export async function hashPassword(password) {
  const salt = base64url(crypto.getRandomValues(new Uint8Array(16)));
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(salt + password));
  return `${salt}:${base64url(hash)}`;
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password, stored) {
  const [salt] = stored.split(':');
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(salt + password));
  const check = `${salt}:${base64url(hash)}`;
  return check === stored;
}

/**
 * Auth middleware — extracts and verifies JWT from Authorization header
 */
export async function requireAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  return verifyJwt(token, env.JWT_SECRET);
}
