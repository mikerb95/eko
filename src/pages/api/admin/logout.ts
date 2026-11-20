import type { APIRoute } from 'astro'
import { SESSION_COOKIE, verifySession } from '../../../lib/auth'
import { anotar } from '../../../lib/bitacora'

export const prerender = false

export const POST: APIRoute = async ({ cookies }) => {
  const s = await verifySession(cookies.get(SESSION_COOKIE)?.value)
  if (s) await anotar('logout', { quien: s.u })
  cookies.delete(SESSION_COOKIE, { path: '/' })
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } })
}
