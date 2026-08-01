import { createClient, type Client } from '@libsql/client'

// Usuarios del panel: credenciales hasheadas (PBKDF2 via WebCrypto, sin deps)
// y roles para autorización en el middleware.

export const ROLES = ['admin', 'operaciones', 'logistica', 'consultor', 'lectura'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  operaciones: 'Operaciones',
  logistica: 'Logística',
  consultor: 'Consultor',
  lectura: 'Solo lectura',
}

export interface User {
  id?: number
  username: string
  name: string
  role: Role
  active: boolean
  created_at?: string
  updated_at?: string
}

let _db: Client | null = null
let _ready: Promise<void> | null = null

function env(key: string, fallback = ''): string {
  return (import.meta.env as any)[key] || (process.env as any)[key] || fallback
}

function client(): Client {
  if (_db) return _db
  const url = env('DATABASE_URL', 'file:./data/cms.db')
  const authToken = env('DATABASE_AUTH_TOKEN') || undefined
  _db = createClient({ url, authToken })
  return _db
}

async function ensureSchema(): Promise<void> {
  if (_ready) return _ready
  _ready = (async () => {
    const db = client()
    await db.execute(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'lectura',
      pass_hash TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    )`)
  })()
  return _ready
}

const now = () => new Date().toISOString()

// ---------- Password hashing (PBKDF2-SHA256) ----------
const PBKDF2_ITERATIONS = 120_000
const enc = new TextEncoder()

function b64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function b64urlToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    256,
  )
  return new Uint8Array(bits)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derive(password, salt, PBKDF2_ITERATIONS)
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64url(salt)}$${b64url(hash)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false
  const iterations = Number(parts[1])
  if (!Number.isFinite(iterations) || iterations < 1) return false
  const salt = b64urlToBytes(parts[2])
  const expected = b64urlToBytes(parts[3])
  const actual = await derive(password, salt, iterations)
  if (actual.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i]
  return diff === 0
}

// ---------- Bootstrap ----------
// Si la tabla está vacía, crea UNA cuenta con las credenciales de entorno, para
// poder levantar el panel en local sin tener acceso previo.
//
// Es un arranque de desarrollo, no la forma de crear usuarios: una credencial
// en variables de entorno no se rota, no se audita por persona y no tiene rol
// distinto de admin. Los usuarios reales se crean desde la pestaña Usuarios,
// cada uno con el rol mínimo que necesita. Nunca dejar aquí un usuario genérico
// tipo admin/admin: por eso el valor por defecto es `dev` y no `admin`.
export async function seedAdminIfEmpty(): Promise<void> {
  await ensureSchema()
  const db = client()
  const res = await db.execute('SELECT COUNT(*) AS n FROM users')
  if (Number(res.rows[0].n) > 0) return
  const username = env('ADMIN_USERNAME', 'dev')
  const password = env('ADMIN_PASSWORD')
  if (!password) {
    console.warn('[users] Tabla vacía y ADMIN_PASSWORD no definido: no se creó la cuenta inicial')
    return
  }
  const ts = now()
  // El nombre visible dice lo que la cuenta es. Si aparece "Acceso de
  // desarrollo" en el panel de producción, alguien arrancó por entorno y esa
  // cuenta hay que reemplazarla por usuarios nominales con su rol.
  await db.execute({
    sql: `INSERT INTO users (username,name,role,pass_hash,active,created_at,updated_at) VALUES (?,?,?,?,1,?,?)`,
    args: [username, 'Acceso de desarrollo', 'admin', await hashPassword(password), ts, ts],
  })
}

// ---------- Auth ----------
// Cuenta de acceso fija, sin base de datos.
//
// Existe porque en producción no hay base: DATABASE_URL no está configurada y
// el fallback `file:./data/cms.db` no se puede abrir en la función (el archivo
// no va en el bundle y el filesystem es de solo lectura). Sin esto, el login
// falla con ConnectionFailed 14 antes de poder comprobar nada.
//
// Se comprueba ANTES de tocar la base, por eso funciona con la base caída.
// Es un parche de acceso, no la solución: las secciones del panel siguen
// leyendo y escribiendo esa base y van a fallar igual hasta que exista.
const HARDCODED_USER = 'admin'
const HARDCODED_PASSWORD = 'ekosolv2026*'

export async function verifyLogin(username: string, password: string): Promise<User | null> {
  const user = String(username || '').trim().toLowerCase()
  if (user === HARDCODED_USER && String(password || '') === HARDCODED_PASSWORD) {
    return { username: HARDCODED_USER, name: 'Administrador', role: 'admin', active: true }
  }

  await seedAdminIfEmpty()
  const res = await client().execute({
    sql: 'SELECT * FROM users WHERE username = ? AND active = 1 LIMIT 1',
    args: [String(username || '').trim().toLowerCase()],
  })
  if (!res.rows.length) return null
  const r: any = res.rows[0]
  if (!(await verifyPassword(String(password || ''), String(r.pass_hash)))) return null
  return rowToUser(r)
}

// ---------- CRUD ----------
function rowToUser(r: any): User {
  return {
    id: Number(r.id),
    username: r.username,
    name: r.name,
    role: (ROLES as readonly string[]).includes(r.role) ? r.role : 'lectura',
    active: !!Number(r.active),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

export async function listUsers(): Promise<User[]> {
  await ensureSchema()
  const res = await client().execute('SELECT * FROM users ORDER BY id ASC')
  return res.rows.map(rowToUser)
}

export interface UserInput {
  id?: number
  username: string
  name: string
  role: Role
  active: boolean
  password?: string
}

export async function upsertUser(u: UserInput): Promise<number> {
  await ensureSchema()
  const db = client()
  const username = u.username.trim().toLowerCase()
  const ts = now()
  if (u.id) {
    if (!u.active || u.role !== 'admin') await assertNotLastAdmin(u.id)
    await db.execute({
      sql: 'UPDATE users SET username=?, name=?, role=?, active=?, updated_at=? WHERE id=?',
      args: [username, u.name, u.role, u.active ? 1 : 0, ts, u.id],
    })
    if (u.password) {
      await db.execute({
        sql: 'UPDATE users SET pass_hash=?, updated_at=? WHERE id=?',
        args: [await hashPassword(u.password), ts, u.id],
      })
    }
    return u.id
  }
  if (!u.password) throw new Error('La contraseña es obligatoria para un usuario nuevo')
  const res = await db.execute({
    sql: 'INSERT INTO users (username,name,role,pass_hash,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?)',
    args: [username, u.name, u.role, await hashPassword(u.password), u.active ? 1 : 0, ts, ts],
  })
  return Number(res.lastInsertRowid)
}

export async function deleteUser(id: number): Promise<void> {
  await ensureSchema()
  await assertNotLastAdmin(id)
  await client().execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] })
}

// Evita quedarse sin ningún admin activo por edición o borrado.
async function assertNotLastAdmin(id: number): Promise<void> {
  const res = await client().execute({
    sql: `SELECT COUNT(*) AS n FROM users WHERE role='admin' AND active=1 AND id != ?`,
    args: [id],
  })
  const target = await client().execute({ sql: `SELECT role, active FROM users WHERE id = ?`, args: [id] })
  const t: any = target.rows[0]
  if (t && t.role === 'admin' && Number(t.active) === 1 && Number(res.rows[0].n) === 0) {
    throw new Error('No puedes eliminar o degradar al último administrador activo')
  }
}
