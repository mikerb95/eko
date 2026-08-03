/**
 * Cliente de Zoho (CRM y Books) y drenaje de la bandeja de salida.
 *
 * Misma regla de oro que `email.ts`: **esto nunca puede tumbar una solicitud**.
 * Ninguna función expuesta aquí lanza en el camino de un formulario público; el
 * que sí puede fallar es el drenaje, y falla contra la bandeja
 * (`zoho_outbox`), no contra el visitante.
 *
 * Variables de entorno (ver `.env.example`):
 *   ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET  — del self-client de Zoho API Console
 *   ZOHO_REFRESH_TOKEN                   — se genera una vez, no expira
 *   ZOHO_DC                              — datacenter de la cuenta: com, eu, in...
 *   ZOHO_BOOKS_ORG_ID                    — solo si se usa Books
 * Si falta cualquiera de las cuatro primeras, todo esto queda en no-op: las
 * solicitudes se siguen encolando y el día que aparezcan las credenciales se
 * drena lo acumulado. Nada se pierde en el intervalo.
 *
 * El access token de Zoho dura una hora; el refresh token no caduca. Aquí se
 * cachea el access token en memoria del proceso y se renueva un minuto antes de
 * vencer.
 */

import {
  pendingItems,
  markSynced,
  markFailed,
  enqueue,
  type OutboxItem,
} from './zohoOutbox'
import {
  contactToLead,
  orderToLead,
  contactToSubscriber,
  orderToSubscriber,
  type ZohoLead,
  type ZohoSubscriber,
} from './zohoMap'
import type { Contact } from './contactos'
import type { Order } from './ops'

const TIMEOUT_MS = 10000
/** El token dura 3600s; se renueva antes para no pillar el borde. */
const TOKEN_SKEW_MS = 60 * 1000
const CRM_VERSION = 'v8'

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (globalThis as any)?.process?.env?.[key] || ''
}

/** Datacenter de la cuenta. Una cuenta creada en `.com` no responde en `.eu`. */
function dc(): string {
  return env('ZOHO_DC') || 'com'
}

/** ¿Están las credenciales completas? */
export function zohoConfigured(): boolean {
  return Boolean(env('ZOHO_CLIENT_ID') && env('ZOHO_CLIENT_SECRET') && env('ZOHO_REFRESH_TOKEN'))
}

export function booksConfigured(): boolean {
  return zohoConfigured() && Boolean(env('ZOHO_BOOKS_ORG_ID'))
}

// ------------------------------------------------------------------- OAuth

let _token: { value: string; expiresAt: number } | null = null
let _refreshing: Promise<string> | null = null

