import { defineMiddleware } from 'astro:middleware'
import { SESSION_COOKIE, verifySession } from './lib/auth'
import { canWrite } from './lib/reglasEscritura'

const PUBLIC_ADMIN_PATHS = new Set(['/admin/login'])
// La salida es pública: sin regla en reglasEscritura.ts, su POST caía en
// "solo admin" y a los demás roles les respondía 403 sin borrar la cookie.
// Cerrar una sesión que no existe no hace daño.
const PUBLIC_API_PATHS = new Set(['/api/admin/login', '/api/admin/logout'])

// Páginas internas del proyecto (las del pie de página, columna "Proyecto").
// No son parte del sitio público: exigen sesión igual que /admin.
//
// Se comparan por PREFIJO, no por ruta exacta: una lista exacta deja pública
// cualquier página nueva que alguien agregue bajo /docs, y ese olvido no se ve
// hasta que el contenido ya está indexado.
//
// Para que esto se aplique de verdad, cada una lleva `export const prerender =
// false`. El sitio es `output: 'static'` y el middleware no corre sobre páginas
// prerenderizadas: si se dejan estáticas, Vercel las sirve como HTML plano y la
// comprobación de sesión nunca se ejecuta.
const PROTECTED_DOC_PREFIXES = ['/docs', '/oportunidades2630']

function isProtectedDoc(pathname: string): boolean {
  const p = normalize(pathname)
  return PROTECTED_DOC_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + '/'))
}

/** Roles con acceso a las páginas internas. Ampliar aquí si hace falta. */
const DOC_ROLES = ['admin']

/** Quita la barra final para que '/docs/' y '/docs' se traten igual. */
function normalize(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname
}

// Autorización por rol de las escrituras: tabla en src/lib/reglasEscritura.ts,
// compartida con el asistente del panel.

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Defensa CSRF para la API.
 *
 * La cookie de sesión es `SameSite=Lax`, que ya impide que un sitio ajeno la
 * envíe en un POST. Esto es la segunda capa, y hace falta porque el
 * `security.checkOrigin` de Astro NO cubre este caso: mirando su código
 * (`core/app/origin-check.js`) solo rechaza peticiones cruzadas cuando el
 * `content-type` es de formulario. Todo el panel habla `application/json`, así
 * que para nosotros ese chequeo no valida nada.
 *
 * Se rechaza solo cuando el navegador declara un origen distinto. Un cliente
 * sin navegador (el `curl` con el que hoy se opera la bandeja de Zoho) no manda
 * `Origin` ni `Sec-Fetch-Site` y sigue funcionando: quien no tiene cookies de
 * por medio tampoco puede montar un CSRF.
 */
function isCrossSiteWrite(request: Request, origin: string): boolean {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return false
  if (request.headers.get('sec-fetch-site') === 'cross-site') return true
  const reqOrigin = request.headers.get('origin')
  return !!reqOrigin && reqOrigin !== origin
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url

  if (pathname.startsWith('/api/') && isCrossSiteWrite(context.request, context.url.origin)) {
    return new Response(JSON.stringify({ error: 'Origen no permitido' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    })
  }

  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/')
  const isAdminApi = pathname.startsWith('/api/admin')
  const isDocPage = isProtectedDoc(pathname)
  // Academia de IA: exige sesión de cualquier rol. Quién está inscrito y qué
  // puede ver cada uno lo deciden la página y src/lib/academia/datos.ts.
  const isAcademia = pathname === '/academia' || pathname.startsWith('/academia/')
  const isAcademiaApi = pathname === '/api/academia' || pathname.startsWith('/api/academia/')

  if (!isAdminPage && !isAdminApi && !isDocPage && !isAcademia && !isAcademiaApi) return next()
  if (PUBLIC_ADMIN_PATHS.has(pathname) || PUBLIC_API_PATHS.has(pathname)) return next()

  const token = context.cookies.get(SESSION_COOKIE)?.value
  const session = await verifySession(token)

  if (!session) {
    if (isAdminApi || isAcademiaApi) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    }
    // `next` devuelve a la página pedida después de entrar, en vez de dejar
    // siempre al usuario en el panel.
    const next = normalize(pathname) + context.url.search
    return context.redirect(`/admin/login?next=${encodeURIComponent(next)}`)
  }

  // El rol `participante` solo estudia en la academia de IA: cualquier página
  // del panel lo lleva a /academia y la API del panel le queda cerrada.
  if (session.r === 'participante') {
    if (isAdminPage) return context.redirect('/academia')
    if (isAdminApi) {
      return new Response(JSON.stringify({ error: 'Tu cuenta solo tiene acceso a la academia' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      })
    }
  }

  if (isDocPage && !DOC_ROLES.includes(session.r)) {
    return new Response('Tu rol no tiene acceso a la documentación del proyecto.', {
      status: 403,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }

  const method = context.request.method.toUpperCase()
  if (isAdminApi && method !== 'GET' && method !== 'HEAD' && !canWrite(pathname, session.r)) {
    return new Response(JSON.stringify({ error: 'Tu rol no tiene permiso para esta acción' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    })
  }
  // El listado de usuarios y talento humano (salarios, contratos, documentos)
  // exponen información sensible: solo admin, incluso en GET.
  if (
    (pathname.startsWith('/api/admin/users') || pathname.startsWith('/api/admin/talento') || pathname.startsWith('/api/admin/academia')) &&
    session.r !== 'admin'
  ) {
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
