/**
 * Bandeja de salida hacia Zoho (`zoho_outbox`).
 *
 * Por qué existe: la web es la fuente de verdad de las solicitudes, pero Zoho
 * puede estar caído, sin credenciales o todavía sin conectar. Si empujáramos a
 * Zoho directamente desde el formulario, cada fallo sería un lead perdido que
 * nadie vuelve a ver.
 *
 * En vez de eso, cada solicitud deja aquí una fila `pendiente` con una foto de
 * los datos. Drenar la bandeja es un paso aparte (`syncPending()` en
 * `zoho.ts`), que se puede correr hoy, mañana o el día que existan las
 * credenciales: lo acumulado entra igual, en orden y sin digitar nada a mano.
 *
 * El índice único `(entity, ref_type, ref_id)` es lo que hace segura la
 * reejecución: encolar dos veces el mismo contacto no crea dos leads.
 */

import { createClient, type Client } from '@libsql/client'

/**
 * Qué se va a crear del otro lado. `crm_lead` y `campaigns_subscriber` están
 * implementados; las dos de Books esperan el mapeo (ver el final de `zohoMap.ts`).
 */
export const OUTBOX_ENTITIES = [
  'crm_lead',
  'campaigns_subscriber',
  'books_contact',
  'books_invoice',
] as const
export type OutboxEntity = (typeof OUTBOX_ENTITIES)[number]

export const OUTBOX_STATUSES = ['pendiente', 'sincronizado', 'fallido', 'descartado'] as const
export type OutboxStatus = (typeof OUTBOX_STATUSES)[number]

/**
 * Reintentos antes de marcar `fallido`. Al llegar aquí la fila deja de drenarse
 * sola pero no se borra: queda visible en el panel para reencolarla a mano una
 * vez arreglado lo que fallara (scope faltante, campo obligatorio, etc.).
 */
export const MAX_ATTEMPTS = 5

export interface OutboxItem {
  id: number
  entity: OutboxEntity
  /** Tabla de origen en la web: 'contact' | 'order'. */
  ref_type: string
  ref_id: number
  /** Foto de los datos en el momento de encolar, ya mapeada a campos de Zoho. */
  payload: Record<string, any>
  status: OutboxStatus
  attempts: number
  last_error: string
  /** Id que devolvió Zoho al crear el registro. */
  zoho_id: string
  created_at: string
  updated_at: string
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
    await db.execute(`CREATE TABLE IF NOT EXISTS zoho_outbox (
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
    )`)
    await db.execute(
      `CREATE UNIQUE INDEX IF NOT EXISTS zoho_outbox_unico ON zoho_outbox (entity, ref_type, ref_id)`,
    )
    await db.execute(
      `CREATE INDEX IF NOT EXISTS zoho_outbox_estado ON zoho_outbox (status, id)`,
    )
  })()
  return _ready
}

const now = () => new Date().toISOString()