async function fetchToken(): Promise<string> {
  const params = new URLSearchParams({
    refresh_token: env('ZOHO_REFRESH_TOKEN'),
    client_id: env('ZOHO_CLIENT_ID'),
    client_secret: env('ZOHO_CLIENT_SECRET'),
    grant_type: 'refresh_token',
  })

  const res = await fetch(`https://accounts.zoho.${dc()}/oauth/v2/token?${params}`, {
    method: 'POST',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const body: any = await res.json().catch(() => ({}))

  // Zoho devuelve 200 con `{ error: "invalid_client" }` en vez de un 4xx, así
  // que no basta con mirar el status.
  if (!res.ok || body?.error || !body?.access_token) {
    throw new Error(`OAuth falló (${res.status}): ${body?.error || 'sin access_token'}`)
  }

  const ttl = Number(body.expires_in || 3600) * 1000
  _token = { value: body.access_token, expiresAt: Date.now() + ttl - TOKEN_SKEW_MS }
  return _token.value
}

/**
 * Token válido, renovándolo si hace falta. Varias llamadas simultáneas
 * comparten una sola renovación: Zoho limita cuántos access tokens se pueden
 * pedir por minuto y pedir cinco en paralelo es una forma tonta de gastarlos.
 */
async function accessToken(): Promise<string> {
  if (_token && Date.now() < _token.expiresAt) return _token.value
  if (_refreshing) return _refreshing
  _refreshing = fetchToken().finally(() => {
    _refreshing = null
  })
  return _refreshing
}

// -------------------------------------------------------------- HTTP básico

interface ZohoResponse {
  status: number
  body: any
}

async function call(url: string, init: RequestInit = {}): Promise<ZohoResponse> {
  const token = await accessToken()
  const res = await fetch(url, {
    ...init,
    headers: {
      authorization: `Zoho-oauthtoken ${token}`,
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  // 204 = sin resultados (una búsqueda que no encontró nada), no es un error.
  if (res.status === 204) return { status: 204, body: null }
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

/** Llamada a la API de Zoho CRM. `path` es relativo al módulo: 'Leads', 'Deals/123'. */
export async function crmFetch(path: string, init: RequestInit = {}): Promise<ZohoResponse> {
  return call(`https://www.zohoapis.${dc()}/crm/${CRM_VERSION}/${path}`, init)
}

/**
 * Llamada a la API de Zoho Books. Books exige `organization_id` en toda
 * petición, así que se inyecta aquí y no en cada sitio de llamada.
 */
export async function booksFetch(path: string, init: RequestInit = {}): Promise<ZohoResponse> {
  const org = env('ZOHO_BOOKS_ORG_ID')
  if (!org) throw new Error('ZOHO_BOOKS_ORG_ID no está configurado')
  const sep = path.includes('?') ? '&' : '?'
  return call(`https://www.zohoapis.${dc()}/books/v3/${path}${sep}organization_id=${encodeURIComponent(org)}`, init)
}

// -------------------------------------------------------------------- Leads

/** Escapa los caracteres que rompen la sintaxis de `criteria` en Zoho. */
function criteriaValue(value: string): string {
  return value.replace(/[()]/g, '')
}

/**
 * Busca un lead por email. Devuelve el id o `null`.
 * Es lo que evita que un cliente que escribe tres veces genere tres leads.
 */
export async function findLeadByEmail(email: string): Promise<string | null> {
  if (!email) return null
  const criteria = encodeURIComponent(`(Email:equals:${criteriaValue(email)})`)
  const { status, body } = await crmFetch(`Leads/search?criteria=${criteria}`)
  if (status === 204 || !body?.data?.length) return null
  if (status >= 400) throw new Error(`búsqueda falló (${status}): ${zohoError(body)}`)
  return String(body.data[0].id)
}

/** Mensaje legible de un cuerpo de error de Zoho, para guardarlo en la bandeja. */
function zohoError(body: any): string {
  const detail = body?.data?.[0] ?? body
  const code = detail?.code ? `${detail.code}: ` : ''
  const message = detail?.message || JSON.stringify(body ?? {}).slice(0, 300)
  const field = detail?.details?.api_name ? ` (campo ${detail.details.api_name})` : ''
  return `${code}${message}${field}`
}

/**
 * Crea el lead si no existe uno con ese email. Devuelve el id de Zoho.
 * Lanza si Zoho rechaza: quien llama es el drenaje, que sabe qué hacer con el
 * error (contarlo como intento y dejar la fila pendiente).
 */
export async function upsertLead(lead: ZohoLead): Promise<string> {
  const existing = await findLeadByEmail(lead.Email || '')
  if (existing) return existing

  const { status, body } = await crmFetch('Leads', {
    method: 'POST',
    body: JSON.stringify({ data: [lead] }),
  })

  const row = body?.data?.[0]
  if (status >= 400 || row?.status === 'error') {
    // DUPLICATE_DATA: alguien lo creó entre la búsqueda y el POST. No es un
    // fallo, es la carrera esperada; nos quedamos con el id que Zoho reporta.
    if (row?.code === 'DUPLICATE_DATA' && row?.details?.id) return String(row.details.id)
    throw new Error(`creación falló (${status}): ${zohoError(body)}`)
  }
  const id = row?.details?.id
  if (!id) throw new Error(`Zoho no devolvió id: ${JSON.stringify(body ?? {}).slice(0, 200)}`)
  return String(id)
}

// ------------------------------------------------------------------ Encolado
//
// Lo que llaman los endpoints públicos. Se encola siempre, haya o no
// credenciales: la bandeja es justamente el puente hasta que las haya.

/** Encola el mensaje de contacto como lead. No lanza. */
export async function queueContactAsLead(contact: Contact): Promise<void> {
  if (!contact.id) return
  await enqueue({
    entity: 'crm_lead',
    ref_type: 'contact',
    ref_id: contact.id,
    payload: contactToLead(contact),
  })
}

/** Encola la solicitud de recolección como lead. No lanza. */
export async function queueOrderAsLead(order: Order): Promise<void> {
  if (!order.id) return
  await enqueue({
    entity: 'crm_lead',
    ref_type: 'order',
    ref_id: order.id,
    payload: orderToLead(order),
  })
}

// ------------------------------------------------------------------ Drenaje

/** Manda una fila de la bandeja a Zoho y devuelve el id creado. */
async function push(item: OutboxItem): Promise<string> {
  switch (item.entity) {
    case 'crm_lead':
      if (!item.payload?.Last_Name) throw new Error('payload sin Last_Name')
      return upsertLead(item.payload as ZohoLead)
    case 'books_contact':
    case 'books_invoice':
      // Ver la nota final de `zohoMap.ts`: el mapeo de Books está pendiente de
      // definición con administración. La fila se queda pendiente, no se pierde.
      throw new Error(`entidad ${item.entity} sin mapeo definido todavía`)
    default:
      throw new Error(`entidad desconocida: ${item.entity}`)
  }
}

export interface SyncResult {
  ran: boolean
  reason?: string
  synced: number
  failed: number
  /** Filas que seguían pendientes al empezar este drenaje. */
  attempted: number
}

/**
 * Drena la bandeja. Es el único punto que habla con Zoho de verdad.
 *
 * Se puede llamar desde el panel (botón "sincronizar"), desde un cron, o
 * diferido tras un envío del formulario. Es idempotente: lo ya sincronizado no
 * se reintenta, y `upsertLead` busca por email antes de crear.
 */
export async function syncPending(limit = 25): Promise<SyncResult> {
  if (!zohoConfigured()) {
    return { ran: false, reason: 'not_configured', synced: 0, failed: 0, attempted: 0 }
  }

  let items: OutboxItem[]
  try {
    items = await pendingItems(limit)
  } catch (e: any) {
    console.error('[zoho] no se pudo leer la bandeja:', e?.message || e)
    return { ran: false, reason: 'db_error', synced: 0, failed: 0, attempted: 0 }
  }

  let synced = 0
  let failed = 0
  for (const item of items) {
    try {
      const id = await push(item)
      await markSynced(item.id, id)
      synced++
    } catch (e: any) {
      const reason = e?.name === 'TimeoutError' ? 'timeout' : e?.message || String(e)
      console.error(`[zoho] fila ${item.id} (${item.entity}) falló:`, reason)
      await markFailed(item.id, reason)
      failed++
      // Un fallo de autenticación afecta a todas las filas por igual: seguir
      // gastando intentos sería quemar la cola entera por el mismo motivo.
      if (/OAuth falló|INVALID_TOKEN|OAUTH_SCOPE_MISMATCH/i.test(reason)) {
        console.error('[zoho] problema de credenciales; se detiene el drenaje')
        break
      }
    }
  }

  return { ran: true, synced, failed, attempted: items.length }
}
