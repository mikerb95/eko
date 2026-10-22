import type { APIRoute } from 'astro'
import { fail, json } from '../../../../lib/apiError'
import { eliminarExpediente, guardarExpediente, listarExpedientes } from '../../../../lib/agente/datos'

export const prerender = false

export const GET: APIRoute = async () => {
  try {
    return json({ expedientes: await listarExpedientes() })
  } catch (e) {
    return fail('cumplimiento/expedientes', e)
  }
}

export const POST: APIRoute = async ({ request }) => {
  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }
  const cliente = String(b.cliente ?? '').trim()
  const numero = String(b.numero ?? '').trim()
  if (!cliente || !numero) return json({ error: 'Cliente y número de expediente son obligatorios' }, 400)
  try {
    const id = await guardarExpediente({
      id: b.id ? Number(b.id) : undefined,
      cliente,
      numero,
      nit: b.nit,
      autoridad: b.autoridad,
      tipo_permiso: b.tipo_permiso,
      responsable: b.responsable,
      responsable_email: b.responsable_email,
      notas: b.notas,
      activo: b.activo !== false,
    })
    return json({ ok: true, id })
  } catch (e) {
    return fail('cumplimiento/expedientes', e)
  }
}

export const DELETE: APIRoute = async ({ url }) => {
  const id = Number(url.searchParams.get('id'))
  if (!id) return json({ error: 'id requerido' }, 400)
  try {
    await eliminarExpediente(id)
    return json({ ok: true })
  } catch (e) {
    return fail('cumplimiento/expedientes', e)
  }
}
