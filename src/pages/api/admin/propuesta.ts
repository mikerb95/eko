import type { APIRoute } from 'astro'
import { fail, json } from '../../../lib/apiError'
import {
  borrarEleccion,
  borrarPregunta,
  listarElecciones,
  listarPreguntas,
} from '../../../lib/propuesta/almacen'

export const prerender = false

// La propuesta comercial y lo que pregunta el gerente: solo admin, también en
// lectura (el middleware deja pasar cualquier GET con sesión).
const soloAdmin = (role: unknown) => role === 'admin'
const prohibido = () => json({ error: 'Solo administradores' }, 403)

export const GET: APIRoute = async ({ locals }) => {
  if (!soloAdmin(locals.role)) return prohibido()
  try {
    const [preguntas, elecciones] = await Promise.all([listarPreguntas(), listarElecciones()])
    return json({ preguntas, elecciones })
  } catch (e) {
    return fail('propuesta', e)
  }
}

export const DELETE: APIRoute = async ({ url, locals }) => {
  if (!soloAdmin(locals.role)) return prohibido()
  const id = Number(url.searchParams.get('id'))
  const tipo = url.searchParams.get('tipo')
  if (!id || (tipo !== 'pregunta' && tipo !== 'eleccion')) return json({ error: 'id y tipo requeridos' }, 400)
  try {
    await (tipo === 'pregunta' ? borrarPregunta(id) : borrarEleccion(id))
    return json({ ok: true })
  } catch (e) {
    return fail('propuesta', e)
  }
}
