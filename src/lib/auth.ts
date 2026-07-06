// Lightweight session auth: HMAC-signed cookie, no external deps.
// El secreto viene de AUTH_SECRET; las credenciales viven en la tabla users (src/lib/users.ts).

export const SESSION_COOKIE = 'eko_admin'
const SESSION_TTL_SECONDS = 60 * 60 * 8 // 8h

function env(key: string, fallback = ''): string {
  return (import.meta.env as any)[key] || (process.env as any)[key] || fallback
}

function requireEnv(key: string, devFallback: string): string {
  const value = env(key)
  if (value) return value
  if (import.meta.env.PROD) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return devFallback
}

function getSecret(): string {
  return requireEnv('AUTH_SECRET', 'dev-insecure-secret-change-me')
}

// ---- base64url helpers ----
function b64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function b64urlToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
const enc = new TextEncoder()

async function hmac(data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(getSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return new Uint8Array(sig)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export interface Session {
  u: string // username
  n: string // display name
  r: string // role
}

export async function createSession(user: { username: string; name: string; role: string }): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({
    u: user.username,
    n: user.name,
    r: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  })))
  const sig = b64url(await hmac(payload))
  return `${payload}.${sig}`
}

export async function verifySession(token: string | undefined | null): Promise<Session | null> {
  if (!token || !token.includes('.')) return null
  const [payload, sig] = token.split('.')
  const expected = b64url(await hmac(payload))
  if (!timingSafeEqual(sig, expected)) return null
  try {
    const data = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload)))
    if (typeof data.exp !== 'number' || data.exp < Math.floor(Date.now() / 1000)) return null
    if (typeof data.u !== 'string' || typeof data.r !== 'string') return null // sesiones antiguas sin rol: re-login
    return { u: data.u, n: String(data.n || data.u), r: data.r }
  } catch {
    return null
  }
}

export function sessionCookie(token: string, secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

export function clearCookie(secure: boolean): string {
  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0']
  if (secure) parts.push('Secure')
  return parts.join('; ')
}
