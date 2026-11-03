/**
 * Dónde viven los archivos de los casos del taller.
 *
 * - **blob**: Vercel Blob privado (tienda `eko-taller-ia`). Los archivos solo se
 *   leen con el token del servidor; el panel los entrega por su propia API a un
 *   admin con sesión. Es el modo de producción y el de `astro dev` con
 *   `BLOB_READ_WRITE_TOKEN` en `.env.local` (OJO: es la misma tienda).
 * - **local**: carpeta `data/taller/`. Para las pruebas e2e y para desarrollar
 *   sin tocar la tienda real (`CASOS_ALMACEN=local`). Nunca en Vercel, cuyo
 *   disco es de solo lectura.
 *
 * Todo lo del taller va bajo el prefijo `taller/`: "borrar todo al terminar la
 * capacitación" es borrar ese prefijo, incluidos los archivos que alguien subió
 * y nunca llegó a enviar con un caso.
 */
import { del, get, head, list } from '@vercel/blob'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { PREFIJO, rutaValida } from './casos.ts'

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (process.env as any)?.[key] || ''
}

export type Modo = 'blob' | 'local'

export function modo(): Modo {
  if (env('CASOS_ALMACEN') === 'local' && !env('VERCEL')) return 'local'
  if (env('BLOB_READ_WRITE_TOKEN') || env('VERCEL')) return 'blob'
  return 'local'
}

const CARPETA = resolve('data')
function rutaLocal(ruta: string): string {
  if (!rutaValida(ruta)) throw new Error('Ruta inválida')
  const p = resolve(join(CARPETA, ruta))
  if (!p.startsWith(join(CARPETA, PREFIJO))) throw new Error('Ruta inválida')
  return p
}

/** Solo modo local: guarda lo que el navegador mandó a /api/diagnostico-casos/subir. */
export async function guardarLocal(ruta: string, datos: Uint8Array): Promise<void> {
  const p = rutaLocal(ruta)
  await mkdir(dirname(p), { recursive: true })
  await writeFile(p, datos, { flag: 'wx' })
}

/** Confirma que el archivo existe y devuelve su tamaño, o `null` si no está. */
export async function verificar(ruta: string): Promise<{ tamano: number } | null> {
  if (!rutaValida(ruta)) return null
  try {
    if (modo() === 'local') return { tamano: (await stat(rutaLocal(ruta))).size }
    const h = await head(ruta)
    return { tamano: h.size }
  } catch {
    return null
  }
}

/** Contenido del archivo para la descarga del panel. */
export async function leer(ruta: string): Promise<BodyInit | null> {
  if (!rutaValida(ruta)) return null
  try {
    if (modo() === 'local') return new Uint8Array(await readFile(rutaLocal(ruta)))
    const r = await get(ruta, { access: 'private' })
    return r?.statusCode === 200 ? r.stream : null
  } catch {
    return null
  }
}

export async function borrar(rutas: string[]): Promise<void> {
  const validas = rutas.filter(rutaValida)
  if (!validas.length) return
  if (modo() === 'local') {
    await Promise.all(validas.map((r) => rm(rutaLocal(r), { force: true })))
    return
  }
  await del(validas)
}

/** Borra TODO lo del taller, también lo que quedó huérfano. Devuelve cuántos archivos borró. */
export async function borrarTodo(): Promise<number> {
  if (modo() === 'local') {
    await rm(join(CARPETA, PREFIJO), { recursive: true, force: true })
    return 0
  }
  let total = 0
  let cursor: string | undefined
  do {
    const r = await list({ prefix: PREFIJO, cursor, limit: 1000 })
    if (r.blobs.length) {
      await del(r.blobs.map((b) => b.pathname))
      total += r.blobs.length
    }
    cursor = r.hasMore ? r.cursor : undefined
  } while (cursor)
  return total
}
