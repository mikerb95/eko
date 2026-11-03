import type { APIRoute } from 'astro'
import { fail, json } from '../../../lib/apiError'
import {
  abrirEncuesta,
  cerrarEncuesta,
  eliminarRespuesta,
  leerEstado,
  listarRespuestas,
} from '../../../lib/diagnostico/datos'
import { aCSV, resumir } from '../../../lib/diagnostico/resumen'

export const prerender = false

// Las respuestas son opiniones del equipo sobre su propio trabajo: solo admin,
// también en lectura (el middleware deja pasar cualquier GET con sesión).
const soloAdmin = (role: unknown) => role === 'admin'
const prohibido = () => json({ error: 'Solo administradores' }, 403)

export const GET: APIRoute = async ({ url, locals }) => {
  if (!soloAdmin(locals.role)) return prohibido()
  try {
    const respuestas = await listarRespuestas()
    if (url.searchParams.get('formato') === 'csv') {
      const fecha = new Date().toISOString().slice(0, 10)
      return new Response(aCSV(respuestas), {
        headers: {
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': `attachment; filename="diagnostico-ia-${fecha}.csv"`,
        },
      })
    }
    return json({ estado: await leerEstado(), respuestas, resumen: resumir(respuestas) })
  } catch (e) {
    return fail('diagnostico', e)
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!soloAdmin(locals.role)) return prohibido()
  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }
  const acciones = { abrir: abrirEncuesta, cerrar: cerrarEncuesta } as const
  const accion = acciones[String(b.accion) as keyof typeof acciones]
  if (!accion) return json({ error: 'Acción desconocida' }, 400)
  try {
    return json({ ok: true, estado: await accion() })
  } catch (e) {
    return fail('diagnostico', e)
  }
}

export const DELETE: APIRoute = async ({ url, locals }) => {
  if (!soloAdmin(locals.role)) return prohibido()
  const id = Number(url.searchParams.get('id'))
  if (!id) return json({ error: 'id requerido' }, 400)
  try {
    await eliminarRespuesta(id)
    return json({ ok: true })
  } catch (e) {
    return fail('diagnostico', e)
  }
}
