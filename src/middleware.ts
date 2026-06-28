import { defineMiddleware } from 'astro:middleware'
import { SESSION_COOKIE, verifySession } from './lib/auth'

const PUBLIC_ADMIN_PATHS = new Set(['/admin/login'])
const PUBLIC_API_PATHS = new Set(['/api/admin/login'])

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

  context.locals.user = session.u
  return next()
})
