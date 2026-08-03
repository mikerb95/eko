import type { APIRoute } from 'astro'
import { json, fail } from '../../../lib/apiError'
import { syncPending, zohoConfigured, booksConfigured } from '../../../lib/zoho'
import {
  listOutbox,
  outboxStats,
  retryItem,
  discardItem,
  OUTBOX_STATUSES,
  type OutboxStatus,
} from '../../../lib/zohoOutbox'

export const prerender = false

// Bandeja de salida hacia Zoho. Solo admin (regla en src/middleware.ts).
//
//   GET  /api/admin/zoho              → estado de la conexión + conteos
//   GET  /api/admin/zoho?status=fallido → filas de ese estado
//   POST /api/admin/zoho {action:'sync'}            → drena lo pendiente
//   POST /api/admin/zoho {action:'retry', id}       → reencola una fila fallida
//   POST /api/admin/zoho {action:'discard', id}     → la saca de la cola

export const GET: APIRoute = async ({ url }) => {
  try {
    const status = url.searchParams.get('status') || ''
    if (status) {
      if (!(OUTBOX_STATUSES as readonly string[]).includes(status)) {
        return json({ error: 'Estado inválido' }, 400)
      }
      return json({ items: await listOutbox(status as OutboxStatus) })
    }
    return json({
      configurado: zohoConfigured(),
      books: booksConfigured(),
      conteos: await outboxStats(),
    })
  } catch (e: any) {
    return fail('zoho', e)
  }
}

export const POST: APIRoute = async ({ request }) => {
  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }

  const action = String(b.action || '')
  const id = Number(b.id)

  try {
    if (action === 'sync') {
      const result = await syncPending(Number(b.limit) || 25)
      if (!result.ran && result.reason === 'not_configured') {
        return json(
          { error: 'Zoho no está configurado. Faltan ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET / ZOHO_REFRESH_TOKEN.' },
          409,
        )
      }
      return json({ ok: true, ...result, conteos: await outboxStats() })
    }
    if (action === 'retry') {
      if (!id) return json({ error: 'id requerido' }, 400)
      await retryItem(id)
      return json({ ok: true })
    }
    if (action === 'discard') {
      if (!id) return json({ error: 'id requerido' }, 400)
      await discardItem(id)
      return json({ ok: true })
    }
    return json({ error: 'Acción no reconocida' }, 400)
  } catch (e: any) {
    return fail('zoho', e)
  }
}
