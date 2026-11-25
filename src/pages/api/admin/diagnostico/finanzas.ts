import type { APIRoute } from 'astro'
import { fail, json } from '../../../../lib/apiError'
import { NOTA_MAX, esPregunta, guardarMarca, leerFinanzas } from '../../../../lib/diagnostico/finanzas'

export const prerender = false

// Cuestionario del diagnóstico de Finanzas: material interno, solo admin,
// también en lectura (el middleware deja pasar cualquier GET con sesión).
const prohibido = () => json({ error: 'Solo administradores' }, 403)

export const GET: APIRoute = async ({ locals }) => {
  if (locals.role !== 'admin') return prohibido()
  try {
    return json({ estado: await leerFinanzas() })
  } catch (e) {
    return fail('diagnostico-finanzas', e)
  }
}

/** Guarda una pregunta: { id, h, n }. */
export const POST: APIRoute = async ({ request, locals }) => {
  if (locals.role !== 'admin') return prohibido()
  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }
  const id = String(b?.id ?? '')
  if (!esPregunta(id)) return json({ error: 'Pregunta desconocida' }, 400)
  const n = String(b?.n ?? '').slice(0, NOTA_MAX)
  try {
    await guardarMarca(id, { h: !!b?.h, n })
    return json({ ok: true })
  } catch (e) {
    return fail('diagnostico-finanzas', e)
  }
}
