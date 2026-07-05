import type { APIRoute } from 'astro'
import { listOrders, getOrderById, getOrderEvents, updateOrder, ORDER_STATUSES, type OrderUpdate, type OrderStatus } from '../../../lib/ops'

export const prerender = false

export const GET: APIRoute = async ({ url }) => {
  const id = Number(url.searchParams.get('id'))
  try {
    if (id) {
      const order = await getOrderById(id)
      if (!order) return json({ error: 'Orden no encontrada' }, 404)
      const events = await getOrderEvents(id)
      return json({ order, events })
    }
    const status = url.searchParams.get('status') || undefined
    const orders = await listOrders(status)
    return json({ orders })
  } catch (e: any) {
    return json({ error: String(e?.message || e) }, 500)
  }
}

export const PATCH: APIRoute = async ({ request, url, locals }) => {
  const id = Number(url.searchParams.get('id'))
  if (!id) return json({ error: 'id requerido' }, 400)

  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }

  const patch: OrderUpdate = {}
  if (b.status !== undefined) {
    const s = String(b.status)
    if (!(ORDER_STATUSES as readonly string[]).includes(s)) return json({ error: 'Estado inválido' }, 400)
    patch.status = s as OrderStatus
  }
  if (b.assigned_to !== undefined) patch.assigned_to = String(b.assigned_to).trim().slice(0, 100)
  if (b.scheduled_at !== undefined) patch.scheduled_at = String(b.scheduled_at).trim().slice(0, 40)
  if (b.internal_notes !== undefined) patch.internal_notes = String(b.internal_notes).trim().slice(0, 4000)
  if (b.note !== undefined && String(b.note).trim()) patch.note = String(b.note).trim().slice(0, 1000)

  try {
    const order = await updateOrder(id, patch, (locals as any).user || 'admin')
    if (!order) return json({ error: 'Orden no encontrada' }, 404)
    return json({ ok: true, order })
  } catch (e: any) {
    return json({ error: String(e?.message || e) }, 500)
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
}
