import type { APIRoute } from 'astro'
import { fail, json } from '../../../../lib/apiError'
import { cargarEstado, ejecutar, type Sesion } from '../../../../lib/finanzas/acciones'

export const prerender = false

// Finanzas: calendario tributario, expedientes y control antes de pagar.
// El middleware ya limita /api/admin/finanzas a finanzas, gerencia y admin
// (también en GET); esto es la segunda capa. Qué puede hacer cada rol lo
// decide src/lib/finanzas/acciones.ts.
const ROLES = ['admin', 'finanzas', 'gerencia']

function sesion(locals: App.Locals): Sesion | null {
  const rol = String(locals.role || '')
  if (!ROLES.includes(rol)) return null
  const usuario = String(locals.username || '')
  return { usuario, nombre: String(locals.user || usuario), rol }
}

export const GET: APIRoute = async ({ locals }) => {
  const s = sesion(locals)
  if (!s) return json({ error: 'Su rol no tiene acceso a Finanzas' }, 403)
  try {
    return json(await cargarEstado(s))
  } catch (e) {
    return fail('finanzas', e)
  }
}

/** Escrituras con `{ accion, ...datos }`; devuelve el resultado y el estado completo. */
export const POST: APIRoute = async ({ request, locals }) => {
  const s = sesion(locals)
  if (!s) return json({ error: 'Su rol no tiene acceso a Finanzas' }, 403)
  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }
  try {
    const resultado = await ejecutar(s, String(b?.accion || ''), b)
    return json({ ok: true, resultado: resultado ?? null, estado: await cargarEstado(s) })
  } catch (e) {
    return fail('finanzas', e)
  }
}
