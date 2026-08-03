import { createClient, type Client } from '@libsql/client'

// Mensajes del formulario de contacto público. Misma DB libSQL/Turso que el
// CMS y las órdenes, con su propio módulo y tabla.

export const CONTACT_STATUSES = ['nuevo', 'atendido'] as const
export type ContactStatus = (typeof CONTACT_STATUSES)[number]

export interface Contact {
  id?: number
  name: string
  email: string
  company: string
  phone: string
  sector: string
  service_lines: string
  message: string
  source: string
  status: ContactStatus
  /**
   * Prueba de la autorización de tratamiento (Ley 1581 de 2012, art. 9).
   * `consent_at` es el momento exacto en que el titular marcó la casilla y
   * `consent_version` la versión del texto que aceptó. Sin las dos no hay forma
   * de acreditar ante la SIC *qué* autorizó, solo que autorizó algo.
   */
  consent_at: string
  consent_version: string
  consent_ip: string
  /**
   * Momento en que el titular marcó la casilla *opcional* de comunicaciones
   * comerciales. Vacío significa que no la marcó, que es el caso por defecto.
   * Es lo que decide si el correo se encola hacia Zoho Campaigns, y la prueba
   * de que la suscripción la pidió él y no se la inventó el sitio.
   */
  marketing_at: string
  created_at?: string
  updated_at?: string
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
    await client().execute(`CREATE TABLE IF NOT EXISTS contacts (
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
    )`)
    // Migración aditiva idempotente: `CREATE TABLE IF NOT EXISTS` no toca una
    // tabla que ya existe, así que las bases anteriores a la autorización de
    // datos necesitan las columnas por separado.
    for (const col of ['consent_at', 'consent_version', 'consent_ip']) {
      try {
        await client().execute(`ALTER TABLE contacts ADD COLUMN ${col} TEXT NOT NULL DEFAULT ''`)
      } catch (e: any) {
        if (!String(e?.message || '').includes('duplicate column')) throw e
      }
    }
  })()
  return _ready
}

const now = () => new Date().toISOString()

function rowToContact(r: any): Contact {
  return {
    id: Number(r.id),
    name: r.name,
    email: r.email,
    company: r.company,
    phone: r.phone,
    sector: r.sector,
    service_lines: r.service_lines,
    message: r.message,
    source: r.source,
    status: (CONTACT_STATUSES as readonly string[]).includes(r.status) ? r.status : 'nuevo',
    consent_at: r.consent_at ?? '',
    consent_version: r.consent_version ?? '',
    consent_ip: r.consent_ip ?? '',
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

export interface NewContactInput {
  name: string
  email: string
  company?: string
  phone?: string
  sector?: string
  service_lines?: string
  message?: string
  source?: string
  consent_version?: string
  consent_ip?: string
}

export async function createContact(input: NewContactInput): Promise<Contact> {
  await ensureSchema()
  const ts = now()
  const res = await client().execute({
    sql: `INSERT INTO contacts (name,email,company,phone,sector,service_lines,message,source,status,consent_at,consent_version,consent_ip,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      input.name, input.email, input.company ?? '', input.phone ?? '',
      input.sector ?? '', input.service_lines ?? '', input.message ?? '',
      input.source ?? 'web', 'nuevo',
      ts, input.consent_version ?? '', input.consent_ip ?? '',
      ts, ts,
    ],
  })
  return (await getContactById(Number(res.lastInsertRowid)))!
}

export async function listContacts(status?: string): Promise<Contact[]> {
  await ensureSchema()
  const db = client()
  const res = status && (CONTACT_STATUSES as readonly string[]).includes(status)
    ? await db.execute({ sql: 'SELECT * FROM contacts WHERE status = ? ORDER BY id DESC', args: [status] })
    : await db.execute('SELECT * FROM contacts ORDER BY id DESC')
  return res.rows.map(rowToContact)
}

export async function getContactById(id: number): Promise<Contact | null> {
  await ensureSchema()
  const res = await client().execute({ sql: 'SELECT * FROM contacts WHERE id = ? LIMIT 1', args: [id] })
  return res.rows.length ? rowToContact(res.rows[0]) : null
}

export async function updateContactStatus(id: number, status: ContactStatus): Promise<Contact | null> {
  await ensureSchema()
  if (!(CONTACT_STATUSES as readonly string[]).includes(status)) return getContactById(id)
  await client().execute({
    sql: 'UPDATE contacts SET status = ?, updated_at = ? WHERE id = ?',
    args: [status, now(), id],
  })
  return getContactById(id)
}
