import type { APIRoute } from 'astro'
import { listContacts, updateContactStatus, CONTACT_STATUSES, type ContactStatus } from '../../../lib/contactos'

export const prerender = false

export const GET: APIRoute = async ({ url }) => {
  try {
    const status = url.searchParams.get('status') || undefined
    const contacts = await listContacts(status)
    return json({ contacts })
  } catch (e: any) {
    return json({ error: String(e?.message || e) }, 500)
  }
}

export const PATCH: APIRoute = async ({ request, url }) => {
  const id = Number(url.searchParams.get('id'))
  if (!id) return json({ error: 'id requerido' }, 400)

  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }

  const status = String(b.status)
  if (!(CONTACT_STATUSES as readonly string[]).includes(status)) return json({ error: 'Estado inválido' }, 400)

  try {
    const contact = await updateContactStatus(id, status as ContactStatus)
    if (!contact) return json({ error: 'Contacto no encontrado' }, 404)
    return json({ ok: true, contact })
  } catch (e: any) {
    return json({ error: String(e?.message || e) }, 500)
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
}
