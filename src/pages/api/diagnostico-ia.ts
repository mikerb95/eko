import type { APIRoute } from 'astro'
import { checkRateLimit, clientIp } from '../../lib/rateLimit'
import { encuestaAbierta } from '../../lib/diagnostico/datos'
import { validarEntradaIA } from '../../lib/diagnostico/ia'
import { ayudarConRespuesta, iaDisponible, IANoDisponible } from '../../lib/diagnostico/motorIA'

// Asistente con IA de la encuesta de diagnóstico (/ia). Solo funciona mientras
// la encuesta esté abierta. No guarda nada: lo que queda es lo que la persona
// envíe en la encuesta.

export const prerender = false

// El equipo responde desde la misma red de la oficina: holgado por IP.
const RATE_MAX = 60
const RATE_WINDOW_MS = 10 * 60 * 1000

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  })

/** La página pregunta al cargar si mostrar los botones del asistente. */
export const GET: APIRoute = async () => {
  try {
    return json(200, { disponible: (await encuestaAbierta()) && (await iaDisponible()) })
  } catch {
    return json(200, { disponible: false })
  }
}

export const POST: APIRoute = async (context) => {
  const { request } = context
  let fallbackIp = 'unknown'
  try {
    fallbackIp = context.clientAddress
  } catch {
    // clientAddress no disponible; nos quedamos con el header.
  }
  const { allowed, retryAfterSeconds } = checkRateLimit(`diagnostico-ia:${clientIp(request, fallbackIp)}`, RATE_MAX, RATE_WINDOW_MS)
  if (!allowed) {
    return json(429, { error: 'Muchas consultas seguidas. Espere unos minutos.' }, { 'Retry-After': String(retryAfterSeconds) })
  }

  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return json(400, { error: 'Formato inválido.' })
  }
  const entrada = validarEntradaIA(cuerpo)
  if (!entrada) return json(400, { error: 'Escriba primero su respuesta (al menos unas palabras).' })

  try {
    if (!(await encuestaAbierta())) return json(403, { error: 'La encuesta no está abierta.' })
    return json(200, await ayudarConRespuesta(entrada))
  } catch (err) {
    if (err instanceof IANoDisponible) return json(503, { error: 'El asistente no está disponible ahora. Puede seguir sin él.' })
    console.error('[diagnostico-ia]', err instanceof Error ? err.message : err)
    return json(502, { error: 'La IA no respondió. Intente de nuevo o siga sin ella.' })
  }
}
