import type { APIRoute } from 'astro'
import { createSession, SESSION_COOKIE, SESSION_TTL_SECONDS } from '../../../../lib/auth'
import { type CuentaGithub, cuentaDesdeCodigo, esDesarrollador, GITHUB_STATE_COOKIE, githubConfigurado } from '../../../../lib/github'
import { clientIp } from '../../../../lib/rateLimit'
import { anotar } from '../../../../lib/bitacora'

export const prerender = false

export const GET: APIRoute = async (context) => {
  const { url, cookies, request, redirect } = context
  let fallbackIp = 'unknown'
  try {
    fallbackIp = context.clientAddress
  } catch {}
  const ip = clientIp(request, fallbackIp)

  const guardado = cookies.get(GITHUB_STATE_COOKIE)?.value
  cookies.delete(GITHUB_STATE_COOKIE, { path: '/api/admin/github' })
  if (!githubConfigurado()) return redirect('/admin/login?error=github_off')

  let esperado: { state?: string; next?: string } = {}
  try {
    esperado = JSON.parse(guardado || '{}')
  } catch {}
  const state = url.searchParams.get('state') || ''
  const code = url.searchParams.get('code') || ''
  // Sin state que coincida, la vuelta no la pidió este navegador (CSRF de login).
  if (!code || !esperado.state || state !== esperado.state) return redirect('/admin/login?error=github')

  let cuenta: CuentaGithub | null = null
  try {
    cuenta = await cuentaDesdeCodigo(code, url.origin)
  } catch (e: any) {
    console.error('[github] intercambio falló:', e?.message || e)
  }
  if (!cuenta) return redirect('/admin/login?error=github')

  if (!esDesarrollador(cuenta)) {
    console.warn(`[github] cuenta no autorizada login="${cuenta.login}" id=${cuenta.id} ip=${ip}`)
    await anotar('login_fallido', { quien: `github:${cuenta.login}`, detalle: { id: cuenta.id }, ip })
    return redirect('/admin/login?error=github_denegado')
  }

  const username = `github:${cuenta.login.toLowerCase()}`
  const token = await createSession({ username, name: cuenta.name, role: 'admin' })
  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: SESSION_TTL_SECONDS,
  })
  await anotar('login', { quien: username, detalle: { rol: 'admin', via: 'github', id: cuenta.id, agente: request.headers.get('user-agent') ?? '' }, ip })

  const next = typeof esperado.next === 'string' && /^\/(?!\/)/.test(esperado.next) ? esperado.next : '/admin'
  return redirect(next)
}
