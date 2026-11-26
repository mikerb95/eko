/**
 * Cliente de Siigo API (Siigo Nube Colombia). Solo lo que usa el panel, y
 * solo lectura salvo pedir reportes (que crean un Excel, no tocan la
 * contabilidad).
 *
 * Variables de entorno (ver `.env.example`):
 *   SIIGO_USERNAME    usuario API (el correo del usuario en Siigo Nube)
 *   SIIGO_ACCESS_KEY  la llave de "Mi credencial API" (Siigo Nube → Alianzas)
 *   SIIGO_PARTNER_ID  nombre de esta aplicación ante Siigo, 3 a 100 letras o
 *                     números sin espacios. Por defecto `EkosolvPanel`.
 *   SIIGO_URL         solo para pruebas (simulador); por defecto la de Siigo.
 * Si faltan usuario o llave, `siigoConfigurado()` es false y quien llama
 * sigue sin cifras de Siigo.
 *
 * Reglas de Siigo que se respetan aquí (developers.siigo.com):
 * - El token dura 24 horas. Se cachea en memoria y se renueva 5 minutos antes;
 *   un 401 fuerza un token nuevo una sola vez.
 * - Máximo 100 peticiones por minuto por empresa (10 en la de pruebas). Un 429
 *   se reintenta con espera creciente, hasta 3 veces.
 * - Si más del 80 % de las peticiones fallan durante 7 días, Siigo bloquea el
 *   usuario: por eso no se reintenta nada que no sea 429 o 401, y los
 *   listados tienen tope de páginas.
 */

const TOKEN_MARGEN_MS = 5 * 60 * 1000
/** Lecturas. */
const TIMEOUT_MS = 60_000
/** Siigo recomienda 120 s o más para lo que genera algo (el balance en Excel). */
const TIMEOUT_POST_MS = 120_000
const REINTENTOS_429 = 3
export const TAMANO_PAGINA = 100
export const MAX_PAGINAS = 20

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (globalThis as any)?.process?.env?.[key] || ''
}

const base = () => (env('SIIGO_URL') || 'https://api.siigo.com').replace(/\/+$/, '')
const partnerId = () => (env('SIIGO_PARTNER_ID') || 'EkosolvPanel').replace(/[^A-Za-z0-9]/g, '').slice(0, 100)

export function siigoConfigurado(): boolean {
  return Boolean(env('SIIGO_USERNAME') && env('SIIGO_ACCESS_KEY'))
}

export class SiigoError extends Error {
  readonly status: number
  readonly codigo: string
  constructor(message: string, status: number, codigo = '') {
    super(message)
    this.name = 'SiigoError'
    this.status = status
    this.codigo = codigo
  }
}

/** Primer error del formato de Siigo: `{ Status, Errors: [{ Code, Message }] }`. */
function errorDe(status: number, body: any): SiigoError {
  const e = Array.isArray(body?.Errors) ? body.Errors[0] : null
  const msg = e?.Message || body?.message || body?.error || `respondió ${status}`
  return new SiigoError(`Siigo: ${msg}`, status, String(e?.Code || ''))
}

// ------------------------------------------------------------------- token

let _token: { valor: string; vence: number } | null = null
let _pidiendo: Promise<string> | null = null

/** Para las pruebas: olvidar el token cacheado. */
export function _reiniciarToken() {
  _token = null
  _pidiendo = null
}

async function pedirToken(): Promise<string> {
  const r = await fetch(`${base()}/auth`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'Partner-Id': partnerId() },
    body: JSON.stringify({ username: env('SIIGO_USERNAME'), access_key: env('SIIGO_ACCESS_KEY') }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const body = await r.json().catch(() => null)
  if (!r.ok || !body?.access_token) throw errorDe(r.status, body)
  const segundos = Number(body.expires_in) || 86400
  _token = { valor: String(body.access_token), vence: Date.now() + segundos * 1000 }
  return _token.valor
}

async function token(forzar = false): Promise<string> {
  if (!forzar && _token && _token.vence - TOKEN_MARGEN_MS > Date.now()) return _token.valor
  if (!_pidiendo) _pidiendo = pedirToken().finally(() => (_pidiendo = null))
  return _pidiendo
}

// ------------------------------------------------------------------- peticiones

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Milisegundos a esperar tras un 429: Retry-After si viene, si no 2, 4, 8 s. */
function espera429(r: Response, intento: number): number {
  const ra = Number(r.headers.get('retry-after'))
  if (Number.isFinite(ra) && ra > 0) return Math.min(ra, 30) * 1000
  return 2000 * 2 ** intento
}

/** Para las pruebas: no esperar de verdad entre reintentos. */
export const _ajustes = { esperar }

type Query = Record<string, string | number | boolean | undefined | null>

export async function siigoFetch(ruta: string, opts: { metodo?: 'GET' | 'POST'; query?: Query; cuerpo?: unknown } = {}): Promise<any> {
  if (!siigoConfigurado()) throw new SiigoError('Siigo no está conectado (faltan SIIGO_USERNAME y SIIGO_ACCESS_KEY).', 0, 'sin_credenciales')
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  const url = `${base()}${ruta}${qs.size ? `?${qs}` : ''}`
  let renovado = false
  for (let intento = 0; ; intento++) {
    const r = await fetch(url, {
      method: opts.metodo ?? 'GET',
      headers: {
        Authorization: `Bearer ${await token(false)}`,
        'Partner-Id': partnerId(),
        'content-type': 'application/json',
      },
      body: opts.cuerpo === undefined ? undefined : JSON.stringify(opts.cuerpo),
      signal: AbortSignal.timeout(opts.metodo === 'POST' ? TIMEOUT_POST_MS : TIMEOUT_MS),
    })
    if (r.status === 401 && !renovado) {
      renovado = true
      await token(true)
      continue
    }
    if (r.status === 429 && intento < REINTENTOS_429) {
      await _ajustes.esperar(espera429(r, intento))
      continue
    }
    const body = await r.json().catch(() => null)
    if (!r.ok) throw errorDe(r.status, body)
    return body
  }
}

/**
 * Recorre un listado paginado de Siigo (`{ pagination, results }`). Se
 * detiene en la última página o en `maxPaginas`; `truncado` avisa si quedó
 * algo por fuera, para no presentar un total incompleto como si fuera todo.
 */
export async function siigoTodas<T = any>(ruta: string, query: Query = {}, maxPaginas = MAX_PAGINAS): Promise<{ filas: T[]; truncado: boolean }> {
  const filas: T[] = []
  for (let page = 1; page <= maxPaginas; page++) {
    const body = await siigoFetch(ruta, { query: { ...query, page, page_size: TAMANO_PAGINA } })
    const res: T[] = Array.isArray(body?.results) ? body.results : Array.isArray(body) ? body : []
    filas.push(...res)
    const total = Number(body?.pagination?.total_results)
    const fin = res.length < TAMANO_PAGINA || (Number.isFinite(total) && filas.length >= total)
    if (fin) return { filas, truncado: false }
  }
  return { filas, truncado: true }
}
