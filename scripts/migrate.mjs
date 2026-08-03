/**
 * Crea el esquema completo en la base apuntada por DATABASE_URL y la siembra.
 *
 * El esquema también se crea solo: cada módulo de `src/lib` tiene su
 * `ensureSchema()` con `CREATE TABLE IF NOT EXISTS` y corre en la primera
 * petición que lo necesite. Este script existe para poder hacerlo *antes* de
 * desplegar y verificar el resultado, en vez de descubrir en producción que la
 * base remota rechaza algo. Es idempotente: correrlo dos veces no cambia nada.
 *
 *   node --env-file=.env.local scripts/migrate.mjs
 *
 * Con ADMIN_USERNAME y ADMIN_PASSWORD definidos crea además la cuenta inicial
 * del panel, con el mismo formato PBKDF2 que `src/lib/users.ts`. Sin ellos se
 * salta ese paso.
 */
import { createClient } from '@libsql/client'
import { readFile } from 'node:fs/promises'

const url = process.env.DATABASE_URL
const authToken = process.env.DATABASE_AUTH_TOKEN

// El guardia es contra el fallback silencioso: si alguien corre esto sin
// cargar el .env, DATABASE_URL queda vacía y sembraríamos el archivo local
// creyendo que tocamos producción. `--local` es la salida explícita, para
// probar el script contra un SQLite de archivo.
const permitirLocal = process.argv.includes('--local')
if (!url || (url.startsWith('file:') && !permitirLocal)) {
  console.error('DATABASE_URL no apunta a una base remota. Aborto para no sembrar el archivo local por error.')
  console.error('Si eso es justo lo que quieres, pasa --local.')
  process.exit(1)
}

const db = createClient({ url, authToken })
const now = () => new Date().toISOString()

// ---------- Esquema ----------
// Copia literal de los `ensureSchema()` de src/lib. Si allá cambia una tabla,
// hay que reflejarlo aquí; no hay una sola fuente porque los módulos son TS y
// este script corre en node pelado.
const TABLAS = [
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

// Columnas añadidas después de la primera versión de cada tabla. SQLite no
// tiene `ADD COLUMN IF NOT EXISTS`, así que se intenta y se ignora "duplicate
// column", que es el camino normal en toda corrida posterior a la primera.
const COLUMNAS = [
  ['posts', 'image'],
  ['contacts', 'consent_at'],
  ['contacts', 'consent_version'],
  ['contacts', 'consent_ip'],
  ['orders', 'waste_type'],
  ['orders', 'estimated_quantity'],
  ['orders', 'consent_at'],
  ['orders', 'consent_version'],
  ['orders', 'consent_ip'],
]

async function crearEsquema() {
  for (const sql of TABLAS) await db.execute(sql)
  for (const [tabla, columna] of COLUMNAS) {
    try {
      await db.execute(`ALTER TABLE ${tabla} ADD COLUMN ${columna} TEXT NOT NULL DEFAULT ''`)
      console.log(`  + columna ${tabla}.${columna}`)
    } catch (e) {
      if (!String(e?.message || '').toLowerCase().includes('duplicate column')) throw e
    }
  }
  console.log(`esquema: ${TABLAS.length} sentencias aplicadas`)
}

// ---------- Siembra ----------
// Solo si la tabla está vacía, igual que `seedIfEmpty()`. Nunca pisa contenido
// que alguien haya editado desde el panel.
const leerJson = async (ruta) => JSON.parse(await readFile(new URL(ruta, import.meta.url), 'utf8'))

async function sembrarContenido() {
  const { rows: [{ n: nPosts }] } = await db.execute('SELECT COUNT(*) AS n FROM posts')
  if (Number(nPosts) === 0) {
    const posts = await leerJson('../src/data/blog-posts.json')
    for (const p of posts) {
      await db.execute({
        sql: `INSERT INTO posts (slug,category,date,readtime,accent,featured,title,lede,sections,image,updated_at)
              VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        args: [p.slug, p.category, p.date, p.readtime, p.accent, p.featured ? 1 : 0, p.title, p.lede, JSON.stringify(p.sections), p.image ?? '', now()],
      })
    }
    console.log(`posts: ${posts.length} sembrados`)
  } else {
    console.log(`posts: ${nPosts} ya existentes, no se siembra`)
  }

  const { rows: [{ n: nNorm }] } = await db.execute('SELECT COUNT(*) AS n FROM normativas')
  if (Number(nNorm) === 0) {
    const normativas = await leerJson('../src/data/normativas.json')
    let i = 0
    for (const n of normativas) {
      await db.execute({
        sql: `INSERT INTO normativas (col,position,code,title,body,tags,updated_at) VALUES (?,?,?,?,?,?,?)`,
        args: [n.col ?? 1, i++, n.code, n.title, n.body, JSON.stringify(n.tags ?? []), now()],
      })
    }
    console.log(`normativas: ${normativas.length} sembradas`)
  } else {
    console.log(`normativas: ${nNorm} ya existentes, no se siembra`)
  }
}

// ---------- Cuenta inicial ----------
// Mismo formato que src/lib/users.ts: pbkdf2$iteraciones$salt$hash, todo en
// base64url. Si cambia allá, cambia aquí.
const PBKDF2_ITERATIONS = 120_000

function b64url(bytes) {
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
    key,
    256,
  )
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64url(salt)}$${b64url(new Uint8Array(bits))}`
}

async function sembrarAdmin() {
  const { rows: [{ n }] } = await db.execute('SELECT COUNT(*) AS n FROM users')
  if (Number(n) > 0) {
    console.log(`usuarios: ${n} ya existentes, no se crea la cuenta inicial`)
    return
  }
  const username = (process.env.ADMIN_USERNAME || '').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!username || !password) {
    console.warn('usuarios: tabla vacía y ADMIN_USERNAME/ADMIN_PASSWORD sin definir, no se creó la cuenta inicial')
    return
  }
  const ts = now()
  await db.execute({
    sql: `INSERT INTO users (username,name,role,pass_hash,active,created_at,updated_at) VALUES (?,?,?,?,1,?,?)`,
    args: [username, 'Acceso inicial', 'admin', await hashPassword(password), ts, ts],
  })
  console.log(`usuarios: cuenta "${username}" creada con rol admin`)
}

console.log(`base: ${url.replace(/\/\/.*@/, '//')}`)
await crearEsquema()
await sembrarContenido()
await sembrarAdmin()

const tablas = await db.execute(
  `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
)
console.log('\ntablas en la base:', tablas.rows.map((r) => r.name).join(', '))
