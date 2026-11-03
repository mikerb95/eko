import type { APIRoute } from 'astro'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { json } from '../../../lib/apiError'
import { checkRateLimit, clientIp } from '../../../lib/rateLimit'
import { MAX_BYTES, TIPOS_PERMITIDOS, rutaValida, tipoDe } from '../../../lib/diagnostico/casos'
import { casosAbiertos } from '../../../lib/diagnostico/casosDatos'
import { guardarLocal, modo } from '../../../lib/diagnostico/almacen'

export const prerender = false

// Subida de archivos de los casos del taller.
//
// POST (modo blob): el navegador pide aquí un token de un solo uso y con él
// sube el archivo DIRECTO a Vercel Blob, sin pasar por la función (que no
// acepta más de 4,5 MB). El token solo sirve para una ruta bajo `taller/`, con
// los tipos de archivo permitidos, hasta 20 MB y por 10 minutos.
//
// PUT (modo local, solo desarrollo y pruebas): el archivo llega en el cuerpo y
// se guarda en data/taller/.
const RATE_MAX = 60
const RATE_WINDOW_MS = 10 * 60 * 1000

function limitar(context: Parameters<APIRoute>[0]) {
  let fallbackIp = 'unknown'
  try {
    fallbackIp = context.clientAddress
  } catch {
    // sin clientAddress
  }
  return checkRateLimit(`casos-subir:${clientIp(context.request, fallbackIp)}`, RATE_MAX, RATE_WINDOW_MS)
}

const demasiados = (s: number) =>
  json({ error: 'Demasiados archivos seguidos. Intente de nuevo en unos minutos.' }, 429, { 'Retry-After': String(s) })

export const POST: APIRoute = async (context) => {
  if (modo() !== 'blob') return json({ error: 'Almacén no disponible' }, 404)
  let body: HandleUploadBody
  try {
    body = await context.request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }
  // Solo se emiten tokens; el aviso de "subida terminada" no se usa (el caso
  // se guarda aparte y confirma el archivo contra Blob).
  if (body?.type !== 'blob.generate-client-token') return json({ error: 'Evento no soportado' }, 400)
  const { allowed, retryAfterSeconds } = limitar(context)
  if (!allowed) return demasiados(retryAfterSeconds)
  try {
    if (!(await casosAbiertos())) return json({ error: 'En este momento no se están recibiendo casos.' }, 403)
    const r = await handleUpload({
      body,
      request: context.request,
      onBeforeGenerateToken: async (pathname) => {
        if (!rutaValida(pathname) || !tipoDe(pathname)) throw new Error('ruta')
        return {
          allowedContentTypes: TIPOS_PERMITIDOS,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
          allowOverwrite: false,
          validUntil: Date.now() + 10 * 60 * 1000,
        }
      },
    })
    return json(r)
  } catch (e) {
    if (e instanceof Error && e.message === 'ruta') return json({ error: 'Ese tipo de archivo no se acepta.' }, 400)
    console.error('[diagnostico-casos/subir]', e instanceof Error ? e.stack || e.message : e)
    return json({ error: 'No se pudo preparar la subida. Intente de nuevo.' }, 500)
  }
}

export const PUT: APIRoute = async (context) => {
  if (modo() !== 'local') return json({ error: 'Almacén no disponible' }, 404)
  const { allowed, retryAfterSeconds } = limitar(context)
  if (!allowed) return demasiados(retryAfterSeconds)
  const ruta = context.url.searchParams.get('ruta') ?? ''
  if (!rutaValida(ruta) || !tipoDe(ruta)) return json({ error: 'Ese tipo de archivo no se acepta.' }, 400)
  try {
    if (!(await casosAbiertos())) return json({ error: 'En este momento no se están recibiendo casos.' }, 403)
    const datos = new Uint8Array(await context.request.arrayBuffer())
    if (datos.byteLength > MAX_BYTES) return json({ error: 'El archivo pesa más de lo permitido.' }, 413)
    // Mismo sufijo que pondría Blob, para que dos archivos iguales no choquen.
    const sufijo = Math.random().toString(36).slice(2, 10)
    const final = ruta.replace(/(\.[a-z0-9]+)?$/i, (ext) => `-${sufijo}${ext}`)
    await guardarLocal(final, datos)
    return json({ pathname: final })
  } catch (e) {
    console.error('[diagnostico-casos/subir local]', e instanceof Error ? e.stack || e.message : e)
    return json({ error: 'No se pudo guardar el archivo.' }, 500)
  }
}
