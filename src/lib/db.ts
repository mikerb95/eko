/**
 * Resuelve a qué base libSQL se conecta el sitio.
 *
 * Existe porque el nombre de la variable depende de quién la puso. La
 * integración de Turso en el Marketplace de Vercel inyecta `TURSO_DATABASE_URL`
 * y `TURSO_AUTH_TOKEN`, y las rota ella; el código venía leyendo
 * `DATABASE_URL`/`DATABASE_AUTH_TOKEN`. En vez de copiar el secreto a un
 * segundo par de variables (que quedaría viejo el día que Turso rote el token),
 * se aceptan los dos nombres desde un solo lugar.
 *
 * Orden deliberado: `DATABASE_URL` primero. Es la anulación explícita, y es lo
 * que permite que en local se ponga `DATABASE_URL=file:./data/cms.db` en
 * `.env.local` para no escribir sobre la base de producción, que hoy es la
 * misma para Production, Preview y Development.
 *
 * Sin ninguna de las dos, cae al archivo local. Ese fallback NO funciona en
 * Vercel: el archivo no va en el bundle y el filesystem es de solo lectura, así
 * que la conexión revienta con `ConnectionFailed(... cms.db: 14)`. Es el modo
 * de desarrollo, no un modo degradado de producción.
 */
import { createClient, type Client } from '@libsql/client'

const ARCHIVO_LOCAL = 'file:./data/cms.db'

/** Lee de `import.meta.env` (Astro) o `process.env` (scripts y runtime de node). */
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

export function crearCliente(): Client {
  return createClient({ url: dbUrl(), authToken: dbAuthToken() })
}
