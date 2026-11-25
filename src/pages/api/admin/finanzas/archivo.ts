import type { APIRoute } from 'astro'
import { fail, json } from '../../../../lib/apiError'
import { cargarEstado, descargarDocumento, descargarSoporte, subirSoporte, type Sesion } from '../../../../lib/finanzas/acciones'
import { subirDocumento } from '../../../../lib/finanzas/documentos'

export const prerender = false

// Soportes del expediente y documentos para leer con IA. Los archivos viven
// en Vercel Blob privado: se suben por aquí (hasta 4 MB, el límite de las
// funciones) y se descargan por aquí, nunca con un enlace público.
const ROLES = ['admin', 'finanzas', 'gerencia']

function sesion(locals: App.Locals): Sesion | null {
  const rol = String(locals.role || '')
  if (!ROLES.includes(rol)) return null
  const usuario = String(locals.username || '')
  return { usuario, nombre: String(locals.user || usuario), rol }
}

export const GET: APIRoute = async ({ url, locals }) => {
  const s = sesion(locals)
  if (!s) return json({ error: 'Su rol no tiene acceso a Finanzas' }, 403)
  try {
    const soporte = Number(url.searchParams.get('soporte'))
    const documento = Number(url.searchParams.get('documento'))
    const a = soporte ? await descargarSoporte(soporte) : documento ? await descargarDocumento(documento) : null
    if (!a) return json({ error: 'No se encontró el archivo' }, 404)
    const nombre = a.nombre.replace(/[^\w.\- ]+/g, '_')
    return new Response(a.datos as unknown as BodyInit, {
      headers: {
        'content-type': a.mime,
        'content-disposition': `inline; filename="${nombre}"`,
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
      },
    })
  } catch (e) {
    return fail('finanzas/archivo', e)
  }
}

/**
 * multipart/form-data con `archivo` y `destino`:
 * - destino=soporte: además `obligacion_id` y `tipo` (borrador, formulario, recibo, comprobante, acuse, otro).
 * - destino=documento: opcional `obligacion_id`; se lee con IA.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const s = sesion(locals)
  if (!s) return json({ error: 'Su rol no tiene acceso a Finanzas' }, 403)
  try {
    const fd = await request.formData()
    const archivo = fd.get('archivo')
    if (!(archivo instanceof File)) return json({ error: 'Falta el archivo' }, 400)
    const datos = new Uint8Array(await archivo.arrayBuffer())
    const obligacion_id = Number(fd.get('obligacion_id')) || null
    let resultado: unknown
    if (fd.get('destino') === 'documento') {
      if (s.rol !== 'admin' && s.rol !== 'finanzas') return json({ error: 'Su rol no puede subir documentos' }, 403)
      resultado = await subirDocumento({ datos, mime: archivo.type, nombre: archivo.name, obligacion_id, usuario: s.usuario, rol: s.rol })
    } else {
      if (!obligacion_id) return json({ error: 'Falta la obligación' }, 400)
      resultado = { id: await subirSoporte(s, { obligacion_id, tipo: String(fd.get('tipo') || ''), nombre: archivo.name, mime: archivo.type, datos }) }
    }
    return json({ ok: true, resultado, estado: await cargarEstado(s) })
  } catch (e) {
    return fail('finanzas/archivo', e)
  }
}
