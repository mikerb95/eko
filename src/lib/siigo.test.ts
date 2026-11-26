import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { _ajustes, _reiniciarToken, siigoConfigurado, siigoFetch, siigoTodas, SiigoError, TAMANO_PAGINA } from './siigo.ts'

type Llamada = { url: string; init: RequestInit }
const fetchOriginal = globalThis.fetch
const envOriginal = { ...process.env }
let llamadas: Llamada[] = []
let respuestas: ((u: string, init: RequestInit) => Response)[] = []

const json = (status: number, body: unknown, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })
const tokenOk = () => json(201, { access_token: 'tok-1', expires_in: 86400, token_type: 'Bearer', scope: 'Siigo API' })

beforeEach(() => {
  process.env.SIIGO_USERNAME = 'api@ekosolv.test'
  process.env.SIIGO_ACCESS_KEY = 'llave'
  process.env.SIIGO_PARTNER_ID = 'Ekosolv Panel!'
  process.env.SIIGO_URL = 'https://siigo.simulado'
  _reiniciarToken()
  _ajustes.esperar = async () => {}
  llamadas = []
  respuestas = []
  globalThis.fetch = (async (u: string, init: RequestInit) => {
    llamadas.push({ url: String(u), init })
    const r = respuestas.shift()
    if (!r) throw new Error(`fetch inesperado a ${u}`)
    return r(String(u), init)
  }) as typeof fetch
})

afterEach(() => {
  globalThis.fetch = fetchOriginal
  process.env = { ...envOriginal }
})

const header = (l: Llamada, h: string) => new Headers(l.init.headers).get(h)

test('sin credenciales no está configurado y no llama a Siigo', async () => {
  delete process.env.SIIGO_ACCESS_KEY
  assert.equal(siigoConfigurado(), false)
  await assert.rejects(siigoFetch('/v1/purchases'), (e: any) => e instanceof SiigoError && e.codigo === 'sin_credenciales')
  assert.equal(llamadas.length, 0)
})

test('pide token una vez, lo reusa y manda Partner-Id limpio', async () => {
  respuestas.push(tokenOk, () => json(200, { results: [] }), () => json(200, { results: [] }))
  await siigoFetch('/v1/purchases', { query: { date_start: '2026-11-01', vacio: '' } })
  await siigoFetch('/v1/accounts-payable')
  assert.equal(llamadas.length, 3)
  assert.equal(llamadas[0]!.url, 'https://siigo.simulado/auth')
  assert.deepEqual(JSON.parse(String(llamadas[0]!.init.body)), { username: 'api@ekosolv.test', access_key: 'llave' })
  assert.equal(llamadas[1]!.url, 'https://siigo.simulado/v1/purchases?date_start=2026-11-01')
  assert.equal(header(llamadas[1]!, 'authorization'), 'Bearer tok-1')
  assert.equal(header(llamadas[1]!, 'partner-id'), 'EkosolvPanel')
})

test('un 401 renueva el token una sola vez', async () => {
  respuestas.push(tokenOk, () => json(401, { Errors: [{ Code: 'unauthorized', Message: 'Token vencido' }] }), () => json(201, { access_token: 'tok-2', expires_in: 86400 }), () => json(200, { ok: 1 }))
  const r = await siigoFetch('/v1/purchases')
  assert.deepEqual(r, { ok: 1 })
  assert.equal(header(llamadas[3]!, 'authorization'), 'Bearer tok-2')
})

test('un 429 se reintenta con espera y luego responde', async () => {
  const esperas: number[] = []
  _ajustes.esperar = async (ms: number) => { esperas.push(ms) }
  respuestas.push(tokenOk, () => json(429, { Errors: [{ Code: 'requests_limit' }] }, { 'retry-after': '3' }), () => json(429, {}), () => json(200, { ok: 1 }))
  assert.deepEqual(await siigoFetch('/v1/purchases'), { ok: 1 })
  assert.deepEqual(esperas, [3000, 4000])
})

test('otros errores no se reintentan y traen el mensaje de Siigo', async () => {
  respuestas.push(tokenOk, () => json(400, { Status: 400, Errors: [{ Code: 'invalid_range', Message: 'El mes debe estar entre 1 y 13' }] }))
  await assert.rejects(siigoFetch('/v1/test-balance-report', { metodo: 'POST', cuerpo: {} }), (e: any) => e.status === 400 && e.codigo === 'invalid_range' && /entre 1 y 13/.test(e.message))
  assert.equal(llamadas.length, 2)
})

test('recorre páginas hasta la última y avisa si se corta', async () => {
  const pagina = (n: number, total: number) => () => json(200, { pagination: { page: n, page_size: TAMANO_PAGINA, total_results: total }, results: Array.from({ length: Math.min(TAMANO_PAGINA, total - (n - 1) * TAMANO_PAGINA) }, (_, i) => ({ i })) })
  respuestas.push(tokenOk, pagina(1, 230), pagina(2, 230), pagina(3, 230))
  const r = await siigoTodas('/v1/purchases', { date_start: '2026-08-01' })
  assert.equal(r.filas.length, 230)
  assert.equal(r.truncado, false)
  assert.ok(llamadas[3]!.url.includes('page=3&page_size=100'))

  _reiniciarToken()
  respuestas.push(tokenOk, pagina(1, 500), pagina(2, 500))
  const corto = await siigoTodas('/v1/purchases', {}, 2)
  assert.equal(corto.filas.length, 200)
  assert.equal(corto.truncado, true)
})
