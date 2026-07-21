import { createClient, type Client } from '@libsql/client'

// Operaciones: órdenes de recolección RAEE (Fase 1 del panel operativo).
// Comparte la misma DB Turso/libSQL que el CMS pero con su propio módulo.

export const ORDER_STATUSES = [
  'solicitada',
  'confirmada',
  'programada',
  'en_ruta',
  'recolectada',
  'certificada',
  'cerrada',
  'cancelada',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const STATUS_LABELS: Record<OrderStatus, string> = {
  solicitada: 'Solicitada',
  confirmada: 'Confirmada',
  programada: 'Programada',
  en_ruta: 'En ruta',
  recolectada: 'Recolectada',
  certificada: 'Certificada',
  cerrada: 'Cerrada',
  cancelada: 'Cancelada',
}

export interface Order {
  id?: number
  consecutive: string
  status: OrderStatus
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  country: string
  address: string
  address2: string
  city: string
  postal_code: string
  waste_type: string
  estimated_quantity: string
  message: string
  source: string
  assigned_to: string
  scheduled_at: string
  internal_notes: string
  created_at?: string
  updated_at?: string
}

export interface OrderEvent {
  id?: number
  order_id: number
  user: string
  from_status: string
  to_status: string
  note: string
  at: string
}

let _db: Client | null = null
let _ready: Promise<void> | null = null

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
    await db.execute(`CREATE TABLE IF NOT EXISTS orders (
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
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    )`)
    // Migración idempotente para bases ya existentes sin estas columnas.
    for (const col of ['waste_type', 'estimated_quantity']) {
      try {
        await db.execute(`ALTER TABLE orders ADD COLUMN ${col} TEXT NOT NULL DEFAULT ''`)
      } catch (e: any) {
        if (!String(e?.message || '').includes('duplicate column')) throw e
      }
    }
    await db.execute(`CREATE TABLE IF NOT EXISTS order_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      user TEXT NOT NULL DEFAULT '',
      from_status TEXT NOT NULL DEFAULT '',
      to_status TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      at TEXT NOT NULL DEFAULT ''
    )`)
  })()
  return _ready
}

const now = () => new Date().toISOString()

