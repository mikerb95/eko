import type { APIRoute } from 'astro'
import { GITHUB_STATE_COOKIE, githubConfigurado, urlAutorizacion } from '../../../../lib/github'

export const prerender = false

// Arranca el acceso de desarrollo con GitHub: guarda un `state` aleatorio (y la
// página a la que volver) en una cookie corta y manda a GitHub a autorizar.
export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  if (!githubConfigurado()) return redirect('/admin/login?error=github_off')

  const raw = url.searchParams.get('next') || ''
  const next = /^\/(?!\/)/.test(raw) ? raw : '/admin'
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  const state = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

  cookies.set(GITHUB_STATE_COOKIE, JSON.stringify({ state, next }), {
    path: '/api/admin/github',
    httpOnly: true,
    // Lax sí viaja en la vuelta desde GitHub (navegación GET de primer nivel).
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: 60 * 10,
  })
  return redirect(urlAutorizacion(url.origin, state))
}
