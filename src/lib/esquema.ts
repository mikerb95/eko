/**
 * Esquema de la base, en un solo lugar.
 *
 * Antes cada módulo (`cms`, `users`, `contactos`, `ops`, `zohoOutbox`) llevaba
 * su propio `CREATE TABLE` embebido en su `ensureSchema()`. Funcionaba, pero
 * dejaba el esquema repartido en cinco archivos, y cualquier script externo que
 * quisiera crear la base tenía que copiar el SQL — copia que se desactualiza
 * sola. De hecho pasó: la primera versión de `scripts/migrate.mjs` se escribió
 * copiando y se le quedó afuera `marketing_at` en dos tablas.
 *
 * Este archivo es TS deliberadamente plano: solo constantes, sin imports ni
 * `import.meta`. Así node lo carga directo (type stripping) desde un `.mjs`,
 * sin pasar por el bundler, y la app y el script comparten la misma fuente.
 *
 * Todo es idempotente: `CREATE TABLE IF NOT EXISTS` no toca una tabla que ya
 * existe. Por eso las columnas añadidas después van aparte, en COLUMNAS.
 */

/** Tablas e índices. Se ejecutan en orden en cada arranque. */
export const TABLAS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL DEFAULT '',
    readtime TEXT NOT NULL DEFAULT '',
    accent TEXT NOT NULL DEFAULT 'deep',
    featured INTEGER NOT NULL DEFAULT 0,
    title TEXT NOT NULL DEFAULT '',
    lede TEXT NOT NULL DEFAULT '',
    sections TEXT NOT NULL DEFAULT '[]',
    image TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE TABLE IF NOT EXISTS normativas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    col INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL DEFAULT 0,
    code TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'lectura',
    pass_hash TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    sector TEXT NOT NULL DEFAULT '',
    service_lines TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'web',
    status TEXT NOT NULL DEFAULT 'nuevo',
    consent_at TEXT NOT NULL DEFAULT '',
    consent_version TEXT NOT NULL DEFAULT '',
    consent_ip TEXT NOT NULL DEFAULT '',
    marketing_at TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consecutive TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'solicitada',
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    address2 TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    postal_code TEXT NOT NULL DEFAULT '',
    waste_type TEXT NOT NULL DEFAULT '',
    estimated_quantity TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'web',
    assigned_to TEXT NOT NULL DEFAULT '',
    scheduled_at TEXT NOT NULL DEFAULT '',
    internal_notes TEXT NOT NULL DEFAULT '',
    consent_at TEXT NOT NULL DEFAULT '',
    consent_version TEXT NOT NULL DEFAULT '',
    consent_ip TEXT NOT NULL DEFAULT '',
    marketing_at TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE TABLE IF NOT EXISTS order_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    user TEXT NOT NULL DEFAULT '',
    from_status TEXT NOT NULL DEFAULT '',
    to_status TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    at TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE TABLE IF NOT EXISTS zoho_outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity TEXT NOT NULL,
    ref_type TEXT NOT NULL DEFAULT '',
    ref_id INTEGER NOT NULL DEFAULT 0,
    payload TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pendiente',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT NOT NULL DEFAULT '',
    zoho_id TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE UNIQUE INDEX IF NOT EXISTS zoho_outbox_unico ON zoho_outbox (entity, ref_type, ref_id)`,

  `CREATE INDEX IF NOT EXISTS zoho_outbox_estado ON zoho_outbox (status, id)`,
]

/**
 * Columnas añadidas después de la primera versión de su tabla.
 *
 * Van aparte porque `CREATE TABLE IF NOT EXISTS` no toca una tabla existente:
 * una base creada antes de que existiera `consent_at` se queda sin ella para
 * siempre si no se hace el `ALTER`. Todas son `TEXT NOT NULL DEFAULT ''`.
 */
export const COLUMNAS: readonly (readonly [tabla: string, columna: string])[] = [
  ['posts', 'image'],
  ['contacts', 'consent_at'],
  ['contacts', 'consent_version'],
  ['contacts', 'consent_ip'],
  ['contacts', 'marketing_at'],
  ['orders', 'waste_type'],
  ['orders', 'estimated_quantity'],
  ['orders', 'consent_at'],
  ['orders', 'consent_version'],
  ['orders', 'consent_ip'],
  ['orders', 'marketing_at'],
]

/** Tablas que deben existir al terminar. Sirve para verificar tras migrar. */
export const TABLAS_ESPERADAS: readonly string[] = [
  'contacts',
  'normativas',
  'order_events',
  'orders',
  'posts',
  'users',
  'zoho_outbox',
]
