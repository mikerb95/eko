import type { APIRoute } from 'astro'
import { fail, json } from '../../../../lib/apiError'
import { leerActo, leerArchivo } from '../../../../lib/agente/datos'

export const prerender = false

/** Devuelve el documento original de un acto para verlo en el navegador. */
export const GET: APIRoute = async ({ url }) => {
  const id = Number(url.searchParams.get('id'))
  if (!id) return json({ error: 'id requerido' }, 400)
  try {
    const acto = await leerActo(id)
    if (!acto) return json({ error: 'No existe' }, 404)
    const contenido = await leerArchivo(id)
    const cuerpo = acto.archivo_tipo === 'text/plain' ? contenido : Buffer.from(contenido, 'base64')
    const nombre = encodeURIComponent(acto.archivo_nombre || `acto-${id}`)
    return new Response(cuerpo, {
      headers: {
        'content-type': acto.archivo_tipo === 'text/plain' ? 'text/plain; charset=utf-8' : acto.archivo_tipo,
        'content-disposition': `inline; filename*=UTF-8''${nombre}`,
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
      },
    })
  } catch (e) {
    return fail('cumplimiento/archivo', e)
  }
}
