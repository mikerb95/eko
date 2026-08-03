/**
 * Crea el esquema en la base apuntada por DATABASE_URL/TURSO_DATABASE_URL y la
 * siembra.
 *
 * El esquema también se crea solo: `asegurarEsquema()` de `src/lib/db.ts` corre
 * en la primera petición que necesite la base. Este script existe para poder
 * hacerlo *antes* de desplegar y ver el resultado, en vez de descubrir en
 * producción que la base remota rechaza algo. Es idempotente.
 *
 *   npm run migrate            (carga .env.local)
 *   node scripts/migrate.mjs   (si las variables ya están en el entorno)
 *
 * El SQL NO se copia aquí: se importa de `src/lib/esquema.ts`, que es la misma
 * fuente que usa la app. Node carga ese .ts directo por type stripping. La
 * primera versión de este script sí copiaba el SQL y se le quedó afuera una
 * columna en dos tablas; de ahí la fuente única.
 *
 * Con ADMIN_USERNAME y ADMIN_PASSWORD crea además la cuenta inicial del panel,
 * con el mismo formato PBKDF2 que `src/lib/users.ts`. Sin ellos se salta.
 */
import { createClient } from '@libsql/client'
import { readFile } from 'node:fs/promises'
import { COLUMNAS, TABLAS, TABLAS_ESPERADAS } from '../src/lib/esquema.ts'

const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL
const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN

// El guardia es contra el fallback silencioso: sin el .env cargado la URL queda
// vacía y sembraríamos el archivo local creyendo que tocamos producción.
// `--local` es la salida explícita, para probar el script contra un SQLite.
const permitirLocal = process.argv.includes('--local')
if (!url || (url.startsWith('file:') && !permitirLocal)) {
  console.error('No hay base remota configurada (DATABASE_URL / TURSO_DATABASE_URL).')
  console.error('Aborto para no sembrar el archivo local por error. Si eso es lo que quieres, pasa --local.')
  process.exit(1)
}

const db = createClient({ url, authToken })
const now = () => new Date().toISOString()

// ---------- Esquema ----------
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
// Solo si la tabla está vacía, igual que `seedIfEmpty()` de cms.ts. Nunca pisa
// contenido editado desde el panel.
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
// Mismo formato que src/lib/users.ts: pbkdf2$iteraciones$salt$hash en base64url.
const PBKDF2_ITERATIONS = 120_000

const b64url = (bytes) =>
  Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

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

// ---------- Verificación ----------
async function verificar() {
  const res = await db.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
  )
  const presentes = res.rows.map((r) => String(r.name))
  const faltan = TABLAS_ESPERADAS.filter((t) => !presentes.includes(t))
  console.log(`\ntablas: ${presentes.join(', ')}`)
  if (faltan.length) {
    console.error(`FALTAN tablas esperadas: ${faltan.join(', ')}`)
    process.exit(1)
  }
  console.log(`✓ las ${TABLAS_ESPERADAS.length} tablas esperadas existen`)
}

// La URL de Turso no lleva credenciales, pero por si acaso no se imprime entera.
console.log(`base: ${url.replace(/\/\/[^@]*@/, '//')}`)
await crearEsquema()
await sembrarContenido()
await sembrarAdmin()
await verificar()
