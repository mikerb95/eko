import type { APIRoute } from 'astro'
import { syncPending } from '../../lib/zoho'
export const prerender = false
export const GET: APIRoute = async () => {
  const real = globalThis.fetch
  const capturado: string[] = []
  globalThis.fetch = (async (url: any, init: any) => {
    const u = String(url)
    capturado.push(`${init?.method || 'GET'} ${u}`)
    if (u.includes('accounts.zoho')) {
      return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), {
        headers: { 'content-type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ status: 'success', code: '0', message: 'ok' }), {
      headers: { 'content-type': 'application/json' },
    })
  }) as any
  const res = await syncPending(10)
  globalThis.fetch = real
  return new Response(JSON.stringify({ res, capturado }, null, 2), {
    headers: { 'content-type': 'application/json' },
  })
}