function rowToOrder(r: any): Order {
  return {
    id: Number(r.id),
    consecutive: r.consecutive,
    status: (ORDER_STATUSES as readonly string[]).includes(r.status) ? r.status : 'solicitada',
    first_name: r.first_name,
    last_name: r.last_name,
    email: r.email,
    phone: r.phone,
    company: r.company,
    country: r.country,
    address: r.address,
    address2: r.address2,
    city: r.city,
    postal_code: r.postal_code,
    waste_type: r.waste_type,
    estimated_quantity: r.estimated_quantity,
    message: r.message,
    source: r.source,
    assigned_to: r.assigned_to,
    scheduled_at: r.scheduled_at,
    internal_notes: r.internal_notes,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

// Consecutivo legible: REC-2026-0001
async function nextConsecutive(db: Client): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `REC-${year}-`
  const res = await db.execute({
    sql: `SELECT consecutive FROM orders WHERE consecutive LIKE ? ORDER BY id DESC LIMIT 1`,
    args: [`${prefix}%`],
  })
  let n = 1
  if (res.rows.length) {
    const last = String(res.rows[0].consecutive)
    const num = parseInt(last.slice(prefix.length), 10)
    if (Number.isFinite(num)) n = num + 1
  }
  return `${prefix}${String(n).padStart(4, '0')}`
}

export interface NewOrderInput {
  first_name: string
  last_name: string
  email: string
  phone: string
  company?: string
  country?: string
  address: string
  address2?: string
  city: string
  postal_code?: string
  waste_type?: string
  estimated_quantity?: string
  message?: string
  source?: string
}

export async function createOrder(input: NewOrderInput): Promise<Order> {
  await ensureSchema()
  const db = client()
  const ts = now()
  // Reintento simple por si dos solicitudes concurrentes toman el mismo consecutivo
  for (let attempt = 0; attempt < 3; attempt++) {
    const consecutive = await nextConsecutive(db)
    try {
      const res = await db.execute({
        sql: `INSERT INTO orders (consecutive,status,first_name,last_name,email,phone,company,country,address,address2,city,postal_code,message,source,created_at,updated_at)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          consecutive, 'solicitada',
          input.first_name, input.last_name, input.email, input.phone,
          input.company ?? '', input.country ?? 'Colombia',
          input.address, input.address2 ?? '', input.city, input.postal_code ?? '',
          input.message ?? '', input.source ?? 'web', ts, ts,
        ],
      })
      const id = Number(res.lastInsertRowid)
      await db.execute({
        sql: `INSERT INTO order_events (order_id,user,from_status,to_status,note,at) VALUES (?,?,?,?,?,?)`,
        args: [id, 'web', '', 'solicitada', 'Solicitud recibida desde el sitio web', ts],
      })
      return { ...(await getOrderById(id))! }
    } catch (e: any) {
      if (attempt < 2 && String(e?.message || '').includes('UNIQUE')) continue
      throw e
    }
  }
  throw new Error('No se pudo generar el consecutivo')
}

export async function listOrders(status?: string): Promise<Order[]> {
  await ensureSchema()
  const db = client()
  const res = status && (ORDER_STATUSES as readonly string[]).includes(status)
    ? await db.execute({ sql: 'SELECT * FROM orders WHERE status = ? ORDER BY id DESC', args: [status] })
    : await db.execute('SELECT * FROM orders ORDER BY id DESC')
  return res.rows.map(rowToOrder)
}

export async function getOrderById(id: number): Promise<Order | null> {
  await ensureSchema()
  const res = await client().execute({ sql: 'SELECT * FROM orders WHERE id = ? LIMIT 1', args: [id] })
  return res.rows.length ? rowToOrder(res.rows[0]) : null
}

export async function getOrderEvents(orderId: number): Promise<OrderEvent[]> {
  await ensureSchema()
  const res = await client().execute({
    sql: 'SELECT * FROM order_events WHERE order_id = ? ORDER BY id ASC',
    args: [orderId],
  })
  return res.rows.map((r: any) => ({
    id: Number(r.id), order_id: Number(r.order_id), user: r.user,
    from_status: r.from_status, to_status: r.to_status, note: r.note, at: r.at,
  }))
}

export interface OrderUpdate {
  status?: OrderStatus
  assigned_to?: string
  scheduled_at?: string
  internal_notes?: string
  note?: string
}

export async function updateOrder(id: number, patch: OrderUpdate, user: string): Promise<Order | null> {
  await ensureSchema()
  const db = client()
  const current = await getOrderById(id)
  if (!current) return null

  const status = patch.status && (ORDER_STATUSES as readonly string[]).includes(patch.status) ? patch.status : current.status
  const assigned_to = patch.assigned_to ?? current.assigned_to
  const scheduled_at = patch.scheduled_at ?? current.scheduled_at
  const internal_notes = patch.internal_notes ?? current.internal_notes
  const ts = now()

  await db.execute({
    sql: `UPDATE orders SET status=?, assigned_to=?, scheduled_at=?, internal_notes=?, updated_at=? WHERE id=?`,
    args: [status, assigned_to, scheduled_at, internal_notes, ts, id],
  })

  if (status !== current.status || patch.note) {
    await db.execute({
      sql: `INSERT INTO order_events (order_id,user,from_status,to_status,note,at) VALUES (?,?,?,?,?,?)`,
      args: [id, user, current.status, status, patch.note ?? '', ts],
    })
  }
  return getOrderById(id)
}

export async function countOrdersByStatus(): Promise<Record<string, number>> {
  await ensureSchema()
  const res = await client().execute('SELECT status, COUNT(*) AS n FROM orders GROUP BY status')
  const out: Record<string, number> = {}
  for (const r of res.rows as any[]) out[r.status] = Number(r.n)
  return out
}
