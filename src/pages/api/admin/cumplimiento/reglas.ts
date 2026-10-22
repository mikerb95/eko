import type { APIRoute } from 'astro'
import { fail, json } from '../../../../lib/apiError'
import { guardarRegla, listarReglas } from '../../../../lib/agente/datos'

export const prerender = false

export const GET: APIRoute = async () => {
  try {
    return json({ reglas: await listarReglas() })
  } catch (e) {
    return fail('cumplimiento/reglas', e)
  }
}

export const POST: APIRoute = async ({ request }) => {
  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }
  const id = Number(b.id)
  if (!id) return json({ error: 'id requerido' }, 400)
  try {
    await guardarRegla({ id, nombre: b.nombre, prioridad: b.prioridad, umbral_alta: Number(b.umbral_alta), accion: b.accion, activa: b.activa !== false })
    return json({ ok: true })
  } catch (e) {
    return fail('cumplimiento/reglas', e)
  }
}
