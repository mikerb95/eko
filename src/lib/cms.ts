import { createClient, type Client } from '@libsql/client'
import seedPosts from '../data/blog-posts.json'
import seedNormativas from '../data/normativas.json'

// ---------- Types ----------
export interface Section {
  type: 'p' | 'h2' | 'pull' | 'list'
  text?: string
  items?: string[]
}

export interface Post {
  id?: number
  slug: string
  category: string
  date: string
  readtime: string
  accent: 'deep' | 'forest' | 'clay'
  featured: boolean
  title: string
  lede: string
  sections: Section[]
  /**
   * Imagen de portada para compartir (Open Graph), 1200×630, en /public/og/.
   * Vacía = se usa la portada genérica del sitio (`Layout.astro`).
   *
   * Es lo que se ve cuando el artículo se comparte en LinkedIn, Facebook o
   * WhatsApp, y la base de la Fase 1 de docs/plan-redes-sociales.md: Instagram
   * exige imagen en toda publicación, así que sin esto no hay difusión posible.
   */
  image?: string
}

export interface Normativa {
  id?: number
  col: 1 | 2
  position: number
  code: string
  title: string
  body: string
  tags: string[]
}

// ---------- Client ----------
let _db: Client | null = null
let _ready: Promise<void> | null = null

function getDbUrl(): string | null {
  const url = import.meta.env.DATABASE_URL || process.env.DATABASE_URL
  return url && !url.startsWith('file:') ? url : null
}

function client(): Client {
  if (_db) return _db
  const url = import.meta.env.DATABASE_URL || process.env.DATABASE_URL || 'file:./data/cms.db'
  const authToken = import.meta.env.DATABASE_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN
  _db = createClient({ url, authToken })
  return _db
}

async function ensureSchema(): Promise<void> {
  if (_ready) return _ready
  _ready = (async () => {
    const db = client()
    await db.execute(`CREATE TABLE IF NOT EXISTS posts (
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
    )`)
    await db.execute(`CREATE TABLE IF NOT EXISTS normativas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      col INTEGER NOT NULL DEFAULT 1,
      position INTEGER NOT NULL DEFAULT 0,
      code TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL DEFAULT ''
    )`)

    // Migraciones aditivas. `CREATE TABLE IF NOT EXISTS` no toca una tabla que
    // ya existe, así que las columnas nuevas hay que añadirlas aparte o las
    // bases ya desplegadas se quedan sin ellas.
    await addColumnIfMissing(db, 'posts', 'image', `TEXT NOT NULL DEFAULT ''`)
  })()
  return _ready
}

/**
 * `ALTER TABLE ... ADD COLUMN` idempotente.
 *
 * SQLite no tiene `ADD COLUMN IF NOT EXISTS`, así que se consulta el esquema
 * antes. Se ejecuta en cada arranque: tiene que ser barato y no fallar nunca
 * si la columna ya está.
 */
