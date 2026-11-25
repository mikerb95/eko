/**
 * Soportes y documentos de Finanzas en Vercel Blob privado (prefijo
 * `finanzas/`). Nunca se borran solos. Solo se leen con el token del
 * servidor; el panel los entrega por su propia API a quien tenga el rol.
 *
 * Modo local (`FIN_ALMACEN=local`, carpeta `data/finanzas/`) para las pruebas
 * sin tocar la tienda real. Nunca en Vercel, cuyo disco es de solo lectura.
 */
import { get, put } from '@vercel/blob'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (process.env as any)?.[key] || ''
}
const token = () => env('BLOB_READ_WRITE_TOKEN') || undefined

export const PREFIJO = 'finanzas/'
/** Límite de las funciones de Vercel para el cuerpo de una petición, con margen. */
export const TAMANO_MAXIMO = 4 * 1024 * 1024
export const TIPOS_PERMITIDOS = ['application/pdf', 'image/png', 'image/jpeg'] as const

function local(): boolean {
  return env('FIN_ALMACEN') === 'local' && !env('VERCEL')
}

const CARPETA = resolve('data')
function rutaLocal(ruta: string): string {
  const p = resolve(join(CARPETA, ruta))
  if (!p.startsWith(join(CARPETA, PREFIJO))) throw new Error('Ruta inválida')
  return p
}

/** Nombre seguro para la ruta: sin tildes, espacios ni barras. */
export function nombreSeguro(nombre: string): string {
  const base = String(nombre || 'archivo').normalize('NFD').replace(/[̀-ͯ]/g, '')
  return base.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(-80) || 'archivo'
}

export async function guardar(carpeta: string, nombre: string, datos: Uint8Array, mime: string): Promise<string> {
  const ruta = `${PREFIJO}${carpeta}/${Date.now()}-${nombreSeguro(nombre)}`
  if (local()) {
    const p = rutaLocal(ruta)
    await mkdir(dirname(p), { recursive: true })
    await writeFile(p, datos, { flag: 'wx' })
    return ruta
  }
  const r = await put(ruta, Buffer.from(datos), { access: 'private', contentType: mime, addRandomSuffix: true, token: token() })
  return r.pathname
}

export async function leer(ruta: string): Promise<Uint8Array | null> {
  if (!ruta.startsWith(PREFIJO)) return null
  try {
    if (local()) return new Uint8Array(await readFile(rutaLocal(ruta)))
    const r = await get(ruta, { access: 'private', token: token() })
    if (r?.statusCode !== 200 || !r.stream) return null
    return new Uint8Array(await new Response(r.stream).arrayBuffer())
  } catch {
    return null
  }
}
