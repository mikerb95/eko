/**
 * Conexión a la base y creación del esquema, compartidas por todos los módulos.
 *
 * ── QUÉ RESUELVE ────────────────────────────────────────────────────────────
 * 1. **El nombre de la variable.** La integración de Turso en el Marketplace de
 *    Vercel inyecta `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`, y las rota ella;
 *    el código venía leyendo `DATABASE_URL`/`DATABASE_AUTH_TOKEN`. En vez de
 *    copiar el secreto a un segundo par de variables (que quedaría viejo el día
 *    que Turso rote el token), se aceptan ambos nombres desde un solo lugar.
 *
 * 2. **Una sola conexión y un solo arranque de esquema.** Antes cada módulo
 *    tenía su propio cliente y su propio `ensureSchema()`. Con base en archivo
 *    daba igual; contra Turso por HTTP significaba repetir el `CREATE TABLE`
 *    completo una vez por módulo en cada arranque en frío. Ahora el cliente y
 *    la promesa de esquema son únicos: el primero que llegue lo crea y los
 *    demás esperan esa misma promesa.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Orden de la URL, deliberado: `DATABASE_URL` primero. Es la anulación
 * explícita, y es lo que permite poner `DATABASE_URL=file:./data/cms.db` en el
 * `.env.local` para desarrollar sin escribir sobre la base de producción, que
 * hoy es la misma para Production, Preview y Development.
 *
 * Sin ninguna de las dos cae al archivo local. Ese fallback NO funciona en
 * Vercel: el archivo no va en el bundle y el filesystem es de solo lectura, así
 * que la conexión revienta con `ConnectionFailed(... cms.db: 14)`. Es el modo
 * de desarrollo, no un modo degradado de producción.
 */
import { createClient, type Client } from '@libsql/client'
import { COLUMNAS, TABLAS } from './esquema'

const ARCHIVO_LOCAL = 'file:./data/cms.db'

/** Lee de `import.meta.env` (Astro) o `process.env` (runtime de node). */
function env(key: string): string {
  return (import.meta.env as any)?.[key] || (process.env as any)?.[key] || ''
}

export function dbUrl(): string {
  return env('DATABASE_URL') || env('TURSO_DATABASE_URL') || ARCHIVO_LOCAL
}

export function dbAuthToken(): string | undefined {
  return env('DATABASE_AUTH_TOKEN') || env('TURSO_AUTH_TOKEN') || undefined
}

/** `true` si hay base remota configurada; `false` si estamos sobre el archivo local. */
export function dbEsRemota(): boolean {
  return !dbUrl().startsWith('file:')
}

let _db: Client | null = null

/** Cliente compartido. Perezoso: no se conecta hasta la primera consulta. */
export function cliente(): Client {
  if (_db) return _db
  _db = createClient({ url: dbUrl(), authToken: dbAuthToken() })
  return _db
}

let _esquema: Promise<void> | null = null

/**
 * Crea el esquema completo si falta. Idempotente y compartida: se ejecuta una
 * vez por instancia, aunque la llamen los cinco módulos.
 */
export function asegurarEsquema(): Promise<void> {
  if (_esquema) return _esquema
  _esquema = (async () => {
    const db = cliente()
    for (const sql of TABLAS) await db.execute(sql)
    for (const [tabla, columna] of COLUMNAS) {
      try {
        await db.execute(`ALTER TABLE ${tabla} ADD COLUMN ${columna} TEXT NOT NULL DEFAULT ''`)
      } catch (e: any) {
        // "duplicate column name" = ya está, que es el camino normal en todo
        // arranque después del primero. Cualquier otro error sí importa: si la
        // columna no queda, cada escritura va a reventar después con "no such
        // column", y es mejor enterarse aquí.
        if (!String(e?.message || '').toLowerCase().includes('duplicate column')) throw e
      }
    }
  })()
  return _esquema
}
