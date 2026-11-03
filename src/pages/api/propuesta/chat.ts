import type { APIRoute } from 'astro'
import { checkRateLimit, clientIp } from '../../../lib/rateLimit'
import { guardarPregunta, propuestaPublicada } from '../../../lib/propuesta/almacen'
import { validarEntradaChat } from '../../../lib/propuesta/ia'
import { ChatNoDisponible, chatDisponible, responderPregunta } from '../../../lib/propuesta/motorIA'
import { notifyPropuestaPregunta } from '../../../lib/email'

// Chat con IA de /propuesta. Solo responde mientras la propuesta esté
// publicada desde el panel. Cada pregunta queda guardada para Mike (la página
// lo avisa) y las que la IA no puede responder le llegan también por correo.

export const prerender = false

// La lee una persona: holgado para ella, corto para un bot.
const RATE_MAX = 30
const RATE_WINDOW_MS = 10 * 60 * 1000

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  })

export const GET: APIRoute = async () => {
  try {
    return json(200, { disponible: (await propuestaPublicada()) && (await chatDisponible()) })
  } catch {
    return json(200, { disponible: false })
  }
}

export const POST: APIRoute = async (context) => {
  const { request } = context
  let fallbackIp = 'unknown'
  try {
    fallbackIp = context.clientAddress
  } catch {}
  const { allowed, retryAfterSeconds } = checkRateLimit(`propuesta-chat:${clientIp(request, fallbackIp)}`, RATE_MAX, RATE_WINDOW_MS)
  if (!allowed) {
    return json(429, { error: 'Muchas preguntas seguidas. Espere unos minutos.' }, { 'Retry-After': String(retryAfterSeconds) })
  }

  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return json(400, { error: 'Formato inválido.' })
  }
  const entrada = validarEntradaChat(cuerpo)
  if (!entrada) return json(400, { error: 'Escriba una pregunta más corta.' })
  const pregunta = entrada.mensajes.at(-1)!.texto

  try {
    if (!(await propuestaPublicada())) return json(403, { error: 'La propuesta no está disponible.' })
    const r = await responderPregunta(entrada)

    // Guardar y avisar no puede tumbar la respuesta: ya está pagada.
    await guardarPregunta({ sesion: entrada.sesion, pregunta, respuesta: r.respuesta, aMike: r.pasarAMike, motivo: r.motivo, costoUsd: r.costoUsd }).catch((err) =>
      console.error('[propuesta-chat/guardar]', err instanceof Error ? err.message : err),
    )
    if (r.pasarAMike) await notifyPropuestaPregunta({ pregunta, respuesta: r.respuesta, motivo: r.motivo })

    return json(200, { respuesta: r.respuesta, pasarAMike: r.pasarAMike, seccion: r.seccion })
  } catch (err) {
    if (err instanceof ChatNoDisponible) return json(503, { error: 'El chat no está disponible ahora. Puede escribirle a Mike directamente.' })
    console.error('[propuesta-chat]', err instanceof Error ? err.message : err)
    return json(502, { error: 'La IA no respondió. Intente de nuevo en un momento.' })
  }
}
