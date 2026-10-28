import type { APIRoute } from 'astro'
import { json } from '../../../../lib/apiError'
import { AsistenteNoDisponible, prepararPregunta, responderPregunta, usuarioDeSesion } from '../../../../lib/asistente/motor'
import { transmitir } from '../../../../lib/asistente/sse'

export const prerender = false

// Pregunta al asistente desde la caja del panel y transmite en vivo lo que
// hace (SSE). Sin `id` abre una conversación; con `id` sigue una propia, y si
// había una propuesta esperando, la pregunta cuenta como "cambie esto".
// Cualquier rol puede preguntar (reglasEscritura.ts); qué herramientas recibe
// lo decide permisos.ts.

const noStore = { 'cache-control': 'no-store' }

export const POST: APIRoute = async ({ request, locals }) => {
  const usuario = usuarioDeSesion(locals)
  if (!usuario) return json({ error: 'Sesión sin rol válido. Vuelva a entrar.' }, 401, noStore)

  const body = await request.json().catch(() => ({}))
  const pregunta = typeof body?.pregunta === 'string' ? body.pregunta.trim().slice(0, 1_000) : ''
  const id = typeof body?.id === 'string' && body.id ? body.id : null
  if (!pregunta) return json({ error: 'Escriba la pregunta.' }, 400, noStore)

  let preparada
  try {
    preparada = await prepararPregunta(usuario, pregunta, id)
  } catch (err) {
    if (err instanceof AsistenteNoDisponible) return json({ error: err.message, nueva: err.nueva }, err.status, noStore)
    // Sin poder leer el gasto no se arranca. La causa real queda en los logs.
    console.error('[asistente] no se pudo preparar la pregunta', err)
    return json({ error: 'No se pudo preparar la pregunta. Intente de nuevo en un momento.' }, 503, noStore)
  }

  return transmitir(async (enviar) => {
    enviar({ tipo: 'conversacion', id: preparada.conversacion.id })
    await responderPregunta(preparada, pregunta, enviar)
  })
}
