import type { APIRoute } from 'astro'
import { json } from '../../../lib/apiError'
import { checkRateLimit, clientIp } from '../../../lib/rateLimit'
import { consentGranted } from '../../../lib/legal'
import { ErrorCaso, validarCaso } from '../../../lib/diagnostico/casos'
import { casosAbiertos, guardarCaso } from '../../../lib/diagnostico/casosDatos'

export const prerender = false

// Casos para el taller (src/lib/diagnostico/casos.ts). Los archivos ya
// llegaron al almacén por /api/diagnostico-casos/subir; aquí llega el caso con
// sus rutas. Mismas defensas que la encuesta: interruptor del panel, honeypot,
// autorización y tope por IP holgado (toda la oficina sale por la misma IP).
const RATE_MAX = 30
const RATE_WINDOW_MS = 10 * 60 * 1000

export const POST: APIRoute = async (context) => {
  const { request } = context
  let fallbackIp = 'unknown'
  try {
    fallbackIp = context.clientAddress
  } catch {
    // clientAddress no disponible; nos quedamos con el header.
  }
  const { allowed, retryAfterSeconds } = checkRateLimit(`casos:${clientIp(request, fallbackIp)}`, RATE_MAX, RATE_WINDOW_MS)
  if (!allowed) {
    return json({ error: 'Demasiados envíos seguidos. Intente de nuevo en unos minutos.' }, 429, {
      'Retry-After': String(retryAfterSeconds),
    })
  }

  let b: Record<string, unknown>
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }
  if (String(b.website ?? '').trim()) return json({ ok: true })

  try {
    if (!(await casosAbiertos())) return json({ error: 'En este momento no se están recibiendo casos.' }, 403)
    if (!consentGranted(b.consent)) {
      return json({ error: 'Falta la autorización para usar los archivos en el taller.' }, 400)
    }
    const id = await guardarCaso(validarCaso(b))
    return json({ ok: true, id })
  } catch (e) {
    if (e instanceof ErrorCaso) return json({ error: e.message }, 400)
    console.error('[diagnostico-casos]', e instanceof Error ? e.stack || e.message : e)
    return json({ error: 'No se pudo guardar el caso. Intente de nuevo en un momento.' }, 500)
  }
}
