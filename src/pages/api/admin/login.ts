import type { APIRoute } from 'astro'
import { verifyCredentials, createSession, SESSION_COOKIE } from '../../../lib/auth'

export const prerender = false

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: any = {}
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Cuerpo inválido' }, 400)
  }
  const { username, password } = body
  if (!verifyCredentials(username, password)) {
    return json({ error: 'Usuario o contraseña incorrectos' }, 401)
  }
  const token = await createSession(username)
  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: 60 * 60 * 8,
  })
  return json({ ok: true })
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
}
