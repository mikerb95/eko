import type { APIRoute } from 'astro'
import { json } from '../../../../lib/apiError'
import { AsistenteNoDisponible, continuarDecision, prepararDecision, usuarioDeSesion } from '../../../../lib/asistente/motor'
import { transmitir } from '../../../../lib/asistente/sse'

export const prerender = false

// Aprueba o descarta la propuesta pendiente de una conversación PROPIA y
// transmite lo que sigue. La decisión puede llegar horas después: la
// conversación vive en la base. Solo un `true` explícito aprueba.

const noStore = { 'cache-control': 'no-store' }

export const POST: APIRoute = async ({ request, locals }) => {
  const usuario = usuarioDeSesion(locals)
  if (!usuario) return json({ error: 'Sesión sin rol válido. Vuelva a entrar.' }, 401, noStore)

  const body = await request.json().catch(() => ({}))
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!id) return json({ error: 'Falta la conversación.' }, 400, noStore)
  const aprobado = body?.aprobado === true

  let preparada
  try {
    preparada = await prepararDecision(usuario, id)
  } catch (err) {
    if (err instanceof AsistenteNoDisponible) return json({ error: err.message }, err.status, noStore)
    console.error('[asistente] no se pudo reclamar la decisión', err)
    return json({ error: 'No se pudo leer la conversación. Intente de nuevo en un momento.' }, 503, noStore)
  }

  return transmitir(async (enviar) => {
    enviar({ tipo: 'conversacion', id: preparada.conversacion.id })
    await continuarDecision(preparada, aprobado, enviar)
  })
}
