import type { APIRoute } from 'astro'
import { validarEntrada } from '../../lib/asesor/bucle'
import { AsesorNoDisponible, disponible, responder } from '../../lib/asesor/motor'
import { checkRateLimit, clientIp } from '../../lib/rateLimit'

// Asesor con IA de la burbuja de WhatsApp (skill chat-ia). El tope de gasto
// diario lo pone el motor; el límite por IP, este endpoint. Para responder no
// usa nada guardado: el navegador reenvía la conversación.

export const prerender = false

// 40 preguntas por IP cada 10 minutos: de sobra para una persona, poco para un bot.
const RATE_MAX = 40
const RATE_WINDOW_MS = 10 * 60 * 1000

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  })

/** La burbuja pregunta al abrirse si ofrecer la opción de IA. */
export const GET: APIRoute = async () => json(200, { disponible: await disponible() })

export const POST: APIRoute = async (context) => {
  const { request } = context
  let fallbackIp = 'unknown'
  try {
    fallbackIp = context.clientAddress
  } catch {
    // clientAddress no disponible; nos quedamos con el header.
  }
  const { allowed, retryAfterSeconds } = checkRateLimit(`asesor:${clientIp(request, fallbackIp)}`, RATE_MAX, RATE_WINDOW_MS)
  if (!allowed) return json(429, { error: 'limite_ip' }, { 'Retry-After': String(retryAfterSeconds) })

  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return json(400, { error: 'formato' })
  }
  const entrada = validarEntrada(cuerpo)
  if ('error' in entrada) return json(400, entrada)

  try {
    const r = await responder(entrada)
    return json(200, { texto: r.texto, whatsapp: r.whatsapp })
  } catch (err) {
    if (err instanceof AsesorNoDisponible) return json(503, { error: 'no_disponible' })
    console.error('[asesor]', err instanceof Error ? err.message : err)
    return json(502, { error: 'fallo' })
  }
}