function rowToItem(r: any): OutboxItem {
  let payload: Record<string, any> = {}
  try {
    payload = JSON.parse(String(r.payload || '{}'))
  } catch {
    // Payload corrupto: se reporta vacío para que el drenaje lo marque fallido
    // en vez de reventar el ciclo completo por una fila mala.
  }
  return {
    id: Number(r.id),
    entity: r.entity,
    ref_type: r.ref_type,
    ref_id: Number(r.ref_id),
    payload,
    status: (OUTBOX_STATUSES as readonly string[]).includes(r.status) ? r.status : 'pendiente',
    attempts: Number(r.attempts),
    last_error: r.last_error,
    zoho_id: r.zoho_id,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

export interface EnqueueInput {
  entity: OutboxEntity
  ref_type: string
  ref_id: number
  payload: Record<string, any>
}

/**
 * Encola un registro para Zoho. **Nunca lanza**: se llama desde el camino de un
 * formulario público y ningún problema de la bandeja puede costarle la
 * confirmación al visitante. Si la fila ya existía (mismo entity+ref), no hace
 * nada y devuelve `false`.
 */
export async function enqueue(input: EnqueueInput): Promise<boolean> {
  try {
    await ensureSchema()
    const ts = now()
    const res = await client().execute({
      sql: `INSERT OR IGNORE INTO zoho_outbox (entity,ref_type,ref_id,payload,status,attempts,last_error,zoho_id,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?)`,
      args: [
        input.entity, input.ref_type, input.ref_id,
        JSON.stringify(input.payload), 'pendiente', 0, '', '', ts, ts,
      ],
    })
    return Number(res.rowsAffected) > 0
  } catch (e: any) {
    console.error('[zoho-outbox] no se pudo encolar', input.entity, input.ref_type, input.ref_id, ':', e?.message || e)
    return false
  }
}

/** Filas listas para intentar, más viejas primero. */
export async function pendingItems(limit = 25): Promise<OutboxItem[]> {
  await ensureSchema()
  const res = await client().execute({
    sql: `SELECT * FROM zoho_outbox WHERE status = 'pendiente' AND attempts < ? ORDER BY id ASC LIMIT ?`,
    args: [MAX_ATTEMPTS, limit],
  })
  return res.rows.map(rowToItem)
}

export async function listOutbox(status?: OutboxStatus, limit = 200): Promise<OutboxItem[]> {
  await ensureSchema()
  const db = client()
  const res = status && (OUTBOX_STATUSES as readonly string[]).includes(status)
    ? await db.execute({ sql: 'SELECT * FROM zoho_outbox WHERE status = ? ORDER BY id DESC LIMIT ?', args: [status, limit] })
    : await db.execute({ sql: 'SELECT * FROM zoho_outbox ORDER BY id DESC LIMIT ?', args: [limit] })
  return res.rows.map(rowToItem)
}

export async function markSynced(id: number, zohoId: string): Promise<void> {
  await ensureSchema()
  await client().execute({
    sql: `UPDATE zoho_outbox SET status = 'sincronizado', zoho_id = ?, last_error = '', updated_at = ? WHERE id = ?`,
    args: [zohoId, now(), id],
  })
}

/**
 * Suma un intento y guarda el motivo. Al agotar `MAX_ATTEMPTS` la fila pasa a
 * `fallido` para que deje de consumir llamadas en cada drenaje.
 */
export async function markFailed(id: number, error: string): Promise<void> {
  await ensureSchema()
  await client().execute({
    sql: `UPDATE zoho_outbox
          SET attempts = attempts + 1,
              last_error = ?,
              status = CASE WHEN attempts + 1 >= ? THEN 'fallido' ELSE 'pendiente' END,
              updated_at = ?
          WHERE id = ?`,
    args: [String(error).slice(0, 500), MAX_ATTEMPTS, now(), id],
  })
}

/** Devuelve una fila `fallido` a la cola con el contador en cero. */
export async function retryItem(id: number): Promise<void> {
  await ensureSchema()
  await client().execute({
    sql: `UPDATE zoho_outbox SET status = 'pendiente', attempts = 0, last_error = '', updated_at = ? WHERE id = ?`,
    args: [now(), id],
  })
}

/** Saca una fila de la cola sin sincronizarla (duplicado, prueba, spam). */
export async function discardItem(id: number): Promise<void> {
  await ensureSchema()
  await client().execute({
    sql: `UPDATE zoho_outbox SET status = 'descartado', updated_at = ? WHERE id = ?`,
    args: [now(), id],
  })
}

export type OutboxStats = Record<OutboxStatus, number>

export async function outboxStats(): Promise<OutboxStats> {
  await ensureSchema()
  const res = await client().execute(`SELECT status, COUNT(*) AS n FROM zoho_outbox GROUP BY status`)
  const stats: OutboxStats = { pendiente: 0, sincronizado: 0, fallido: 0, descartado: 0 }
  for (const r of res.rows as any[]) {
    const s = String(r.status) as OutboxStatus
    if (s in stats) stats[s] = Number(r.n)
  }
  return stats
}
