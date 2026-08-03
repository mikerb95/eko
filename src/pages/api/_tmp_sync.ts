import type { APIRoute } from 'astro'
import { syncPending } from '../../lib/zoho'
export const prerender = false
export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await syncPending(10)), { headers: { 'content-type': 'application/json' } })
