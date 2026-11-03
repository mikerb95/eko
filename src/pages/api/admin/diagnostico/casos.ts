import type { APIRoute } from 'astro'
import { fail, json } from '../../../../lib/apiError'
import { leer } from '../../../../lib/diagnostico/almacen'
import {
  abrirCasos,
  cerrarCasos,
  eliminarCaso,
  eliminarTodosLosCasos,
  leerCaso,
} from '../../../../lib/diagnostico/casosDatos'

export const prerender = false

// Casos para el taller, desde el panel. Solo admin, también para descargar:
// los archivos pueden traer datos reales de clientes.
const soloAdmin = (role: unknown) => role === 'admin'
const prohibido = () => json({ error: 'Solo administradores' }, 403)

/** Descarga un archivo de un caso: ?caso=<id>&i=<posición>. */
export const GET: APIRoute = async ({ url, locals }) => {
  if (!soloAdmin(locals.role)) return prohibido()
  const id = Number(url.searchParams.get('caso'))
  const i = Number(url.searchParams.get('i'))
  if (!id || !Number.isInteger(i) || i < 0) return json({ error: 'caso e i requeridos' }, 400)
  try {
    const archivo = (await leerCaso(id))?.archivos[i]
    if (!archivo) return json({ error: 'No existe' }, 404)
    const cuerpo = await leer(archivo.ruta)
    if (!cuerpo) return json({ error: 'El archivo ya no está en el almacén.' }, 404)
    return new Response(cuerpo, {
      headers: {
        'content-type': archivo.tipo || 'application/octet-stream',
        'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(archivo.nombre)}`,
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
      },
    })
  } catch (e) {
    return fail('diagnostico/casos', e)
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
  const acciones = { abrir: abrirCasos, cerrar: cerrarCasos } as const
  const accion = acciones[String(b.accion) as keyof typeof acciones]
  if (!accion) return json({ error: 'Acción desconocida' }, 400)
  try {
    return json({ ok: true, estado: await accion() })
  } catch (e) {
    return fail('diagnostico/casos', e)
  }
}

/** ?id=<caso> borra uno con sus archivos; ?todos=1 borra todo lo del taller. */
export const DELETE: APIRoute = async ({ url, locals }) => {
  if (!soloAdmin(locals.role)) return prohibido()
  try {
    if (url.searchParams.get('todos') === '1') return json({ ok: true, ...(await eliminarTodosLosCasos()) })
    const id = Number(url.searchParams.get('id'))
    if (!id) return json({ error: 'id requerido' }, 400)
    await eliminarCaso(id)
    return json({ ok: true })
  } catch (e) {
    return fail('diagnostico/casos', e)
  }
}
