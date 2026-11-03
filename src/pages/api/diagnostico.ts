import type { APIRoute } from 'astro'
import { json } from '../../lib/apiError'
import { checkRateLimit, clientIp } from '../../lib/rateLimit'
import { consentGranted } from '../../lib/legal'
import { encuestaAbierta, guardarRespuesta } from '../../lib/diagnostico/datos'
import { ErrorDiagnostico, validarRespuesta } from '../../lib/diagnostico/validar'

export const prerender = false

// La encuesta la llena el equipo de Ekosolv, a menudo desde la misma red de la
// oficina: el tope por IP es holgado para no bloquear a un área entera.
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
  const ip = clientIp(request, fallbackIp)
  const { allowed, retryAfterSeconds } = checkRateLimit(`diagnostico:${ip}`, RATE_MAX, RATE_WINDOW_MS)
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

  // Honeypot del formulario.
  if (String(b.website ?? '').trim()) return json({ ok: true })

  try {
    if (!(await encuestaAbierta())) {
      return json({ error: 'La encuesta no está abierta en este momento.' }, 403)
    }
    if (!consentGranted(b.consent)) {
      return json({ error: 'Falta la autorización para usar sus respuestas en el diagnóstico.' }, 400)
    }
    const respuesta = validarRespuesta(b)
    await guardarRespuesta(respuesta)
    return json({ ok: true })
  } catch (e) {
    if (e instanceof ErrorDiagnostico) return json({ error: e.message }, 400)
    console.error('[diagnostico]', e instanceof Error ? e.stack || e.message : e)
    return json({ error: 'No se pudo guardar la respuesta. Intente de nuevo en un momento.' }, 500)
  }
}