async function addColumnIfMissing(db: Client, table: string, column: string, decl: string): Promise<void> {
  try {
    const info = await db.execute(`PRAGMA table_info(${table})`)
    if (info.rows.some((r: any) => r.name === column)) return
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${decl}`)
    console.log(`[cms] columna añadida: ${table}.${column}`)
  } catch (e) {
    // Si dos instancias arrancan a la vez, la segunda ve "duplicate column".
    // No es un error: la migración ya la hizo la otra.
    const msg = String((e as Error)?.message || e)
    if (!msg.includes('duplicate column')) {
      console.error(`[cms] no se pudo añadir ${table}.${column}:`, msg)
    }
  }
}

const now = () => new Date().toISOString()

// ---------- Row mappers ----------
function rowToPost(r: any): Post {
  return {
    id: Number(r.id),
    slug: r.slug,
    category: r.category,
    date: r.date,
    readtime: r.readtime,
    accent: r.accent,
    featured: !!Number(r.featured),
    title: r.title,
    lede: r.lede,
    sections: safeParse(r.sections, []),
    image: r.image || '',
  }
}
function rowToNormativa(r: any): Normativa {
  return {
    id: Number(r.id),
    col: Number(r.col) === 2 ? 2 : 1,
    position: Number(r.position),
    code: r.code,
    title: r.title,
    body: r.body,
    tags: safeParse(r.tags, []),
  }
}
function safeParse<T>(v: any, fallback: T): T {
  try { return JSON.parse(v) } catch { return fallback }
}

// ---------- Seeding ----------
export async function seedIfEmpty(): Promise<{ posts: number; normativas: number }> {
  await ensureSchema()
  const db = client()
  let posts = 0
  let normativas = 0
  const pCount = await db.execute('SELECT COUNT(*) AS n FROM posts')
  if (Number(pCount.rows[0].n) === 0) {
    for (const p of seedPosts as Post[]) {
      await db.execute({
        sql: `INSERT INTO posts (slug,category,date,readtime,accent,featured,title,lede,sections,updated_at)
              VALUES (?,?,?,?,?,?,?,?,?,?)`,
        args: [p.slug, p.category, p.date, p.readtime, p.accent, p.featured ? 1 : 0, p.title, p.lede, JSON.stringify(p.sections), now()],
      })
      posts++
    }
  }
  const nCount = await db.execute('SELECT COUNT(*) AS n FROM normativas')
  if (Number(nCount.rows[0].n) === 0) {
    let i = 0
    for (const n of seedNormativas as any[]) {
      await db.execute({
        sql: `INSERT INTO normativas (col,position,code,title,body,tags,updated_at) VALUES (?,?,?,?,?,?,?)`,
        args: [n.col ?? 1, i++, n.code, n.title, n.body, JSON.stringify(n.tags ?? []), now()],
      })
      normativas++
    }
  }
  return { posts, normativas }
}

// ---------- Public reads (with JSON fallback) ----------
export async function getPosts(): Promise<Post[]> {
  if (!getDbUrl()) return (seedPosts as Post[])
  try {
    await ensureSchema()
    const res = await client().execute('SELECT * FROM posts ORDER BY featured DESC, id ASC')
    if (res.rows.length) return res.rows.map(rowToPost)
  } catch (e) {
    console.error('[cms] getPosts fell back to JSON:', (e as Error).message)
  }
  return (seedPosts as Post[])
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!getDbUrl()) return (seedPosts as Post[]).find((p) => p.slug === slug) ?? null
  try {
    await ensureSchema()
    const res = await client().execute({ sql: 'SELECT * FROM posts WHERE slug = ? LIMIT 1', args: [slug] })
    if (res.rows.length) return rowToPost(res.rows[0])
  } catch (e) {
    console.error('[cms] getPostBySlug fell back to JSON:', (e as Error).message)
  }
  return (seedPosts as Post[]).find((p) => p.slug === slug) ?? null
}

export async function getNormativas(): Promise<Normativa[]> {
  if (!getDbUrl()) return (seedNormativas as any[]).map((n, i) => ({ id: i + 1, position: i, col: n.col ?? 1, code: n.code, title: n.title, body: n.body, tags: n.tags ?? [] }))
  try {
    await ensureSchema()
    const res = await client().execute('SELECT * FROM normativas ORDER BY col ASC, position ASC, id ASC')
    if (res.rows.length) return res.rows.map(rowToNormativa)
  } catch (e) {
    console.error('[cms] getNormativas fell back to JSON:', (e as Error).message)
  }
  return (seedNormativas as any[]).map((n, i) => ({ id: i + 1, position: i, col: n.col ?? 1, code: n.code, title: n.title, body: n.body, tags: n.tags ?? [] }))
}

// ---------- Admin writes (DB required) ----------
export async function getPostById(id: number): Promise<Post | null> {
  await ensureSchema()
  const res = await client().execute({ sql: 'SELECT * FROM posts WHERE id = ? LIMIT 1', args: [id] })
  return res.rows.length ? rowToPost(res.rows[0]) : null
}

export async function upsertPost(p: Post): Promise<number> {
  await ensureSchema()
  const db = client()
  const args = [p.slug, p.category, p.date, p.readtime, p.accent, p.featured ? 1 : 0, p.title, p.lede, JSON.stringify(p.sections ?? []), now()]
  if (p.id) {
    await db.execute({
      sql: `UPDATE posts SET slug=?,category=?,date=?,readtime=?,accent=?,featured=?,title=?,lede=?,sections=?,updated_at=? WHERE id=?`,
      args: [...args, p.id],
    })
    return p.id
  }
  const res = await db.execute({
    sql: `INSERT INTO posts (slug,category,date,readtime,accent,featured,title,lede,sections,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    args,
  })
  return Number(res.lastInsertRowid)
}

export async function deletePost(id: number): Promise<void> {
  await ensureSchema()
  await client().execute({ sql: 'DELETE FROM posts WHERE id = ?', args: [id] })
}

export async function upsertNormativa(n: Normativa): Promise<number> {
  await ensureSchema()
  const db = client()
  const args = [n.col ?? 1, n.position ?? 0, n.code, n.title, n.body, JSON.stringify(n.tags ?? []), now()]
  if (n.id) {
    await db.execute({
      sql: `UPDATE normativas SET col=?,position=?,code=?,title=?,body=?,tags=?,updated_at=? WHERE id=?`,
      args: [...args, n.id],
    })
    return n.id
  }
  const res = await db.execute({
    sql: `INSERT INTO normativas (col,position,code,title,body,tags,updated_at) VALUES (?,?,?,?,?,?,?)`,
    args,
  })
  return Number(res.lastInsertRowid)
}

export async function deleteNormativa(id: number): Promise<void> {
  await ensureSchema()
  await client().execute({ sql: 'DELETE FROM normativas WHERE id = ?', args: [id] })
}
