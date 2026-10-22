import type { APIRoute } from 'astro'
import { fail, json } from '../../../../lib/apiError'
import { actualizarAlerta, listarAlertas } from '../../../../lib/agente/datos'

export const prerender = false

export const GET: APIRoute = async () => {
  try {
    return json({ alertas: await listarAlertas() })
  } catch (e) {
    return fail('cumplimiento/alertas', e)
  }
}

/** Cambia estado, nota, responsable o confirma los datos de una alerta. */
export const PATCH: APIRoute = async ({ request }) => {
  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }
  const id = Number(b.id)
  if (!id) return json({ error: 'id requerido' }, 400)
  try {
    await actualizarAlerta(id, {
      estado: b.estado,
      nota: b.nota,
      responsable: b.responsable,
      por_confirmar: typeof b.por_confirmar === 'boolean' ? b.por_confirmar : undefined,
      vence_el: typeof b.vence_el === 'string' ? b.vence_el : undefined,
      expediente_id: b.expediente_id !== undefined ? Number(b.expediente_id) : undefined,
    })
    return json({ ok: true })
  } catch (e) {
    return fail('cumplimiento/alertas', e)
  }
}
