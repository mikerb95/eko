import type { APIRoute } from 'astro'
import { fail, json } from '../../../../lib/apiError'
import { actosSinClave } from '../../../../lib/agente/datos'
import { procesarActo } from '../../../../lib/agente/procesar'

export const prerender = false

/**
 * `{ id }` reprocesa un acto (por ejemplo, después de corregir la tabla de
 * expedientes). Sin `id`, procesa los que quedaron esperando la clave de IA.
 */
export const POST: APIRoute = async ({ request }) => {
  let b: any = {}
  try {
    b = await request.json()
  } catch {
    // Cuerpo vacío: modo "procesar pendientes".
  }
  try {
    const ids = b.id ? [Number(b.id)] : await actosSinClave()
    for (const id of ids) await procesarActo(id)
    return json({ ok: true, procesados: ids.length })
  } catch (e) {
    return fail('cumplimiento/reprocesar', e)
  }
}
