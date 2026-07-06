import { defineMiddleware } from 'astro:middleware'
import { SESSION_COOKIE, verifySession } from './lib/auth'

const PUBLIC_ADMIN_PATHS = new Set(['/admin/login'])
const PUBLIC_API_PATHS = new Set(['/api/admin/login'])

// Autorización por rol. GET (lectura) lo permite cualquier sesión;
// las escrituras se restringen por área.
const WRITE_RULES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: '/api/admin/users', roles: ['admin'] },
  { prefix: '/api/admin/recolecciones', roles: ['admin', 'operaciones', 'logistica'] },
  { prefix: '/api/admin/posts', roles: ['admin', 'consultor'] },
  { prefix: '/api/admin/normativas', roles: ['admin', 'consultor'] },
]

function canWrite(pathname: string, role: string): boolean {
  const rule = WRITE_RULES.find((r) => pathname.startsWith(r.prefix))
  if (!rule) return role === 'admin'
  return rule.roles.includes(role)
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url

  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/')
  const isAdminApi = pathname.startsWith('/api/admin')

  if (!isAdminPage && !isAdminApi) return next()
  if (PUBLIC_ADMIN_PATHS.has(pathname) || PUBLIC_API_PATHS.has(pathname)) return next()

  const token = context.cookies.get(SESSION_COOKIE)?.value
  const session = await verifySession(token)

  if (!session) {
    if (isAdminApi) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    }
    return context.redirect('/admin/login')
  }

  const method = context.request.method.toUpperCase()
  if (isAdminApi && method !== 'GET' && method !== 'HEAD' && !canWrite(pathname, session.r)) {
    return new Response(JSON.stringify({ error: 'Tu rol no tiene permiso para esta acción' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    })
  }
  // El listado de usuarios expone información sensible: solo admin, incluso en GET.
  if (pathname.startsWith('/api/admin/users') && session.r !== 'admin') {
    return new Response(JSON.stringify({ error: 'Solo administradores' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    })
  }

  context.locals.user = session.n
  context.locals.username = session.u
  context.locals.role = session.r
  return next()
})
