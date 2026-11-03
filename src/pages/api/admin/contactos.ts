import type { APIRoute } from 'astro'
import { json, fail } from '../../../lib/apiError'
import { listContacts, updateContact, CONTACT_STATUSES, type ContactPatch, type ContactStatus } from '../../../lib/contactos'

export const prerender = false

export const GET: APIRoute = async ({ url }) => {
  try {
    const status = url.searchParams.get('status') || undefined
    const contacts = await listContacts(status)
    return json({ contacts })
  } catch (e: any) {
    return fail('contactos', e)
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

  // Llega el estado, el responsable o ambos.
  const patch: ContactPatch = {}
  if (b.status !== undefined) {
    const status = String(b.status)
    if (!(CONTACT_STATUSES as readonly string[]).includes(status)) return json({ error: 'Estado inválido' }, 400)
    patch.status = status as ContactStatus
  }
  if (b.assigned_to !== undefined) patch.assigned_to = String(b.assigned_to ?? '')
  if (patch.status === undefined && patch.assigned_to === undefined) return json({ error: 'Nada que cambiar' }, 400)

  try {
    const contact = await updateContact(id, patch)
    if (!contact) return json({ error: 'Contacto no encontrado' }, 404)
    return json({ ok: true, contact })
  } catch (e: any) {
    return fail('contactos', e)
  }
}
