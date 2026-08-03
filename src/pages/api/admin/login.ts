import type { APIRoute } from 'astro'
import { createSession, SESSION_COOKIE } from '../../../lib/auth'
import { verifyLogin } from '../../../lib/users'
import { checkRateLimit, clientIp, resetRateLimit } from '../../../lib/rateLimit'
import { json } from '../../../lib/apiError'

export const prerender = false

export const POST: APIRoute = async (context) => {
  const { request, cookies } = context
  let fallbackIp = 'unknown'
  try {
    fallbackIp = context.clientAddress
  } catch {
    // clientAddress no disponible (p.ej. build estático); nos quedamos con el header.
  }
  const ip = clientIp(request, fallbackIp)
  const rateLimitKey = `login:${ip}`
  const { allowed, retryAfterSeconds } = checkRateLimit(rateLimitKey)
  if (!allowed) {
    return json(
      { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
      429,
      { 'Retry-After': String(retryAfterSeconds) },
    )
  }

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Cuerpo inválido' }, 400)
  }
  const { username, password } = body
  let user
  try {
    user = await verifyLogin(String(username ?? ''), String(password ?? ''))
  } catch (e: any) {
    // El mensaje original (p. ej. `ConnectionFailed(... cms.db: 14)`) delata el
    // motor de base, la ruta del archivo y que está caída. Solo va al log.
    console.error('[login] verifyLogin falló:', e?.stack || e?.message || e)
    return json({ error: 'No se pudo validar el acceso. Intenta de nuevo en un momento.' }, 500)
  }
  if (!user) {
    console.warn(`[login] intento fallido usuario="${String(username ?? '').slice(0, 60)}" ip=${ip}`)
    return json({ error: 'Usuario o contraseña incorrectos' }, 401)
  }
  resetRateLimit(rateLimitKey)
  const token = await createSession({ username: user.username, name: user.name, role: user.role })
  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: 60 * 60 * 8,
  })
  return json({ ok: true })
}
